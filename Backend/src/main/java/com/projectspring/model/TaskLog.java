package com.projectspring.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_logs", indexes = {
    @Index(name = "idx_task_logs_task_id", columnList = "task_id"),
    @Index(name = "idx_task_logs_changed_by", columnList = "changed_by"),
    @Index(name = "idx_task_logs_action", columnList = "action"),
    @Index(name = "idx_task_logs_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;
    
    @Column(nullable = false, length = 50)
    private String action; // CREATED, UPDATED, DELETED, STATUS_CHANGED, ASSIGNEE_ADDED, ASSIGNEE_REMOVED
    
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue; // JSON formatında
    
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue; // JSON formatında
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;
    
    @Column(name = "change_reason", length = 500)
    private String changeReason;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

