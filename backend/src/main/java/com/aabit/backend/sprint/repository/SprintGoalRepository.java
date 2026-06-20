package com.aabit.backend.sprint.repository;

import com.aabit.backend.sprint.entity.SprintGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SprintGoalRepository extends JpaRepository<SprintGoal, UUID> {

    Optional<SprintGoal> findBySprintIdAndGoalId(UUID sprintId, UUID goalId);

    void deleteBySprintIdAndGoalId(UUID sprintId, UUID goalId);

    boolean existsBySprintIdAndGoalId(UUID sprintId, UUID goalId);
}
