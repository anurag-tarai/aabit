package com.aabit.backend.auth.service;

import com.aabit.backend.auth.dto.*;
import com.aabit.backend.auth.entity.OtpSession;
import com.aabit.backend.auth.entity.User;
import com.aabit.backend.auth.repository.OtpSessionRepository;
import com.aabit.backend.auth.repository.UserRepository;
import com.aabit.backend.auth.util.JwtProvider;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OtpSessionRepository otpSessionRepository;
    private final JavaMailSender mailSender;
    private final JwtProvider jwtProvider;

    @Transactional
    public void requestOtp(OtpRequest request) {

        String email = request.email().trim().toLowerCase();
        log.info("[OTP_REQUEST] email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.info("[USER_AUTO_REGISTER] email={}", email);

                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(email.split("@")[0]);

                    return userRepository.save(newUser);
                });

        log.debug("[USER_FOUND] id={}, email={}", user.getId(), email);

        OtpSession lastSession = otpSessionRepository
                .findTopByEmailOrderByExpiryTimeDesc(email)
                .orElse(null);

        if (lastSession != null &&
                lastSession.getExpiryTime().isAfter(Instant.now().minus(Duration.ofMinutes(5)))) {

            log.warn("[OTP_RATE_LIMIT] email={} too many requests", email);
            throw new IllegalStateException("Wait 5 minute before requesting another OTP: " + email);
        }

        int deleted = otpSessionRepository.deleteByEmail(email);
        log.info("[OTP_CLEANUP] email={}, deleted={}", email, deleted);


        String otp = String.format(
                "%06d",
                ThreadLocalRandom.current().nextInt(1_000_000)
        );

        OtpSession session = new OtpSession();
        session.setEmail(email);
        session.setOtpCode(otp);
        session.setExpiryTime(Instant.now().plus(Duration.ofMinutes(5)));

        otpSessionRepository.save(session);

        log.info("[OTP_CREATED] email={}, expiresAt={}", email, session.getExpiryTime());

        dispatchEmailNotification(email, otp);

        log.info("[OTP_REQUEST_DONE] email={}", email);
    }

    @Transactional(readOnly = true)
    public AuthResponse verifyLogin(LoginRequest request) {

        String email = request.email().trim().toLowerCase();
        String otpInput = request.otpCode().trim();

        log.info("[OTP_VERIFY] email={}", email);

        OtpSession session = otpSessionRepository.findTopByEmailOrderByExpiryTimeDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("OTP_NOT_FOUND"));

        if (session.getExpiryTime().isBefore(Instant.now())) {
            log.warn("[OTP_EXPIRED] email={}", email);
            throw new IllegalStateException("OTP_EXPIRED");
        }

        if (!session.getOtpCode().equals(otpInput)) {
            log.warn("[OTP_INVALID] email={}", email);
            throw new IllegalArgumentException("OTP_INVALID");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        String token = jwtProvider.generateToken(user.getEmail());

        log.info("[LOGIN_SUCCESS] email={}, userId={}", email, user.getId());

        return new AuthResponse(token, user.getName(), user.getEmail());
    }

    // Replace your old dispatchEmailNotification method with this version:
    private void dispatchEmailNotification(String targetEmail, String code) {

        log.info("[EMAIL_SEND_START] email={}", targetEmail);

        try {

            MimeMessage mimeMessage = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("Aabit OS <anurag.dev051@gmail.com>");

            helper.setReplyTo("anurag.dev051@gmail.com");

            helper.setTo(targetEmail);

            helper.setSubject("Verify Your Email - Aabit OS");

            String htmlLayout = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 40px 20px; color: #333333; }
                    .card { max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e1e4e6; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                    h2 { font-size: 20px; font-weight: 700; color: #111111; margin-top: 0; margin-bottom: 8px; text-align: center; }
                    p { font-size: 14px; color: #666666; margin: 0 0 24px 0; text-align: center; line-height: 1.5; }
                    .otp-box { font-family: ui-monospace, SFMono-Regular, SF Pro Mono, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2563eb; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; }
                    .footer { font-size: 12px; color: #999999; text-align: center; margin-top: 24px; border-top: 1px solid #f1f3f5; padding-top: 16px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Verify Your Email</h2>
                    <p>Your OTP is:</p>
                    
                    <div class="otp-box">%s</div>
                    
                    <p style="font-size: 13px; margin-bottom: 0;">Valid for 5 minutes.</p>
                    <div class="footer">
                        This is an automated operational node message from your personal Life OS.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(code);

            helper.setText(htmlLayout, true);

            mailSender.send(mimeMessage);

            log.info("[EMAIL_SENT_SUCCESS] email={}", targetEmail);

        } catch (Exception e) {
            log.error("[EMAIL_SEND_FAILED] email={}", targetEmail, e);
            throw new RuntimeException("EMAIL_DELIVERY_FAILED");
        }
    }

}
