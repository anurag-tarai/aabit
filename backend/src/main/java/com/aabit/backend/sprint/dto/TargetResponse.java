package com.aabit.backend.sprint.dto;

import com.aabit.backend.sprint.entity.Target;

import java.time.LocalDate;
import java.util.UUID;

public record TargetResponse(
        UUID id,
        UUID workAreaId,
        UUID goalId,
        String targetType,
        LocalDate targetDate,
        boolean isFixed,
        String priority,
        String name,
        LocalDate weekStartDate,
        boolean completed
) {
    public static TargetResponse from(Target t) {
        return new TargetResponse(
                t.getId(),
                t.getWorkAreaId(),
                t.getGoalId(),
                t.getTargetType(),
                t.getTargetDate(),
                t.isFixed(),
                t.getPriority(),
                t.getName(),
                t.getWeekStartDate(),
                t.isCompleted()
        );
    }
}