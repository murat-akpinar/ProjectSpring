package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogFilterRequest {
    private String source; // BACKEND, FRONTEND
    private String level; // INFO, WARN, ERROR, DEBUG
    private Long userId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private int page = 0;
    private int size = 50;
}

