package com.factoryflow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "incidents")
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Machine machine;

    @Column(name = "alarm_code", length = 50)
    private String alarmCode;

    @Column(name = "operator_input", nullable = false, columnDefinition = "TEXT")
    private String operatorInput;

    @Column(length = 20)
    private String shift;

    @Column(name = "probable_cause", columnDefinition = "TEXT")
    private String probableCause;

    @Column(name = "recommended_fix", columnDefinition = "TEXT")
    private String recommendedFix;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "estimated_downtime_minutes")
    private Integer estimatedDowntimeMinutes;

    @Column(name = "resolution_status", length = 30)
    private String resolutionStatus = "open";

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;
}
