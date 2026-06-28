package com.aabit.backend.experience.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ExperienceRequest(
        @NotBlank(message = "markdownContent must not be blank")
        String markdownContent,
        boolean sensitive,
        boolean clientEncrypted,
        @NotNull
        List<String> tags
) {}