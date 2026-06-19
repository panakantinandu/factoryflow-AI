package com.factoryflow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "shift_handoffs")
@Getter
@Setter
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ShiftHandoff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "incident_id")
    private Integer incidentId;

    @Column(name = "machine_status", columnDefinition = "TEXT")
    private String machineStatus;

    @Column(name = "actions_taken", columnDefinition = "TEXT")
    private String actionsTaken;

    @Column(name = "pending_work", columnDefinition = "TEXT")
    private String pendingWork;

    @Column(name = "recommendations_next", columnDefinition = "TEXT")
    private String recommendationsNext;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
