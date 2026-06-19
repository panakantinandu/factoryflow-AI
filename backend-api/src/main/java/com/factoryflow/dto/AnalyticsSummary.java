package com.factoryflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AnalyticsSummary {

    @JsonProperty("total_incidents")
    private long totalIncidents;

    @JsonProperty("resolved_count")
    private long resolvedCount;

    @JsonProperty("open_count")
    private long openCount;

    @JsonProperty("avg_mttr_minutes")
    private double avgMttrMinutes;

    @JsonProperty("total_downtime_minutes")
    private long totalDowntimeMinutes;

    @JsonProperty("total_knowledge_entries")
    private long totalKnowledgeEntries;

    @JsonProperty("total_reuse_events")
    private long totalReuseEvents;

    @JsonProperty("estimated_minutes_saved")
    private long estimatedMinutesSaved;

    @JsonProperty("fast_path_count")
    private long fastPathCount;

    @JsonProperty("fast_path_pct")
    private double fastPathPct;

    @JsonProperty("top_alarms")
    private List<AlarmFrequency> topAlarms;
}
