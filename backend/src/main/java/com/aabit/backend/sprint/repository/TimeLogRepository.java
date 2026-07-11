package com.aabit.backend.sprint.repository;

import com.aabit.backend.sprint.dto.CalendarMatrixResponse.MatrixCell;
import com.aabit.backend.sprint.entity.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, UUID> {

    // Prevents overlapping time entries for the same user
    @Query("""
        SELECT COUNT(t) > 0 FROM TimeLog t
        WHERE t.userId = :userId
          AND t.startTime < :endTime
          AND t.endTime > :startTime
    """)
    boolean hasTimelineCollision(
            @Param("userId") UUID userId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime
    );

    // All logs for a specific day in user's timezone, for a sprint
    // Used by the "click a day" detail panel on the frontend
    @Query(value = """
        SELECT * FROM time_log
        WHERE user_id = :userId
          AND sprint_id = :sprintId
          AND DATE(start_time AT TIME ZONE :tz) = CAST(:day AS DATE)
        ORDER BY start_time ASC
    """, nativeQuery = true)
    List<TimeLog> findLogsForDay(
            @Param("userId") UUID userId,
            @Param("sprintId") UUID sprintId,
            @Param("day") String day,      // format: "YYYY-MM-DD"
            @Param("tz") String timezone
    );

    /**
     * Matrix aggregation: day × (goal or anonymous_name) → total minutes.
     * For goal rows:      goal_id is set,     anonymous_label is null.
     * For anonymous rows: goal_id is null,    anonymous_label = anonymous_name.
     */
    @Query(value = """
    SELECT
        CAST(EXTRACT(DAY FROM (start_time AT TIME ZONE :tz)) AS INTEGER) AS day,
        goal_id,
        CAST(SUM(duration_minutes) AS INTEGER) AS total_minutes,
        anonymous_name AS anonymous_label
    FROM time_log
    WHERE user_id  = :userId
      AND sprint_id = :sprintId
      AND TO_CHAR(start_time AT TIME ZONE :tz, 'YYYY-MM') = :month
    GROUP BY 1, 2, 4
    ORDER BY 1, 2 NULLS LAST
""", nativeQuery = true)
    List<Object[]> getMonthlyMatrixRaw(
            @Param("userId")   UUID userId,
            @Param("sprintId") UUID sprintId,
            @Param("month")    String month,
            @Param("tz")       String timezone
    );


    /**
     * Same overlap check as hasTimelineCollision, but ignores the log being edited.
     */
    @Query(value = """
    SELECT COUNT(*) > 0
    FROM time_log
    WHERE user_id = :userId
      AND id != :excludeId
      AND start_time < :endTime
      AND end_time   > :startTime
    """, nativeQuery = true)
    boolean hasTimelineCollisionExcluding(
            @Param("userId")    UUID userId,
            @Param("startTime") Instant startTime,
            @Param("endTime")   Instant endTime,
            @Param("excludeId") UUID excludeId
    );

    @Query(value = """
    SELECT
        goal_id,
        CAST(SUM(duration_minutes) AS INTEGER) AS total_minutes,
        anonymous_name AS anonymous_label
    FROM time_log
    WHERE user_id  = :userId
      AND sprint_id = :sprintId
    GROUP BY 1, 3
    ORDER BY 1 NULLS LAST
    """, nativeQuery = true)
    List<Object[]> getLifetimeSummaryRaw(
            @Param("userId")   UUID userId,
            @Param("sprintId") UUID sprintId
    );
}
