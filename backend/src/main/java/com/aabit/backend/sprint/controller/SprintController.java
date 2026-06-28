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
@RequestMapping("/api/v1/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    public ResponseEntity<SprintResponse> createSprint(@Valid @RequestBody SprintRequest request) {
        return new ResponseEntity<>(sprintService.createSprint(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SprintResponse>> getAllSprints() {
        return ResponseEntity.ok(sprintService.getAllSprints());
    }

    @GetMapping("/current")
    public ResponseEntity<SprintResponse> getCurrentSprint() {
        SprintResponse sprint = sprintService.getCurrentSprint();
        return sprint != null ? ResponseEntity.ok(sprint) : ResponseEntity.noContent().build();
    }

    @PatchMapping("/{sprintId}")
    public ResponseEntity<SprintResponse> updateSprint(
            @PathVariable UUID sprintId,
            @Valid @RequestBody SprintRequest request) {
        return ResponseEntity.ok(sprintService.updateSprint(sprintId, request));
    }

    @DeleteMapping("/{sprintId}")
    public ResponseEntity<Void> deleteSprint(@PathVariable UUID sprintId) {
        sprintService.deleteSprint(sprintId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{sprintId}/complete")
    public ResponseEntity<SprintResponse> completeSprint(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintService.completeSprint(sprintId));
    }

    // ─── Goals within a Sprint ────────────────────────────────────────────────

    @GetMapping("/{sprintId}/goals")
    public ResponseEntity<List<GoalResponse>> getSprintGoals(@PathVariable UUID sprintId) {
        return ResponseEntity.ok(sprintService.getSprintGoals(sprintId));
    }

    @PostMapping("/{sprintId}/goals/{goalId}")
    public ResponseEntity<Void> assignGoalToSprint(
            @PathVariable UUID sprintId,
            @PathVariable UUID goalId) {
        sprintService.assignGoalToSprint(sprintId, goalId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sprintId}/goals/{goalId}")
    public ResponseEntity<Void> removeGoalFromSprint(
            @PathVariable UUID sprintId,
            @PathVariable UUID goalId) {
        sprintService.removeGoalFromSprint(sprintId, goalId);
        return ResponseEntity.noContent().build();
    }

    // ─── Calendar Matrix ──────────────────────────────────────────────────────

    @GetMapping("/{sprintId}/calendar")
    public ResponseEntity<CalendarMatrixResponse> getCalendarMatrix(
            @PathVariable UUID sprintId,
            @RequestParam String month,
            @RequestParam(defaultValue = "Asia/Kolkata") String timezone) {
        return ResponseEntity.ok(sprintService.getCalendarMatrix(sprintId, month, timezone));
    }

    // ─── Day Detail ───────────────────────────────────────────────────────────

    @GetMapping("/{sprintId}/logs")
    public ResponseEntity<List<TimeLogResponse>> getLogsForDay(
            @PathVariable UUID sprintId,
            @RequestParam String day,
            @RequestParam(defaultValue = "Asia/Kolkata") String timezone) {
        return ResponseEntity.ok(sprintService.getLogsForDay(sprintId, day, timezone));
    }

    // ─── Time Log ─────────────────────────────────────────────────────────────

    @PostMapping("/timelogs")
    public ResponseEntity<TimeLogResponse> logTime(@Valid @RequestBody TimeLogRequest request) {
        return new ResponseEntity<>(sprintService.logTime(request), HttpStatus.CREATED);
    }

    // ★ NEW — Edit an existing time log
    @PatchMapping("/timelogs/{timeLogId}")
    public ResponseEntity<TimeLogResponse> updateTimeLog(
            @PathVariable UUID timeLogId,
            @Valid @RequestBody UpdateTimeLogRequest request) {
        return ResponseEntity.ok(sprintService.updateTimeLog(timeLogId, request));
    }

    @DeleteMapping("/timelogs/{timeLogId}")
    public ResponseEntity<Void> deleteTimeLog(@PathVariable UUID timeLogId) {
        sprintService.deleteTimeLog(timeLogId);
        return ResponseEntity.noContent().build();
    }
}