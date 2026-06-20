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

    // Matrix aggregation: day x goal -> total minutes for the month
    // Returns raw Object[] rows: [day(int), goalId(uuid), totalMinutes(int)]
    @Query(value = """
        SELECT
            CAST(EXTRACT(DAY FROM (start_time AT TIME ZONE :tz)) AS INTEGER) AS day,
            goal_id,
            CAST(SUM(duration_minutes) AS INTEGER) AS total_minutes
        FROM time_log
        WHERE user_id = :userId
          AND sprint_id = :sprintId
          AND TO_CHAR(start_time AT TIME ZONE :tz, 'YYYY-MM') = :month
        GROUP BY 1, 2
    """, nativeQuery = true)
    List<Object[]> getMonthlyMatrixRaw(
            @Param("userId") UUID userId,
            @Param("sprintId") UUID sprintId,
            @Param("month") String month,   // format: "YYYY-MM"
            @Param("tz") String timezone
    );
}
