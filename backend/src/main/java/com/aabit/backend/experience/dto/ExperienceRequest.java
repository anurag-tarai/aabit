package com.aabit.backend.experience.dto;

import java.util.List;

public record ExperienceRequest(
        String markdownContent,
        boolean sensitive,
        List<String> tags
) {}