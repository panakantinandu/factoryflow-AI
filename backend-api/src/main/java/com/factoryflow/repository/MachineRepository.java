package com.factoryflow.repository;

import com.factoryflow.model.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, Integer> {

    Optional<Machine> findByNameIgnoreCase(String name);

    @Query(nativeQuery = true, value = """
            SELECT m.id,
                   m.name,
                   m.machine_type,
                   COUNT(i.id)                                            AS incident_count,
                   COALESCE(AVG(i.estimated_downtime_minutes), 0)        AS avg_downtime,
                   MAX(i.created_at)                                     AS last_incident_at
            FROM   machines m
            LEFT JOIN incidents i
                   ON i.machine_id = m.id
                  AND i.created_at > NOW() - INTERVAL '30 days'
            GROUP BY m.id, m.name, m.machine_type
            ORDER BY incident_count DESC
            """)
    List<Object[]> machineHealthData();
}
