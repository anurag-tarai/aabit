package com.aabit.backend.sprint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record TargetRequest(
        @NotNull(message = "workAreaId is required")
        UUID workAreaId,

        @NotBlank(message = "name is required")
        @Size(max = 255)
        String name,

        /**
         * The Monday that starts the target's week.
         * If null, defaults to the current week's Monday in the service.
         */
        LocalDate weekStartDate,

        boolean repeating
) {}