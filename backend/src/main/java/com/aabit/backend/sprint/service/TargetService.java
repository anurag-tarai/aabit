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
     *
     * @param weekStartDate must be a Monday
     */
    @Transactional
    public List<TargetResponse> getTargetsForWeek(LocalDate weekStartDate) {
        assertMonday(weekStartDate);
        UUID userId = securityUtils.getCurrentUserId();

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

        LocalDate targetDate = req.targetDate();
        String targetType = req.targetType() != null ? req.targetType() : "WEEKLY";
        boolean isFixed = req.isFixed() != null ? req.isFixed() : false;
        String priority = req.priority() != null ? req.priority() : "MEDIUM";

        LocalDate weekStart;
        if ("DAILY".equals(targetType) && targetDate != null) {
            weekStart = targetDate.with(java.time.DayOfWeek.MONDAY);
        } else if (targetDate != null) {
            weekStart = targetDate.with(java.time.DayOfWeek.MONDAY);
        } else {
            weekStart = resolveMonday(req.weekStartDate());
        }

        // Verify work area if present
        if (req.workAreaId() != null) {
            var wa = workAreaRepository.findById(req.workAreaId())
                    .orElseThrow(() -> new IllegalArgumentException("Work area not found."));
            if (req.goalId() != null && !wa.getGoalId().equals(req.goalId())) {
                throw new IllegalArgumentException("Work area does not belong to the selected goal.");
            }
        }

        Target target = new Target(
                null,
                userId,
                req.workAreaId(),
                req.goalId(),
                targetType,
                targetDate,
                isFixed,
                priority,
                req.name(),
                weekStart,
                false,
                Instant.now()
        );
        return TargetResponse.from(targetRepository.save(target));
    }

    @Transactional
    public TargetResponse toggleComplete(UUID targetId) {
        UUID userId = securityUtils.getCurrentUserId();
        Target target = getOwned(targetId, userId);


        target.setCompleted(!target.isCompleted());
        return TargetResponse.from(targetRepository.save(target));
    }

    @Transactional
    public TargetResponse updateTarget(UUID targetId, TargetRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        Target target = getOwned(targetId, userId);

        if (req.goalId() != null) {
            target.setGoalId(req.goalId());
        } else if (req.goalId() == null && req.workAreaId() == null) {
            target.setGoalId(null);
        }

        if (req.workAreaId() != null) {
            var wa = workAreaRepository.findById(req.workAreaId())
                    .orElseThrow(() -> new IllegalArgumentException("Work area not found."));
            target.setWorkAreaId(req.workAreaId());
            target.setGoalId(wa.getGoalId());
        } else if (req.workAreaId() == null && req.goalId() == null) {
            target.setWorkAreaId(null);
        }

        if (req.name() != null && !req.name().isBlank()) {
            target.setName(req.name());
        }

        if (req.targetType() != null) {
            target.setTargetType(req.targetType());
        }
        if (req.targetDate() != null) {
            target.setTargetDate(req.targetDate());
            target.setWeekStartDate(req.targetDate().with(java.time.DayOfWeek.MONDAY));
        } else if (req.targetDate() == null && "WEEKLY".equals(req.targetType())) {
            target.setTargetDate(null);
            if (req.weekStartDate() != null) {
                target.setWeekStartDate(req.weekStartDate());
            }
        }
        if (req.isFixed() != null) {
            target.setFixed(req.isFixed());
        }
        if (req.priority() != null) {
            target.setPriority(req.priority());
        }

        Target savedTarget = targetRepository.save(target);

        return TargetResponse.from(savedTarget);
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