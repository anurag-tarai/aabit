package com.aabit.backend.auth.controller;

import com.aabit.backend.auth.dto.*;
import com.aabit.backend.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/request")
    public ResponseEntity<Void> requestOtp(@RequestBody OtpRequest request) {
        authService.requestOtp(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyLogin(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.verifyLogin(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Clear the authenticated user's session from the local thread context
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }
}