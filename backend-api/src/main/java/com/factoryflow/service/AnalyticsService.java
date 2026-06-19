package com.factoryflow.service;

import com.factoryflow.dto.AlarmFrequency;
import com.factoryflow.dto.AnalyticsSummary;
import com.factoryflow.dto.MachineHealthDto;
import com.factoryflow.repository.IncidentRepository;
import com.factoryflow.repository.MachineRepository;
import com.factoryflow.repository.ResolvedKnowledgeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final IncidentRepository incidentRepo;
    private final ResolvedKnowledgeRepository knowledgeRepo;
    private final MachineRepository machineRepo;

    public AnalyticsService(
            IncidentRepository incidentRepo,
            ResolvedKnowledgeRepository knowledgeRepo,
            MachineRepository machineRepo
    ) {
        this.incidentRepo = incidentRepo;
        this.knowledgeRepo = knowledgeRepo;
        this.machineRepo = machineRepo;
    }

    public AnalyticsSummary getSummary() {
        long total = incidentRepo.count();
        long resolved = incidentRepo.countByResolutionStatus("resolved");
        long open = incidentRepo.countByResolutionStatus("open");

        Double rawMttr = incidentRepo.avgMttrMinutes();
        double avgMttr = rawMttr != null ? Math.round(rawMttr * 10.0) / 10.0 : 0.0;

        Long downtime = incidentRepo.totalDowntimeMinutes();
        Long fastPath = incidentRepo.fastPathCount();
        double fastPathPct = total > 0 ? Math.round((fastPath * 100.0 / total) * 10.0) / 10.0 : 0.0;

        long knowledgeEntries = knowledgeRepo.count();
        Long reuseEvents = knowledgeRepo.totalReuseEvents();
        Long minutesSaved = knowledgeRepo.estimatedMinutesSaved();

        List<AlarmFrequency> topAlarms = incidentRepo.topAlarmsByFrequency()
                .stream()
                .map(row -> new AlarmFrequency(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        return AnalyticsSummary.builder()
                .totalIncidents(total)
                .resolvedCount(resolved)
                .openCount(open)
                .avgMttrMinutes(avgMttr)
                .totalDowntimeMinutes(downtime != null ? downtime : 0L)
                .totalKnowledgeEntries(knowledgeEntries)
                .totalReuseEvents(reuseEvents != null ? reuseEvents : 0L)
                .estimatedMinutesSaved(minutesSaved != null ? minutesSaved : 0L)
                .fastPathCount(fastPath != null ? fastPath : 0L)
                .fastPathPct(fastPathPct)
                .topAlarms(topAlarms)
                .build();
    }

    public List<MachineHealthDto> getMachineHealth() {
        return machineRepo.machineHealthData().stream()
                .map(row -> {
                    Integer id = ((Number) row[0]).intValue();
                    String name = (String) row[1];
                    String machineType = (String) row[2];
                    long incidents = ((Number) row[3]).longValue();
                    double avgDowntime = ((Number) row[4]).doubleValue();
                    String lastAt = row[5] != null ? row[5].toString() : null;

                    int score = Math.max(0, (int) (100 - incidents * 12 - avgDowntime * 0.4));
                    String status = score >= 80 ? "HEALTHY" : score >= 50 ? "WARNING" : "CRITICAL";

                    return MachineHealthDto.builder()
                            .id(id)
                            .name(name)
                            .machineType(machineType)
                            .incidentCount30d(incidents)
                            .avgDowntimeMinutes(Math.round(avgDowntime * 10.0) / 10.0)
                            .healthScore(score)
                            .lastIncidentAt(lastAt)
                            .status(status)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
