package com.aabit.backend.sprint.dto;

import com.aabit.backend.sprint.entity.Sprint;

import java.time.LocalDate;
import java.util.UUID;

public record SprintResponse(
        UUID id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        String status
) {
    public static SprintResponse from(Sprint s) {
        return new SprintResponse(s.getId(), s.getName(), s.getStartDate(), s.getEndDate(), s.getStatus());
    }
}
