package com.factoryflow.repository;

import com.factoryflow.model.ShiftHandoff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShiftHandoffRepository extends JpaRepository<ShiftHandoff, Integer> {
    Optional<ShiftHandoff> findByIncidentId(Integer incidentId);
}
