package com.aabit.backend.sprint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GoalRequest(
        @NotBlank(message = "Goal name is required")
        String name,

        String description,

        @Pattern(regexp = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", message = "Color must be a valid hex code")
        String color,

        Integer targetTimePercentage
) {}
