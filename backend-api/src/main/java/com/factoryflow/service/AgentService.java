package com.factoryflow.service;

import com.factoryflow.dto.AlarmRequest;
import com.factoryflow.dto.DiagnosisResponse;
import com.factoryflow.model.Incident;
import com.factoryflow.model.Machine;
import com.factoryflow.model.MaintenanceReport;
import com.factoryflow.model.ShiftHandoff;
import com.factoryflow.repository.IncidentRepository;
import com.factoryflow.repository.MachineRepository;
import com.factoryflow.repository.MaintenanceReportRepository;
import com.factoryflow.repository.ShiftHandoffRepository;
import org.springframework.stereotype.Service;

import org.springframework.web.reactive.function.client.WebClient;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AgentService {

    private final WebClient agentWebClient;
    private final IncidentRepository incidentRepository;
    private final MachineRepository machineRepository;
    private final MaintenanceReportRepository reportRepository;
    private final ShiftHandoffRepository handoffRepository;

    public AgentService(
            WebClient agentWebClient,
            IncidentRepository incidentRepository,
            MachineRepository machineRepository,
            MaintenanceReportRepository reportRepository,
            ShiftHandoffRepository handoffRepository
    ) {
        this.agentWebClient = agentWebClient;
        this.incidentRepository = incidentRepository;
        this.machineRepository = machineRepository;
        this.reportRepository = reportRepository;
        this.handoffRepository = handoffRepository;
    }

    @SuppressWarnings("unchecked")
    public DiagnosisResponse diagnose(AlarmRequest request) {
        // 1. Resolve machine if provided
        Machine machine = null;
        if (request.getMachineName() != null && !request.getMachineName().isBlank()) {
            machine = machineRepository.findByNameIgnoreCase(request.getMachineName()).orElse(null);
        }

        // 2. Open incident record
        Incident incident = new Incident();
        incident.setMachine(machine);
        incident.setOperatorInput(request.getOperatorInput());
        incident.setShift(request.getShift());
        incident.setResolutionStatus("open");
        incident.setCreatedAt(OffsetDateTime.now());
        incident = incidentRepository.save(incident);

        // 3. Call Python agent
        Map<String, Object> payload = new HashMap<>();
        payload.put("operator_input", request.getOperatorInput());
        if (request.getShift() != null) payload.put("shift", request.getShift());

        Map<String, Object> agentResult = agentWebClient
                .post()
                .uri("/invoke")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (agentResult == null) {
            throw new RuntimeException("Agent service returned null response");
        }

        // 4. Persist diagnosis to incident
        Map<String, Object> diagnosis = (Map<String, Object>) agentResult.get("diagnosis");
        Map<String, Object> report = (Map<String, Object>) agentResult.get("report");
        Map<String, Object> handoff = (Map<String, Object>) agentResult.get("handoff");

        if (diagnosis != null) {
            incident.setAlarmCode((String) agentResult.get("alarm_code"));
            incident.setProbableCause((String) diagnosis.get("probable_cause"));
            incident.setRecommendedFix((String) diagnosis.get("recommended_fix"));
            incident.setResolutionStatus("resolved");
            incident.setResolvedAt(OffsetDateTime.now());

            Object cs = agentResult.get("confidence_score");
            if (cs instanceof Number) incident.setConfidenceScore(((Number) cs).doubleValue());

            Object dtm = diagnosis.get("estimated_downtime_minutes");
            if (dtm instanceof Number) incident.setEstimatedDowntimeMinutes(((Number) dtm).intValue());

            incident = incidentRepository.save(incident);
        }

        // 5. Persist maintenance report
        if (report != null && incident.getId() != null) {
            MaintenanceReport mr = new MaintenanceReport();
            mr.setIncidentId(incident.getId());
            mr.setIssueSummary((String) report.get("issue_summary"));
            mr.setRootCause((String) report.get("root_cause"));
            mr.setResolutionSteps((String) report.get("resolution_steps"));
            mr.setPartsReplaced((String) report.get("parts_replaced"));
            Object dtm = report.get("downtime_minutes");
            if (dtm instanceof Number) mr.setDowntimeMinutes(((Number) dtm).intValue());
            mr.setRecommendations((String) report.get("recommendations"));
            mr.setCreatedAt(OffsetDateTime.now());
            reportRepository.save(mr);
        }

        // 6. Persist shift handoff
        if (handoff != null && incident.getId() != null) {
            ShiftHandoff sh = new ShiftHandoff();
            sh.setIncidentId(incident.getId());
            sh.setMachineStatus((String) handoff.get("machine_status"));
            sh.setActionsTaken((String) handoff.get("actions_taken"));
            sh.setPendingWork((String) handoff.get("pending_work"));
            sh.setRecommendationsNext((String) handoff.get("recommendations_next"));
            sh.setCreatedAt(OffsetDateTime.now());
            handoffRepository.save(sh);
        }

        // 7. Build response
        DiagnosisResponse response = new DiagnosisResponse();
        response.setIncidentId(incident.getId());
        response.setAlarmCode((String) agentResult.get("alarm_code"));
        response.setMachineType((String) agentResult.get("machine_type"));
        response.setSeverity((String) agentResult.get("severity"));
        response.setDiagnosis(diagnosis);
        response.setReport(report);
        response.setHandoff(handoff);
        Object cs = agentResult.get("confidence_score");
        if (cs instanceof Number) response.setConfidenceScore(((Number) cs).doubleValue());
        response.setReasoningLog(
                (java.util.List<Map<String, Object>>) agentResult.get("reasoning_log"));

        return response;
    }
}
