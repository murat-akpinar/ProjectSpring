package com.projectspring.service;

import com.projectspring.model.LoginAttempt;
import com.projectspring.repository.LoginAttemptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LoginAttemptService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginAttemptService.class);
    
    @Autowired
    private LoginAttemptRepository loginAttemptRepository;
    
    @Value("${app.security.rate-limit.max-attempts:5}")
    private int maxAttempts;
    
    @Value("${app.security.rate-limit.window-minutes:15}")
    private int windowMinutes;
    
    @Value("${app.security.account-lockout.max-failed-attempts:10}")
    private int maxFailedAttempts;
    
    @Value("${app.security.account-lockout.lockout-duration-minutes:30}")
    private int lockoutDurationMinutes;
    
    public void recordLoginAttempt(String username, String ipAddress, boolean success) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setUsername(username);
        attempt.setIpAddress(ipAddress);
        attempt.setSuccess(success);
        attempt.setAttemptTime(LocalDateTime.now());
        loginAttemptRepository.save(attempt);
        logger.debug("Recorded login attempt: user={}, IP={}, success={}", username, ipAddress, success);
    }
    
    public boolean isIpBlocked(String ipAddress) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(windowMinutes);
        Long failedCount = loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since);
        boolean blocked = failedCount != null && failedCount >= maxAttempts;
        logger.debug("IP rate limiting check for IP {}: failed attempts={}, max attempts={}, window={} minutes, blocked={}", 
            ipAddress, failedCount != null ? failedCount : 0, maxAttempts, windowMinutes, blocked);
        return blocked;
    }
    
    public boolean isAccountLocked(String username) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutDurationMinutes);
        Long failedCount = loginAttemptRepository.countFailedAttemptsByUsernameSince(username, since);
        boolean locked = failedCount != null && failedCount >= maxFailedAttempts;
        logger.debug("Account lockout check for user {}: failed attempts={}, max attempts={}, lockout duration={} minutes, locked={}", 
            username, failedCount != null ? failedCount : 0, maxFailedAttempts, lockoutDurationMinutes, locked);
        return locked;
    }
    
    public int getRemainingAttempts(String username) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutDurationMinutes);
        Long failedCount = loginAttemptRepository.countFailedAttemptsByUsernameSince(username, since);
        if (failedCount == null) {
            return maxFailedAttempts;
        }
        return Math.max(0, maxFailedAttempts - failedCount.intValue());
    }
    
    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void cleanupOldAttempts() {
        // Keep attempts for last 24 hours
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        loginAttemptRepository.deleteByAttemptTimeBefore(cutoff);
    }
}

