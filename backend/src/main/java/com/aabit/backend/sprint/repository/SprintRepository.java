package com.aabit.backend.sprint.repository;

import com.aabit.backend.sprint.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, UUID> {

    List<Sprint> findByUserIdOrderByStartDateDesc(UUID userId);

    @Query("""
        SELECT s FROM Sprint s
        WHERE s.userId = :userId
          AND s.startDate <= :today
          AND s.endDate >= :today
        ORDER BY s.startDate DESC
    """)
    Optional<Sprint> findCurrentSprint(@Param("userId") UUID userId, @Param("today") LocalDate today);

    @Query("""
        SELECT COUNT(s) > 0 FROM Sprint s
        WHERE s.userId = :userId
          AND s.startDate <= :endDate
          AND s.endDate >= :startDate
    """)
    boolean hasOverlappingSprint(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
        SELECT COUNT(s) > 0 FROM Sprint s
        WHERE s.userId = :userId
          AND s.id <> :excludeId
          AND s.startDate <= :endDate
          AND s.endDate >= :startDate
    """)
    boolean hasOverlappingSprintExcluding(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") UUID excludeId
    );
}
