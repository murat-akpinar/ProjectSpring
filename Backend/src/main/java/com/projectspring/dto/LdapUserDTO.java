package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LdapUserDTO {
    private String username;
    private String email;
    private String fullName;
    private String ldapDn;
    private String cn; // Common Name
    private String sn; // Surname
    private String givenName;
}

