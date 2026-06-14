package com.aabit.backend.auth.dto;

public record AuthResponse(String token, String name, String email) {}