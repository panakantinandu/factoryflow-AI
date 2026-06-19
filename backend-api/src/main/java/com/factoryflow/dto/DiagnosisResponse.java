package com.factoryflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class DiagnosisResponse {

    @JsonProperty("incident_id")
    private Integer incidentId;

    @JsonProperty("alarm_code")
    private String alarmCode;

    @JsonProperty("machine_type")
    private String machineType;

    private String severity;

    private Map<String, Object> diagnosis;
    private Map<String, Object> report;
    private Map<String, Object> handoff;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("reasoning_log")
    private List<Map<String, Object>> reasoningLog;
}
