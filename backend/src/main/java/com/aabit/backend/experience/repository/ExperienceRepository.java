package com.aabit.backend.experience.repository;

import com.aabit.backend.experience.entity.ExperienceEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExperienceRepository extends JpaRepository<ExperienceEntry, UUID> {


    @Query("SELECT e FROM ExperienceEntry e LEFT JOIN e.tags t " +
            "WHERE e.user.id = :userId " + // Add this line
            "AND (:tagName IS NULL OR t.name = :tagName) " +
            "AND (:year IS NULL OR EXTRACT(YEAR FROM e.timestamp) = :year) " +
            "AND (:month IS NULL OR EXTRACT(MONTH FROM e.timestamp) = :month) " +
            "AND (:day IS NULL OR EXTRACT(DAY FROM e.timestamp) = :day) " +
            "AND e.deleted = false " +
            "GROUP BY e.id " +
            "ORDER BY e.timestamp DESC")
    Page<ExperienceEntry> findFilteredEntries(
            @Param("userId") UUID userId, // Add parameter
            @Param("tagName") String tagName,
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("day") Integer day,
            Pageable pageable);


    @Query(value = "SELECT EXTRACT(DAY FROM timestamp) AS log_day, COUNT(*) AS log_count " +
            "FROM experience_entry " +
            "WHERE user_id = :userId " + // Add this line
            "AND EXTRACT(YEAR FROM timestamp) = :year " +
            "AND EXTRACT(MONTH FROM timestamp) = :month " +
            "AND deleted = false " +
            "GROUP BY EXTRACT(DAY FROM timestamp)",
            nativeQuery = true)
    List<Object[]> getMonthlyLogCounts(@Param("userId") UUID userId, @Param("year") int year, @Param("month") int month);


    @Query("SELECT COUNT(e) FROM ExperienceEntry e WHERE e.user.id = :userId AND e.deleted = false")
    long countActiveEntriesByUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(e) FROM ExperienceEntry e " +
            "WHERE e.user.id = :userId " + // Add this line
            "AND EXTRACT(YEAR FROM e.timestamp) = :year " +
            "AND EXTRACT(MONTH FROM e.timestamp) = :month " +
            "AND e.deleted = false")
    long countMonthlyEntriesByUser(@Param("userId") UUID userId, @Param("year") int year, @Param("month") int month);
}
