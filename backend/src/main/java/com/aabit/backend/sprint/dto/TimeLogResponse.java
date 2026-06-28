package com.aabit.backend.sprint.dto;

import com.aabit.backend.sprint.entity.TimeLog;

import java.time.Instant;
import java.util.UUID;

public record TimeLogResponse(
        UUID id,
        UUID goalId,
        UUID workAreaId,
        String anonymousName,
        UUID sprintId,
        Instant startTime,
        Instant endTime,
        int durationMinutes,
        String note,
        Instant createdAt
) {
    public static TimeLogResponse from(TimeLog t) {
        return new TimeLogResponse(
                t.getId(),
                t.getGoalId(),
                t.getWorkAreaId(),
                t.getAnonymousName(),
                t.getSprintId(),
                t.getStartTime(),
                t.getEndTime(),
                t.getDurationMinutes(),
                t.getNote(),
                t.getCreatedAt()
        );
    }
}