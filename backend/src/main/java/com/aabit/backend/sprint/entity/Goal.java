package com.aabit.backend.sprint.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "goal")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String color;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "target_time_percentage", nullable = false)
    private int targetTimePercentage = 0;
}
