package com.aabit.backend.sprint.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record TimeLogRequest(
        @NotNull(message = "Goal is required")
        UUID goalId,

        @NotNull(message = "Work area is required")
        UUID workAreaId,

        // Nullable: log can exist outside of a sprint
        UUID sprintId,

        @NotNull(message = "Start time is required")
        Instant startTime,

        @NotNull(message = "End time is required")
        Instant endTime,

        @Size(max = 2000)
        String note
) {
    public TimeLogRequest {
        if (startTime != null && endTime != null && !startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
    }
}
