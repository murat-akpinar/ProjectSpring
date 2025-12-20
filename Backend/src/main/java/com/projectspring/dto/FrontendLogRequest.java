package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FrontendLogRequest {
    private String level; // INFO, WARN, ERROR, DEBUG
    private String message;
    private String stackTrace; // Optional, for errors
}

