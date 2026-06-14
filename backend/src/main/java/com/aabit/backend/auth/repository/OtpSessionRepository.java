package com.aabit.backend.auth.repository;

import com.aabit.backend.auth.entity.OtpSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface OtpSessionRepository extends JpaRepository<OtpSession, UUID> {
    Optional<OtpSession> findTopByEmailOrderByExpiryTimeDesc(String email);
    int deleteByEmail(String email);
}