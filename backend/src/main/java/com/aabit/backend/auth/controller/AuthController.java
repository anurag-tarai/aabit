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

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Clear the authenticated user's session from the local thread context
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        return ResponseEntity.ok().build();
    }
}
