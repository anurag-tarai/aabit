package com.aabit.backend.experience.controller;

import com.aabit.backend.experience.dto.ExperienceRequest;
import com.aabit.backend.experience.dto.ExperienceResponse;
import com.aabit.backend.experience.dto.SystemStatsResponse;
import com.aabit.backend.experience.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/experiences")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @PostMapping
    public ResponseEntity<ExperienceResponse> createEntry(
            @RequestBody ExperienceRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(experienceService.createEntry(request, email));
    }

    @GetMapping
    public ResponseEntity<Page<ExperienceResponse>> getEntries(
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer day,
            @PageableDefault(size = 10, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(experienceService.getFilteredEntries(email, tag, year, month, day, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExperienceResponse> updateEntry(
            @PathVariable UUID id,
            @RequestBody ExperienceRequest request,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(experienceService.updateEntry(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable UUID id, @AuthenticationPrincipal String email) {
        experienceService.softDeleteEntry(id, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats/monthly")
    public ResponseEntity<Map<Integer, Integer>> getMonthlyStats(
            @RequestParam int year,
            @RequestParam int month,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(experienceService.getMonthlyCounts(email, year, month));
    }

    @GetMapping("/stats/summary")
    public ResponseEntity<SystemStatsResponse> getSystemMetrics(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(experienceService.getSystemMetrics(email));
    }
}