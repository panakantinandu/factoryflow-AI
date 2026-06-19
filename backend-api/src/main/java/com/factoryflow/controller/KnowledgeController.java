package com.factoryflow.controller;

import com.factoryflow.model.ResolvedKnowledge;
import com.factoryflow.service.KnowledgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    /**
     * GET /api/knowledge
     * All resolved knowledge entries, sorted by times_reused descending.
     */
    @GetMapping
    public ResponseEntity<List<ResolvedKnowledge>> getAll() {
        return ResponseEntity.ok(knowledgeService.getAll());
    }

    /**
     * GET /api/knowledge/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResolvedKnowledge> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(knowledgeService.getById(id));
    }

    /**
     * DELETE /api/knowledge/{id}
     * Remove a knowledge entry (e.g., if it turned out to be incorrect).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        knowledgeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
