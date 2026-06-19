package com.factoryflow.repository;

import com.factoryflow.model.ResolvedKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ResolvedKnowledgeRepository extends JpaRepository<ResolvedKnowledge, Integer> {

    List<ResolvedKnowledge> findAllByOrderByTimesReusedDescCreatedAtDesc();

    @Query(nativeQuery = true, value = "SELECT COALESCE(SUM(times_reused), 0) FROM resolved_knowledge")
    Long totalReuseEvents();

    @Query(nativeQuery = true, value = "SELECT COALESCE(SUM(times_reused * 25), 0) FROM resolved_knowledge")
    Long estimatedMinutesSaved();
}
