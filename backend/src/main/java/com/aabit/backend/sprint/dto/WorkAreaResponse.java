package com.aabit.backend.sprint.dto;

import com.aabit.backend.sprint.entity.WorkArea;

import java.util.UUID;

public record WorkAreaResponse(
        UUID id,
        UUID goalId,
        String name,
        String description,
        boolean active
) {
    public static WorkAreaResponse from(WorkArea w) {
        return new WorkAreaResponse(w.getId(), w.getGoalId(), w.getName(), w.getDescription(), w.isActive());
    }
}
