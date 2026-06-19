package com.factoryflow.repository;

import com.factoryflow.model.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Integer> {

    Page<Incident> findAll(Pageable pageable);

    Page<Incident> findByAlarmCode(String alarmCode, Pageable pageable);

    Page<Incident> findByResolutionStatus(String resolutionStatus, Pageable pageable);

    List<Incident> findByAlarmCodeOrderByCreatedAtDesc(String alarmCode);

    List<Incident> findTop20ByOrderByCreatedAtDesc();

    // ── Analytics queries ──────────────────────────────────────────────────

    long countByResolutionStatus(String resolutionStatus);

    @Query(nativeQuery = true,
           value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60.0) " +
                   "FROM incidents WHERE resolved_at IS NOT NULL")
    Double avgMttrMinutes();

    @Query(nativeQuery = true,
           value = "SELECT alarm_code, COUNT(*) AS cnt " +
                   "FROM incidents " +
                   "WHERE alarm_code IS NOT NULL " +
                   "GROUP BY alarm_code " +
                   "ORDER BY cnt DESC " +
                   "LIMIT 8")
    List<Object[]> topAlarmsByFrequency();

    @Query(nativeQuery = true,
           value = "SELECT COALESCE(SUM(estimated_downtime_minutes), 0) FROM incidents")
    Long totalDowntimeMinutes();

    @Query(nativeQuery = true,
           value = "SELECT COUNT(*) FROM incidents WHERE confidence_score >= 0.9")
    Long fastPathCount();
}
