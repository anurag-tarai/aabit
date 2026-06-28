package com.aabit.backend.sprint.service;

import com.aabit.backend.auth.util.SecurityUtils;
import com.aabit.backend.sprint.dto.TargetRequest;
import com.aabit.backend.sprint.dto.TargetResponse;
import com.aabit.backend.sprint.entity.Target;
import com.aabit.backend.sprint.repository.TargetRepository;
import com.aabit.backend.sprint.repository.WorkAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TargetService {

    private final TargetRepository targetRepository;
    private final WorkAreaRepository workAreaRepository;
    private final SecurityUtils securityUtils;

    // ─── Fetch with lazy-clone ────────────────────────────────────

    /**
     * Returns all targets for the given Monday.
     * Lazy-clones any repeating targets from the previous week that
     * haven't been cloned yet.
     *
     * @param weekStartDate must be a Monday
     */
    @Transactional
    public List<TargetResponse> getTargetsForWeek(LocalDate weekStartDate) {
        assertMonday(weekStartDate);
        UUID userId = securityUtils.getCurrentUserId();

        // Lazy-clone repeating targets from the previous week
        LocalDate prevWeekStart = weekStartDate.minusWeeks(1);
        List<Target> repeating = targetRepository.findRepeatingFromPreviousWeek(userId, prevWeekStart);

        List<Target> clones = new ArrayList<>();
        for (Target parent : repeating) {
            boolean alreadyCloned = targetRepository
                    .existsByUserIdAndWorkAreaIdAndNameAndWeekStartDate(
                            userId,
                            parent.getWorkAreaId(),
                            parent.getName(),
                            weekStartDate
                    );
            if (!alreadyCloned) {
                Target clone = new Target(
                        null,
                        userId,
                        parent.getWorkAreaId(),
                        parent.getName(),
                        weekStartDate,
                        false,          // is_completed resets
                        parent.isRepeating(),
                        Instant.now()
                );
                clones.add(clone);
            }
        }
        if (!clones.isEmpty()) {
            targetRepository.saveAll(clones);
        }

        return targetRepository
                .findByUserIdAndWeekStartDateOrderByCreatedAtAsc(userId, weekStartDate)
                .stream()
                .map(TargetResponse::from)
                .toList();
    }

    // ─── CRUD ─────────────────────────────────────────────────────

    @Transactional
    public TargetResponse createTarget(TargetRequest req) {
        UUID userId = securityUtils.getCurrentUserId();

        LocalDate weekStart = resolveMonday(req.weekStartDate());

        // Verify work area exists (ownership check via goal -> user chain is
        // handled implicitly; work_area FK guarantees it belongs to someone)
        workAreaRepository.findById(req.workAreaId())
                .orElseThrow(() -> new IllegalArgumentException("Work area not found."));

        Target target = new Target(
                null,
                userId,
                req.workAreaId(),
                req.name(),
                weekStart,
                false,
                req.repeating(),
                Instant.now()
        );
        return TargetResponse.from(targetRepository.save(target));
    }

    @Transactional
    public TargetResponse toggleComplete(UUID targetId) {
        UUID userId = securityUtils.getCurrentUserId();
        Target target = getOwned(targetId, userId);

        // Guard: past-Sunday lock — the frontend enforces this too,
        // but we enforce it on the server as the source of truth.
        LocalDate sunday = target.getWeekStartDate().plusDays(6);
        if (LocalDate.now().isAfter(sunday)) {
            throw new IllegalStateException(
                    "Cannot modify a target from a past week.");
        }

        target.setCompleted(!target.isCompleted());
        return TargetResponse.from(targetRepository.save(target));
    }

    @Transactional
    public TargetResponse updateTarget(UUID targetId, TargetRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        Target target = getOwned(targetId, userId);

        LocalDate sunday = target.getWeekStartDate().plusDays(6);
        if (LocalDate.now().isAfter(sunday)) {
            throw new IllegalStateException(
                    "Cannot modify a target from a past week.");
        }

        if (req.workAreaId() != null) {
            workAreaRepository.findById(req.workAreaId())
                    .orElseThrow(() -> new IllegalArgumentException("Work area not found."));
            target.setWorkAreaId(req.workAreaId());
        }
        if (req.name() != null && !req.name().isBlank()) {
            target.setName(req.name());
        }
        target.setRepeating(req.repeating());

        return TargetResponse.from(targetRepository.save(target));
    }

    @Transactional
    public void deleteTarget(UUID targetId) {
        UUID userId = securityUtils.getCurrentUserId();
        Target target = getOwned(targetId, userId);
        targetRepository.delete(target);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private Target getOwned(UUID targetId, UUID userId) {
        Target target = targetRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("Target not found."));
        if (!target.getUserId().equals(userId)) {
            throw new SecurityException("Access denied.");
        }
        return target;
    }

    private static void assertMonday(LocalDate date) {
        if (date.getDayOfWeek() != DayOfWeek.MONDAY) {
            throw new IllegalArgumentException(
                    "weekStartDate must be a Monday. Received: " + date + " (" + date.getDayOfWeek() + ")");
        }
    }

    /**
     * If weekStartDate is provided and is a Monday, use it.
     * If null, default to this week's Monday.
     * If provided but not a Monday, throw.
     */
    private static LocalDate resolveMonday(LocalDate candidate) {
        if (candidate == null) {
            LocalDate today = LocalDate.now();
            // Shift to the most recent Monday (ISO week: Mon=1 … Sun=7)
            return today.with(DayOfWeek.MONDAY);
        }
        assertMonday(candidate);
        return candidate;
    }
}