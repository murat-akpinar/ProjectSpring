package com.projectspring.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLdapSettingsRequest {
    @NotBlank(message = "LDAP URLs is required")
    private String urls;
    
    @NotBlank(message = "LDAP Base DN is required")
    private String base;
    
    private String username;
    private String password; // Will be encrypted before saving
    private String userSearchBase;
    private String userSearchFilter;
    private Boolean isEnabled = false;
}

