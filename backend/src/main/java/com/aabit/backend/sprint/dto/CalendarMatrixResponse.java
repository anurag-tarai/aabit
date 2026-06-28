package com.aabit.backend.sprint.dto;

import java.util.List;
import java.util.UUID;

public record CalendarMatrixResponse(
        String month,
        List<MatrixCell> matrix
) {
    /**
     * goalId is null for anonymous log rows — the frontend
     * uses this null sentinel to render the "Anonymous" row.
     */
    public record MatrixCell(int day, UUID goalId, String anonymousLabel, int totalMinutes) {}
}