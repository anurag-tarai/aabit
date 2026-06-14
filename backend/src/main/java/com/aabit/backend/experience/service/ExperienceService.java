package com.aabit.backend.experience.service;

import com.aabit.backend.auth.entity.User;
import com.aabit.backend.auth.repository.UserRepository;
import com.aabit.backend.experience.dto.ExperienceRequest;
import com.aabit.backend.experience.dto.ExperienceResponse;
import com.aabit.backend.experience.dto.SystemStatsResponse;
import com.aabit.backend.experience.entity.ExperienceEntry;
import com.aabit.backend.experience.entity.Tag;
import com.aabit.backend.experience.mapper.ExperienceMapper;
import com.aabit.backend.experience.repository.ExperienceRepository;
import com.aabit.backend.experience.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final ExperienceMapper mapper;

    @Transactional
    public ExperienceResponse createEntry(ExperienceRequest request, String email) {
        User currentUser = resolveUser(email);
        ExperienceEntry entry = mapper.toEntity(request);
        entry.setUser(currentUser); // Secure tenancy binding

        Set<Tag> managedTags = new HashSet<>();
        if (request.tags() != null && !request.tags().isEmpty()) {
            for (String rawTag : request.tags()) {
                String cleanName = rawTag.trim().toLowerCase();
                Tag tag = tagRepository.findByNameAndUserId(cleanName, currentUser.getId())
                        .orElseGet(() -> {
                            Tag newTag = new Tag();
                            newTag.setName(cleanName);
                            newTag.setCreatedAt(Instant.now());
                            newTag.setUser(currentUser);
                            return tagRepository.save(newTag);
                        });
                managedTags.add(tag);
            }
        }

        entry.setTags(managedTags);
        ExperienceEntry savedEntry = experienceRepository.save(entry);
        return mapper.toResponseDto(savedEntry);
    }

    @Transactional(readOnly = true)
    public Page<ExperienceResponse> getFilteredEntries(String email, String tagName, Integer year, Integer month, Integer day, Pageable pageable) {
        User currentUser = resolveUser(email);
        String cleanTag = (tagName != null && !tagName.trim().isEmpty()) ? tagName.trim().toLowerCase() : null;
        return experienceRepository.findFilteredEntries(currentUser.getId(), cleanTag, year, month, day, pageable)
                .map(mapper::toResponseDto);
    }

    @Transactional
    public ExperienceResponse updateEntry(UUID id, ExperienceRequest request, String email) {
        User currentUser = resolveUser(email);
        ExperienceEntry entry = experienceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Experience Entry not found"));

        // Multitenancy Guard: Verify ownership before executing mutations
        if (!entry.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("SECURITY_VIOLATION: Unauthorised update instruction rejected.");
        }

        entry.setMarkdownContent(request.markdownContent());
        entry.setSensitive(request.sensitive());

        Set<Tag> managedTags = new HashSet<>();
        if (request.tags() != null && !request.tags().isEmpty()) {
            for (String rawTag : request.tags()) {
                String cleanName = rawTag.trim().toLowerCase();
                Tag tag = tagRepository.findByNameAndUserId(cleanName, currentUser.getId())
                        .orElseGet(() -> {
                            Tag newTag = new Tag();
                            newTag.setName(cleanName);
                            newTag.setCreatedAt(Instant.now());
                            newTag.setUser(currentUser);
                            return tagRepository.save(newTag);
                        });
                managedTags.add(tag);
            }
        }

        entry.setTags(managedTags);
        ExperienceEntry updatedEntry = experienceRepository.save(entry);
        return mapper.toResponseDto(updatedEntry);
    }

    @Transactional
    public void softDeleteEntry(UUID id, String email) {
        User currentUser = resolveUser(email);
        ExperienceEntry entry = experienceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Experience Entry not found"));

        if (!entry.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalStateException("SECURITY_VIOLATION: Unauthorised deletion instruction rejected.");
        }

        entry.setDeleted(true);
        experienceRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Map<Integer, Integer> getMonthlyCounts(String email, int year, int month) {
        User currentUser = resolveUser(email);
        List<Object[]> rows = experienceRepository.getMonthlyLogCounts(currentUser.getId(), year, month);
        Map<Integer, Integer> countsMap = new HashMap<>();

        for (Object[] row : rows) {
            int day = ((Number) row[0]).intValue();
            int count = ((Number) row[1]).intValue();
            countsMap.put(day, count);
        }
        return countsMap;
    }

    @Transactional(readOnly = true)
    public SystemStatsResponse getSystemMetrics(String email) {
        User currentUser = resolveUser(email);
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"));

        long lifetime = experienceRepository.countActiveEntriesByUser(currentUser.getId());
        long monthly = experienceRepository.countMonthlyEntriesByUser(currentUser.getId(), now.getYear(), now.getMonthValue());

        return new SystemStatsResponse(lifetime, monthly);
    }

    @Transactional(readOnly = true)
    public List<Tag> getActiveUserTags(String email) {
        User currentUser = resolveUser(email);
        return tagRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }

    @Transactional
    public Tag renameUserTag(UUID id, String newName, String email) {
        // Tag structural renames are global, but check user context first for safety
        resolveUser(email);
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        tag.setName(newName.trim().toLowerCase());
        return tagRepository.save(tag);
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Active security context signature mismatch."));
    }
}