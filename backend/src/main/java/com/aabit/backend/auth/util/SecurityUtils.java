package com.aabit.backend.auth.util;

import com.aabit.backend.auth.entity.User;
import com.aabit.backend.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Resolves the full User entity from the active security context email string principal.
     */
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new SecurityException("UNAUTHORIZED: Active security context signature mismatch."));
    }

    /**
     * Shortcut to fetch just the UUID, avoiding a database hit if your token filter
     * already populates the principal with a custom UserDetails object containing the ID.
     */
    public UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }
}