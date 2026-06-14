package com.aabit.backend.experience.dto;

public record SystemStatsResponse(
        long totalLifetimeLogs,
        long currentMonthLogs
) {}