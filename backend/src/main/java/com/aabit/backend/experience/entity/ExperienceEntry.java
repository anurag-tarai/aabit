package com.aabit.backend.experience.entity;

import com.aabit.backend.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "experience_entry")
@Data
public class ExperienceEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TIMESTAMPTZ")
    private Instant timestamp;

    @Column(name = "markdown_content", nullable = false, columnDefinition = "TEXT")
    private String markdownContent;

    @Column(nullable = false)
    private boolean sensitive = false;

    @Column(name = "client_encrypted", nullable = false)
    private boolean clientEncrypted = false;

    @Column(nullable = false)
    private boolean deleted = false;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // Scopes the log entry directly to the logged-in user account node

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "experience_entry_tag",
            joinColumns = @JoinColumn(name = "experience_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();
}