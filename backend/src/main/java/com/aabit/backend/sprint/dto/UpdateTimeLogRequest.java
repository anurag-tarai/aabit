package com.aabit.backend.sprint.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * Payload for PATCH /api/v1/sprints/timelogs/{id}
 * Same two-mode semantics as TimeLogRequest.
 */
public record UpdateTimeLogRequest(
        UUID goalId,
        UUID workAreaId,

        @Size(max = 255)
        String anonymousName,

        @NotNull(message = "Start time is required")
        Instant startTime,

        @NotNull(message = "End time is required")
        Instant endTime,

        @Size(max = 2000)
        String note
) {
    public UpdateTimeLogRequest {
        boolean isGoalMode      = goalId != null && workAreaId != null;
        boolean isAnonymousMode = anonymousName != null && !anonymousName.isBlank();

        if (!isGoalMode && !isAnonymousMode) {
            throw new IllegalArgumentException(
                    "Either (goalId + workAreaId) or anonymousName must be provided.");
        }
        if (isGoalMode && isAnonymousMode) {
            throw new IllegalArgumentException(
                    "Provide either (goalId + workAreaId) or anonymousName — not both.");
        }
        if (startTime != null && endTime != null && !startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
    }

    public boolean isAnonymous() {
        return anonymousName != null && !anonymousName.isBlank();
    }
}