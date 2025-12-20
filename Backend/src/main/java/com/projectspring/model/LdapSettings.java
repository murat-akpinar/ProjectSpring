package com.projectspring.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ldap_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LdapSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String urls;
    
    @Column(nullable = false, length = 500)
    private String base;
    
    @Column(length = 500)
    private String username;
    
    @Column(name = "password_encrypted", length = 500)
    private String passwordEncrypted;
    
    @Column(name = "user_search_base", length = 500)
    private String userSearchBase;
    
    @Column(name = "user_search_filter", length = 500)
    private String userSearchFilter;
    
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

