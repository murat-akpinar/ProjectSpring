package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogDTO {
    private Long id;
    private String level;
    private String message;
    private String source;
    private Long userId;
    private String username;
    private String fullName;
    private String ipAddress;
    private String endpoint;
    private String exception;
    private LocalDateTime createdAt;
}

