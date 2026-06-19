package com.factoryflow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "resolved_knowledge")
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class ResolvedKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "alarm_code", nullable = false, length = 50)
    private String alarmCode;

    @Column(name = "machine_type", length = 100)
    private String machineType;

    @Column(name = "source_incident_id")
    private Integer sourceIncidentId;

    @Column(name = "distilled_cause", nullable = false, columnDefinition = "TEXT")
    private String distilledCause;

    @Column(name = "distilled_fix", nullable = false, columnDefinition = "TEXT")
    private String distilledFix;

    @Column(name = "times_reused")
    private Integer timesReused = 0;

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
