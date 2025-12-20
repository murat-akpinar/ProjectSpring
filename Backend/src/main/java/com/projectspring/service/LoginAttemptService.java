package com.projectspring.service;

import com.projectspring.model.LoginAttempt;
import com.projectspring.repository.LoginAttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LoginAttemptService {
    
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
    }
    
    public boolean isIpBlocked(String ipAddress) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(windowMinutes);
        Long failedCount = loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since);
        return failedCount != null && failedCount >= maxAttempts;
    }
    
    public boolean isAccountLocked(String username) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(lockoutDurationMinutes);
        Long failedCount = loginAttemptRepository.countFailedAttemptsByUsernameSince(username, since);
        return failedCount != null && failedCount >= maxFailedAttempts;
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

