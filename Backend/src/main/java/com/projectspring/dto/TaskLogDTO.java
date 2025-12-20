package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskLogDTO {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private String action;
    private String oldValue;
    private String newValue;
    private Long changedById;
    private String changedByUsername;
    private String changedByFullName;
    private String changeReason;
    private LocalDateTime createdAt;
}

