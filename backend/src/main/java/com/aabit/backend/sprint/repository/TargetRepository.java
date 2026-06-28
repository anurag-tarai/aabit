package com.aabit.backend.sprint.repository;

import com.aabit.backend.sprint.entity.Target;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TargetRepository extends JpaRepository<Target, UUID> {

    List<Target> findByUserIdAndWeekStartDateOrderByCreatedAtAsc(UUID userId, LocalDate weekStartDate);

    /** Fetch all repeating targets from the previous week */
    @Query("""
        SELECT t FROM Target t
        WHERE t.userId = :userId
          AND t.weekStartDate = :prevWeekStart
          AND t.repeating = true
    """)
    List<Target> findRepeatingFromPreviousWeek(
            @Param("userId") UUID userId,
            @Param("prevWeekStart") LocalDate prevWeekStart
    );

    /**
     * Check whether a specific repeating parent has already been
     * cloned to the given week (same workAreaId + name + weekStartDate).
     */
    @Query("""
        SELECT COUNT(t) > 0 FROM Target t
        WHERE t.userId      = :userId
          AND t.workAreaId  = :workAreaId
          AND t.name        = :name
          AND t.weekStartDate = :weekStartDate
    """)
    boolean existsByUserIdAndWorkAreaIdAndNameAndWeekStartDate(
            @Param("userId")        UUID userId,
            @Param("workAreaId")    UUID workAreaId,
            @Param("name")          String name,
            @Param("weekStartDate") LocalDate weekStartDate
    );
}