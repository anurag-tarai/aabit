package com.aabit.backend.experience.controller;

import com.aabit.backend.experience.entity.Tag;
import com.aabit.backend.experience.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TagController {

    private final ExperienceService experienceService;

    @GetMapping
    public ResponseEntity<List<Tag>> getAllUserTags(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(experienceService.getActiveUserTags(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tag> updateTag(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal String email) {

        String newName = payload.get("name");
        if (newName == null || newName.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(experienceService.renameUserTag(id, newName, email));
    }
}