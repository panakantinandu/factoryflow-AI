package com.factoryflow.repository;

import com.factoryflow.model.MaintenanceReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MaintenanceReportRepository extends JpaRepository<MaintenanceReport, Integer> {
    Optional<MaintenanceReport> findByIncidentId(Integer incidentId);
}
