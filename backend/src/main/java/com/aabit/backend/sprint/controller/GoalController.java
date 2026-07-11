package com.aabit.backend.sprint.controller;

import com.aabit.backend.sprint.dto.*;
import com.aabit.backend.sprint.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    private final SprintService sprintService;

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getAllGoals() {
        return ResponseEntity.ok(sprintService.getAllGoals());
    }

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@Valid @RequestBody GoalRequest request) {
        return new ResponseEntity<>(sprintService.createGoal(request), HttpStatus.CREATED);
    }

    @PatchMapping("/{goalId}")
    public ResponseEntity<GoalResponse> updateGoal(
            @PathVariable UUID goalId,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(sprintService.updateGoal(goalId, request));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@PathVariable UUID goalId) {
        sprintService.deleteGoal(goalId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{goalId}/work-areas")
    public ResponseEntity<WorkAreaResponse> addWorkArea(
            @PathVariable UUID goalId,
            @Valid @RequestBody WorkAreaRequest request) {
        return new ResponseEntity<>(sprintService.addWorkArea(goalId, request), HttpStatus.CREATED);
    }

    @PatchMapping("/{goalId}/work-areas/{workAreaId}")
    public ResponseEntity<WorkAreaResponse> updateWorkArea(
            @PathVariable UUID goalId,
            @PathVariable UUID workAreaId,
            @Valid @RequestBody WorkAreaRequest request) {
        return ResponseEntity.ok(sprintService.updateWorkArea(goalId, workAreaId, request));
    }

    @GetMapping("/{goalId}/work-areas")
    public ResponseEntity<List<WorkAreaResponse>> getWorkAreas(@PathVariable UUID goalId) {
        return ResponseEntity.ok(sprintService.getWorkAreas(goalId));
    }

    @DeleteMapping("/{goalId}/work-areas/{workAreaId}")
    public ResponseEntity<Void> deleteWorkArea(
            @PathVariable UUID goalId,
            @PathVariable UUID workAreaId) {
        sprintService.deleteWorkArea(goalId, workAreaId);
        return ResponseEntity.noContent().build();
    }
}
