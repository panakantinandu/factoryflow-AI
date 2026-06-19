package com.factoryflow.service;

import com.factoryflow.model.ResolvedKnowledge;
import com.factoryflow.repository.ResolvedKnowledgeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class KnowledgeService {

    private final ResolvedKnowledgeRepository repo;

    public KnowledgeService(ResolvedKnowledgeRepository repo) {
        this.repo = repo;
    }

    public List<ResolvedKnowledge> getAll() {
        return repo.findAllByOrderByTimesReusedDescCreatedAtDesc();
    }

    public ResolvedKnowledge getById(Integer id) {
        return repo.findById(id).orElseThrow(() ->
                new RuntimeException("Knowledge entry not found: " + id));
    }

    public void delete(Integer id) {
        repo.deleteById(id);
    }
}
