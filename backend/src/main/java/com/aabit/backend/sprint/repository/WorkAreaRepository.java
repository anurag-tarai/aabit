package com.aabit.backend.sprint.repository;

import com.aabit.backend.sprint.entity.WorkArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkAreaRepository extends JpaRepository<WorkArea, UUID> {

    List<WorkArea> findByGoalIdOrderByName(UUID goalId);
}
