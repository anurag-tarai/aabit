package com.aabit.backend.sprint.dto;

import com.aabit.backend.sprint.entity.Goal;
import com.aabit.backend.sprint.entity.WorkArea;

import java.util.List;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String name,
        String description,
        String color,
        boolean active,
        List<WorkAreaResponse> workAreas
) {
    public static GoalResponse from(Goal g, List<WorkArea> workAreas) {
        return new GoalResponse(
                g.getId(),
                g.getName(),
                g.getDescription(),
                g.getColor(),
                g.isActive(),
                workAreas.stream().map(WorkAreaResponse::from).toList()
        );
    }

    public static GoalResponse from(Goal g) {
        return new GoalResponse(g.getId(), g.getName(), g.getDescription(), g.getColor(), g.isActive(), List.of());
    }
}
