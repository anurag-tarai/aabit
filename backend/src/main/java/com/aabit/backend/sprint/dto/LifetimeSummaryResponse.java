package com.aabit.backend.sprint.dto;

import java.util.List;
import java.util.UUID;

public record LifetimeSummaryResponse(
        List<SummaryCell> summary
) {
    public record SummaryCell(
            UUID goalId,
            String anonymousLabel,
            int totalMinutes
    ) {}
}
