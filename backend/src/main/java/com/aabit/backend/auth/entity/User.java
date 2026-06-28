package com.aabit.backend.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "user_account")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "vault_pin_wrapped", columnDefinition = "TEXT")
    private String vaultPinWrapped;

    @Column(name = "vault_phrase_wrapped", columnDefinition = "TEXT")
    private String vaultPhraseWrapped;
}