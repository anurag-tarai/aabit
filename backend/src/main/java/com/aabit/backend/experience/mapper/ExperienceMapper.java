package com.aabit.backend.experience.mapper;

import com.aabit.backend.experience.dto.ExperienceRequest;
import com.aabit.backend.experience.dto.ExperienceResponse;
import com.aabit.backend.experience.entity.ExperienceEntry;
import com.aabit.backend.experience.entity.Tag;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ExperienceMapper {

    // Converts incoming DTO to Entity
    public ExperienceEntry toEntity(ExperienceRequest request) {
        ExperienceEntry entry = new ExperienceEntry();
        entry.setMarkdownContent(request.markdownContent());
        entry.setSensitive(request.sensitive());
        entry.setClientEncrypted(request.clientEncrypted());
        entry.setTimestamp(Instant.now()); // Set timestamp on creation

        // Note: The Service layer will handle the actual Tag entity mapping
        return entry;
    }

    // Converts Entity to outgoing DTO
    public ExperienceResponse toResponseDto(ExperienceEntry entry) {
        List<String> tagNames = entry.getTags().stream()
                .map(Tag::getName)
                .collect(Collectors.toList());

        return new ExperienceResponse(
                entry.getId(),
                entry.getTimestamp(),
                entry.getMarkdownContent(),
                entry.isSensitive(),
                entry.isClientEncrypted(),
                tagNames
        );
    }
}