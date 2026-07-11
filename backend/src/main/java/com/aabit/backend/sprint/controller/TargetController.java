package com.aabit.backend.sprint.controller;

import com.aabit.backend.sprint.dto.TargetRequest;
import com.aabit.backend.sprint.dto.TargetResponse;
import com.aabit.backend.sprint.service.TargetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/targets")
@RequiredArgsConstructor
@Slf4j
public class TargetController {

    private final TargetService targetService;

    /**
     * GET /api/v1/targets?weekStart=2025-06-23
     * weekStart MUST be a Monday (ISO 8601 date).
     * Fetch targets for the week.
     */
    @GetMapping
    public ResponseEntity<List<TargetResponse>> getTargetsForWeek(
            @RequestParam("weekStart")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate weekStart) {
        return ResponseEntity.ok(targetService.getTargetsForWeek(weekStart));
    }

    /** POST /api/v1/targets */
    @PostMapping
    public ResponseEntity<TargetResponse> createTarget(
            @Valid @RequestBody TargetRequest request) {
        return new ResponseEntity<>(targetService.createTarget(request), HttpStatus.CREATED);
    }

    /** PATCH /api/v1/targets/{targetId}/toggle — flip is_completed */
    @PatchMapping("/{targetId}/toggle")
    public ResponseEntity<TargetResponse> toggleComplete(@PathVariable UUID targetId) {
        return ResponseEntity.ok(targetService.toggleComplete(targetId));
    }

    /** PATCH /api/v1/targets/{targetId} — update name / workArea */
    @PatchMapping("/{targetId}")
    public ResponseEntity<TargetResponse> updateTarget(
            @PathVariable UUID targetId,
            @Valid @RequestBody TargetRequest request) {
        log.info("Updating target {} with request payload: {}", targetId, request);
        return ResponseEntity.ok(targetService.updateTarget(targetId, request));
    }

    /** DELETE /api/v1/targets/{targetId} */
    @DeleteMapping("/{targetId}")
    public ResponseEntity<Void> deleteTarget(@PathVariable UUID targetId) {
        targetService.deleteTarget(targetId);
        return ResponseEntity.noContent().build();
    }
}