package com.aabit.backend.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "otp_session")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OtpSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 6)
    private String otpCode;

    @Column(nullable = false)
    private Instant expiryTime;
}