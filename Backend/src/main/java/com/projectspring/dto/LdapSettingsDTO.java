package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LdapSettingsDTO {
    private Long id;
    private String urls;
    private String base;
    private String username;
    // Password is never included in DTO for security
    private String userSearchBase;
    private String userSearchFilter;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

