package com.aabit.backend.sprint.service;

import com.aabit.backend.auth.util.SecurityUtils;
import com.aabit.backend.sprint.dto.*;
import com.aabit.backend.sprint.dto.CalendarMatrixResponse.MatrixCell;
import com.aabit.backend.sprint.entity.*;
import com.aabit.backend.sprint.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final GoalRepository goalRepository;
    private final WorkAreaRepository workAreaRepository;
    private final SprintGoalRepository sprintGoalRepository;
    private final TimeLogRepository timeLogRepository;
    private final SecurityUtils securityUtils;

    // ─── Sprint ──────────────────────────────────────────────────────────────

    @Transactional
    public SprintResponse createSprint(SprintRequest req) {
        UUID userId = securityUtils.getCurrentUserId();

        if (sprintRepository.hasOverlappingSprint(userId, req.startDate(), req.endDate())) {
            throw new IllegalArgumentException("A sprint already exists for this time period. Sprints cannot overlap.");
        }

        Sprint sprint = new Sprint(null, userId, req.name(), req.startDate(), req.endDate(), "ACTIVE");
        return SprintResponse.from(sprintRepository.save(sprint));
    }

    @Transactional(readOnly = true)
    public List<SprintResponse> getAllSprints() {
        UUID userId = securityUtils.getCurrentUserId();
        return sprintRepository.findByUserIdOrderByStartDateDesc(userId)
                .stream().map(SprintResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SprintResponse getCurrentSprint() {
        UUID userId = securityUtils.getCurrentUserId();
        return sprintRepository.findCurrentSprint(userId, LocalDate.now())
                .map(SprintResponse::from)
                .orElse(null);
    }

    @Transactional
    public SprintResponse completeSprint(UUID sprintId) {
        UUID userId = securityUtils.getCurrentUserId();
        Sprint sprint = getOwnedSprint(sprintId, userId);
        sprint.setStatus("COMPLETED");
        return SprintResponse.from(sprintRepository.save(sprint));
    }

    // ─── Goal ────────────────────────────────────────────────────────────────

    @Transactional
    public GoalResponse createGoal(GoalRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        String color = (req.color() != null && !req.color().isBlank()) ? req.color() : "#10b981";
        Goal goal = new Goal(null, userId, req.name(), req.description(), color, true);
        return GoalResponse.from(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getAllGoals() {
        UUID userId = securityUtils.getCurrentUserId();
        return goalRepository.findByUserIdOrderByName(userId)
                .stream()
                .map(g -> GoalResponse.from(g, workAreaRepository.findByGoalIdOrderByName(g.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getSprintGoals(UUID sprintId) {
        UUID userId = securityUtils.getCurrentUserId();
        return goalRepository.findGoalsBySprintId(sprintId, userId)
                .stream()
                .map(g -> GoalResponse.from(g, workAreaRepository.findByGoalIdOrderByName(g.getId())))
                .toList();
    }

    @Transactional
    public void assignGoalToSprint(UUID sprintId, UUID goalId) {
        UUID userId = securityUtils.getCurrentUserId();
        getOwnedSprint(sprintId, userId);
        getOwnedGoal(goalId, userId);

        if (sprintGoalRepository.existsBySprintIdAndGoalId(sprintId, goalId)) {
            return; // Idempotent — already linked
        }

        sprintGoalRepository.save(new SprintGoal(null, sprintId, goalId, 1));
    }

    @Transactional
    public void removeGoalFromSprint(UUID sprintId, UUID goalId) {
        UUID userId = securityUtils.getCurrentUserId();
        getOwnedSprint(sprintId, userId);
        getOwnedGoal(goalId, userId);
        sprintGoalRepository.deleteBySprintIdAndGoalId(sprintId, goalId);
    }

    // ─── WorkArea ─────────────────────────────────────────────────────────────

    @Transactional
    public WorkAreaResponse addWorkArea(UUID goalId, WorkAreaRequest req) {
        UUID userId = securityUtils.getCurrentUserId();
        getOwnedGoal(goalId, userId);
        WorkArea wa = new WorkArea(null, goalId, req.name(), req.description(), true);
        return WorkAreaResponse.from(workAreaRepository.save(wa));
    }

    @Transactional(readOnly = true)
    public List<WorkAreaResponse> getWorkAreas(UUID goalId) {
        return workAreaRepository.findByGoalIdOrderByName(goalId)
                .stream().map(WorkAreaResponse::from).toList();
    }

    // ─── TimeLog ──────────────────────────────────────────────────────────────

    @Transactional
    public TimeLogResponse logTime(TimeLogRequest req) {
        UUID userId = securityUtils.getCurrentUserId();

        // Validate work area belongs to goal
        WorkArea wa = workAreaRepository.findById(req.workAreaId())
                .orElseThrow(() -> new IllegalArgumentException("Work area not found."));
        if (!wa.getGoalId().equals(req.goalId())) {
            throw new IllegalArgumentException("Work area does not belong to the selected goal.");
        }

        // No overlapping time windows
        if (timeLogRepository.hasTimelineCollision(userId, req.startTime(), req.endTime())) {
            throw new IllegalStateException("This time period overlaps with an existing log entry.");
        }

        int minutes = (int) Duration.between(req.startTime(), req.endTime()).toMinutes();

        TimeLog log = new TimeLog(
                null, userId, req.goalId(), req.workAreaId(), req.sprintId(),
                req.startTime(), req.endTime(), minutes, req.note(), Instant.now()
        );
        return TimeLogResponse.from(timeLogRepository.save(log));
    }

    @Transactional(readOnly = true)
    public List<TimeLogResponse> getLogsForDay(UUID sprintId, String day, String timezone) {
        UUID userId = securityUtils.getCurrentUserId();
        String tz = normalizeTimezone(timezone);
        return timeLogRepository.findLogsForDay(userId, sprintId, day, tz)
                .stream().map(TimeLogResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CalendarMatrixResponse getCalendarMatrix(UUID sprintId, String month, String timezone) {
        UUID userId = securityUtils.getCurrentUserId();
        String tz = normalizeTimezone(timezone);

        List<MatrixCell> cells = timeLogRepository.getMonthlyMatrixRaw(userId, sprintId, month, tz)
                .stream()
                .map(row -> new MatrixCell(
                        ((Number) row[0]).intValue(),
                        UUID.fromString(row[1].toString()),
                        ((Number) row[2]).intValue()
                ))
                .toList();

        return new CalendarMatrixResponse(month, cells);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Sprint getOwnedSprint(UUID sprintId, UUID userId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new IllegalArgumentException("Sprint not found."));
        if (!sprint.getUserId().equals(userId)) {
            throw new SecurityException("Access denied.");
        }
        return sprint;
    }

    private Goal getOwnedGoal(UUID goalId, UUID userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found."));
        if (!goal.getUserId().equals(userId)) {
            throw new SecurityException("Access denied.");
        }
        return goal;
    }

    private String normalizeTimezone(String tz) {
        if (tz == null || tz.isBlank()) return "Asia/Kolkata";
        if ("Asia/Calcutta".equalsIgnoreCase(tz)) return "Asia/Kolkata";
        return tz;
    }
}
