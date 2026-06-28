package com.aabit.backend.auth.controller;

import com.aabit.backend.auth.dto.VaultMetadataResponse;
import com.aabit.backend.auth.dto.VaultSetupRequest;
import com.aabit.backend.auth.entity.User;
import com.aabit.backend.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class VaultController {

    private final UserRepository userRepository;

    // Returns the two wrapped key envelopes for the authenticated user.
    // Used by a new device/browser to download and unlock the vault with a PIN.
    @GetMapping("/vault-metadata")
    public ResponseEntity<VaultMetadataResponse> getVaultMetadata(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(new VaultMetadataResponse(user.getVaultPinWrapped(), user.getVaultPhraseWrapped()));
    }

    // Called once during VaultSetupModal completion to persist the two envelopes.
    // PUT because we update User Account
    @PutMapping("/vault-setup")
    public ResponseEntity<String> setupVault(
            @RequestBody VaultSetupRequest request,
            @AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getVaultPinWrapped() != null || user.getVaultPhraseWrapped() != null) {
            throw  new IllegalArgumentException("VAULT_ALREADY_INITIALIZED: Cannot overwrite an active cryptographic envelope context.");
        }

        user.setVaultPinWrapped(request.vaultPinWrapped());
        user.setVaultPhraseWrapped(request.vaultPhraseWrapped());
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    // Called after PIN reset via recovery phrase to store the new PIN-wrapped envelope.
    @PutMapping("/vault-pin")
    public ResponseEntity<Void> updateVaultPin(
            @RequestBody VaultSetupRequest request,
            @AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        // Only update the PIN envelope — phrase envelope stays unchanged

        if (request.vaultPinWrapped() != null && !request.vaultPinWrapped().isBlank()) {
            user.setVaultPinWrapped(request.vaultPinWrapped());
            userRepository.save(user);
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/vault-phrase")
    public ResponseEntity<Void> updateVaultPhrase(
            @RequestBody VaultSetupRequest request,
            @AuthenticationPrincipal String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 💡 FIXED SAFEGUARD: Only update if the string is provided and not blank
        if (request.vaultPhraseWrapped() != null && !request.vaultPhraseWrapped().isBlank()) {
            user.setVaultPhraseWrapped(request.vaultPhraseWrapped());
            userRepository.save(user);
        }
        return ResponseEntity.ok().build();
    }
}