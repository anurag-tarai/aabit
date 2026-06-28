package com.aabit.backend.sprint.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "target")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Target {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** FK to work_area — the area this target belongs to */
    @Column(name = "work_area_id", nullable = false)
    private UUID workAreaId;

    @Column(nullable = false)
    private String name;

    /**
     * Always a Monday — enforced by DB CHECK constraint and validated
     * in the service before save.
     */
    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "is_completed", nullable = false)
    private boolean completed = false;

    /**
     * When true, this target will be auto-cloned to the next week
     * when that week's targets are first fetched.
     */
    @Column(name = "is_repeating", nullable = false)
    private boolean repeating = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}