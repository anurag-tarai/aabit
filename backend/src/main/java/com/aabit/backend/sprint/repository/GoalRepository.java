package com.aabit.backend.sprint.repository;

import com.aabit.backend.sprint.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findByUserIdOrderByTargetTimePercentageDescNameAsc(UUID userId);

    @Query("""
        SELECT g FROM Goal g
        JOIN SprintGoal sg ON sg.goalId = g.id
        WHERE sg.sprintId = :sprintId AND g.userId = :userId
        ORDER BY g.targetTimePercentage DESC, g.name ASC
    """)
    List<Goal> findGoalsBySprintId(
            @Param("sprintId") UUID sprintId,
            @Param("userId") UUID userId
    );
}
