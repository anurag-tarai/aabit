package com.aabit.backend.sprint.dto;

import com.aabit.backend.sprint.entity.Target;

import java.time.LocalDate;
import java.util.UUID;

public record TargetResponse(
        UUID id,
        UUID workAreaId,
        String name,
        LocalDate weekStartDate,
        boolean completed,
        boolean repeating
) {
    public static TargetResponse from(Target t) {
        return new TargetResponse(
                t.getId(),
                t.getWorkAreaId(),
                t.getName(),
                t.getWeekStartDate(),
                t.isCompleted(),
                t.isRepeating()
        );
    }
}