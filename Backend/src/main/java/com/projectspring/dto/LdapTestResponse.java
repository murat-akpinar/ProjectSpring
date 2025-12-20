package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LdapTestResponse {
    private Boolean success;
    private String message;
    private String errorDetails;
}

