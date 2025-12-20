package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthDTO {
    private HealthStatus backendStatus;
    private HealthStatus databaseStatus;
    private HealthStatus frontendStatus;
    private LocalDateTime lastChecked;
    private String backendMessage;
    private String databaseMessage;
    private String frontendMessage;
    
    public enum HealthStatus {
        HEALTHY,
        UNHEALTHY,
        UNKNOWN
    }
}

