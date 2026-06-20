package com.aabit.backend.sprint.dto;

import java.util.List;
import java.util.UUID;

public record CalendarMatrixResponse(
        String month,
        List<MatrixCell> matrix
) {
    public record MatrixCell(int day, UUID goalId, int totalMinutes) {}
}
