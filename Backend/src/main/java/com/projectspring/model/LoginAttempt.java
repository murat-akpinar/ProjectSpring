package com.projectspring.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_attempts", indexes = {
    @Index(name = "idx_username", columnList = "username"),
    @Index(name = "idx_ip_address", columnList = "ip_address"),
    @Index(name = "idx_attempt_time", columnList = "attempt_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", length = 100)
    private String username;
    
    @Column(name = "ip_address", length = 45, nullable = false)
    private String ipAddress;
    
    @Column(name = "attempt_time", nullable = false)
    private LocalDateTime attemptTime;
    
    @Column(name = "success", nullable = false)
    private Boolean success;
    
    @PrePersist
    protected void onCreate() {
        if (attemptTime == null) {
            attemptTime = LocalDateTime.now();
        }
    }
}

