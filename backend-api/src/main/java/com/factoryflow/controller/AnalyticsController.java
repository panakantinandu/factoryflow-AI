package com.factoryflow.controller;

import com.factoryflow.dto.AnalyticsSummary;
import com.factoryflow.dto.MachineHealthDto;
import com.factoryflow.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/analytics/summary
     * Aggregate KPIs: total incidents, MTTR, knowledge savings, fast-path ratio.
     */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummary> summary() {
        return ResponseEntity.ok(analyticsService.getSummary());
    }

    /**
     * GET /api/analytics/machine-health
     * Per-machine health scores and 30-day incident counts.
     */
    @GetMapping("/machine-health")
    public ResponseEntity<List<MachineHealthDto>> machineHealth() {
        return ResponseEntity.ok(analyticsService.getMachineHealth());
    }
}
