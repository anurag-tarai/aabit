package com.aabit.backend.sprint.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "sprint_goal", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"sprint_id", "goal_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SprintGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sprint_id", nullable = false)
    private UUID sprintId;

    @Column(name = "goal_id", nullable = false)
    private UUID goalId;

    private int priority = 1;
}
