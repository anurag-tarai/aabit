package com.aabit.backend.sprint.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkAreaRequest(
        @NotBlank(message = "Work area name is required")
        String name,

        String description
) {}
