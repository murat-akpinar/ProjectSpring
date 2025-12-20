package com.projectspring.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_logs", indexes = {
    @Index(name = "idx_system_logs_source", columnList = "source"),
    @Index(name = "idx_system_logs_level", columnList = "level"),
    @Index(name = "idx_system_logs_created_at", columnList = "created_at"),
    @Index(name = "idx_system_logs_user_id", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 20)
    private String level; // INFO, WARN, ERROR, DEBUG
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Column(nullable = false, length = 20)
    private String source; // BACKEND, FRONTEND
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "ip_address", length = 45)
    private String ipAddress;
    
    @Column(length = 255)
    private String endpoint;
    
    @Column(columnDefinition = "TEXT")
    private String exception;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

