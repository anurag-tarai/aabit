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

    @PostMapping("/{goalId}/work-areas")
    public ResponseEntity<WorkAreaResponse> addWorkArea(
            @PathVariable UUID goalId,
            @Valid @RequestBody WorkAreaRequest request) {
        return new ResponseEntity<>(sprintService.addWorkArea(goalId, request), HttpStatus.CREATED);
    }

    @GetMapping("/{goalId}/work-areas")
    public ResponseEntity<List<WorkAreaResponse>> getWorkAreas(@PathVariable UUID goalId) {
        return ResponseEntity.ok(sprintService.getWorkAreas(goalId));
    }
}
