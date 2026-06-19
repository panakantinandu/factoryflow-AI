package com.factoryflow.controller;

import com.factoryflow.dto.AlarmRequest;
import com.factoryflow.dto.DiagnosisResponse;
import com.factoryflow.model.Incident;
import com.factoryflow.model.MaintenanceReport;
import com.factoryflow.model.ShiftHandoff;
import com.factoryflow.repository.IncidentRepository;
import com.factoryflow.repository.MaintenanceReportRepository;
import com.factoryflow.repository.ShiftHandoffRepository;
import com.factoryflow.service.AgentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class IncidentController {

    private final AgentService agentService;
    private final IncidentRepository incidentRepository;
    private final MaintenanceReportRepository reportRepository;
    private final ShiftHandoffRepository handoffRepository;

    public IncidentController(
            AgentService agentService,
            IncidentRepository incidentRepository,
            MaintenanceReportRepository reportRepository,
            ShiftHandoffRepository handoffRepository
    ) {
        this.agentService = agentService;
        this.incidentRepository = incidentRepository;
        this.reportRepository = reportRepository;
        this.handoffRepository = handoffRepository;
    }

    /** POST /api/diagnose */
    @PostMapping("/diagnose")
    public ResponseEntity<DiagnosisResponse> diagnose(@Valid @RequestBody AlarmRequest request) {
        return ResponseEntity.ok(agentService.diagnose(request));
    }

    /**
     * GET /api/incidents?page=0&size=20&alarmCode=E217&status=resolved
     * Paginated, filterable incident list.
     */
    @GetMapping("/incidents")
    public ResponseEntity<Page<Incident>> incidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String alarmCode,
            @RequestParam(required = false) String status
    ) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Incident> result;
        if (alarmCode != null && !alarmCode.isBlank()) {
            result = incidentRepository.findByAlarmCode(alarmCode, pageable);
        } else if (status != null && !status.isBlank()) {
            result = incidentRepository.findByResolutionStatus(status, pageable);
        } else {
            result = incidentRepository.findAll(pageable);
        }

        return ResponseEntity.ok(result);
    }

    /** GET /api/incidents/{id} */
    @GetMapping("/incidents/{id}")
    public ResponseEntity<Incident> getIncident(@PathVariable Integer id) {
        return incidentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/incidents/{id}/report */
    @GetMapping("/incidents/{id}/report")
    public ResponseEntity<MaintenanceReport> getReport(@PathVariable Integer id) {
        return reportRepository.findByIncidentId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/incidents/{id}/handoff */
    @GetMapping("/incidents/{id}/handoff")
    public ResponseEntity<ShiftHandoff> getHandoff(@PathVariable Integer id) {
        return handoffRepository.findByIncidentId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/health */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("{\"status\":\"ok\"}");
    }

    /** GET /api/incidents/by-alarm/{alarmCode} — quick alarm history lookup */
    @GetMapping("/incidents/by-alarm/{alarmCode}")
    public ResponseEntity<List<Incident>> byAlarm(@PathVariable String alarmCode) {
        return ResponseEntity.ok(incidentRepository.findByAlarmCodeOrderByCreatedAtDesc(alarmCode));
    }
}
