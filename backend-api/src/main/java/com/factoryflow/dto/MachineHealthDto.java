package com.factoryflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MachineHealthDto {

    private Integer id;
    private String name;

    @JsonProperty("machine_type")
    private String machineType;

    @JsonProperty("incident_count_30d")
    private long incidentCount30d;

    @JsonProperty("avg_downtime_minutes")
    private double avgDowntimeMinutes;

    @JsonProperty("health_score")
    private int healthScore;

    @JsonProperty("last_incident_at")
    private String lastIncidentAt;

    @JsonProperty("status")
    private String status;
}
