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

    /** FK to work_area — the area this target belongs to (nullable for goal/anon targets) */
    @Column(name = "work_area_id")
    private UUID workAreaId;

    @Column(name = "goal_id")
    private UUID goalId;

    @Column(name = "target_type", nullable = false)
    private String targetType = "WEEKLY";

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "is_fixed", nullable = false)
    private boolean isFixed = false;

    @Column(nullable = false)
    private String priority = "MEDIUM";

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


    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}