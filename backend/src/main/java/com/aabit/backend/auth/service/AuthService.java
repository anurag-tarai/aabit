package com.aabit.backend.auth.service;

import com.aabit.backend.auth.dto.AuthResponse;
import com.aabit.backend.auth.dto.LoginRequest;
import com.aabit.backend.auth.entity.User;
import com.aabit.backend.auth.repository.UserRepository;
import com.aabit.backend.auth.util.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        String password = request.password();

        log.info("[LOGIN_ATTEMPT] email={}", email);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.info("[USER_AUTO_REGISTER] email={}", email);
            user = new User();
            user.setEmail(email);
            user.setName(email.split("@")[0]);
            user.setPasswordHash(passwordEncoder.encode(password));
            userRepository.save(user);
        } else {
            log.debug("[USER_FOUND] id={}, email={}", user.getId(), email);
            
            // "Trust on First Login" migration logic for existing users missing a password
            if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
                log.info("[TRUST_ON_FIRST_LOGIN] Migrating existing user email={}", email);
                user.setPasswordHash(passwordEncoder.encode(password));
                userRepository.save(user);
            } else {
                if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                    log.warn("[LOGIN_FAILED] Invalid password email={}", email);
                    throw new IllegalArgumentException("INVALID_CREDENTIALS");
                }
            }
        }

        String token = jwtProvider.generateToken(user.getEmail());
        log.info("[LOGIN_SUCCESS] email={}, userId={}", email, user.getId());

        return new AuthResponse(token, user.getName(), user.getEmail());
    }
}
