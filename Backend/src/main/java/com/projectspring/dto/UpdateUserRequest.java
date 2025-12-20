package com.projectspring.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;
    
    @Email(message = "Email must be valid")
    private String email;
    
    private List<Long> roleIds;
    private List<Long> teamIds;
    private Boolean isAdmin = false;
    private Boolean isActive = true;
}

