package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskLogFilterRequest {
    private Long taskId;
    private Long userId;
    private String action; // CREATED, UPDATED, DELETED, STATUS_CHANGED, ASSIGNEE_ADDED, ASSIGNEE_REMOVED
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int page = 0;
    private int size = 50;
}

