package com.aabit.backend.experience.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExperienceResponse(
        UUID id,
        Instant timestamp,
        String markdownContent,
        boolean sensitive,
        boolean clientEncrypted,
        List<String> tags
) {}