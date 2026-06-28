package com.aabit.backend.sprint.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "time_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Null for anonymous logs */
    @Column(name = "goal_id")
    private UUID goalId;

    /** Null for anonymous logs */
    @Column(name = "work_area_id")
    private UUID workAreaId;

    /** Non-null only for anonymous logs; null for goal-linked logs */
    @Column(name = "anonymous_name")
    private String anonymousName;

    /** Nullable: allows logging time outside any sprint */
    @Column(name = "sprint_id")
    private UUID sprintId;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // ─── Factory helpers ────────────────────────────────────────

    public boolean isAnonymous() {
        return anonymousName != null;
    }
}