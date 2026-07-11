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


}