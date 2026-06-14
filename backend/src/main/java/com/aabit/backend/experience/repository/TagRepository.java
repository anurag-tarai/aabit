package com.aabit.backend.experience.repository;

import com.aabit.backend.experience.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {
    // 💡 Check if a tag name already exists within YOUR dictionary pool
    Optional<Tag> findByNameAndUserId(String name, UUID userId);

    // 💡 Pull your entire master tag list (even if used 0 times!)
    List<Tag> findByUserIdOrderByCreatedAtDesc(UUID userId);
}