package com.projectspring.config;

import com.projectspring.model.LdapSettings;
import com.projectspring.repository.LdapSettingsRepository;
import com.projectspring.service.EncryptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;

import java.util.Optional;

@Configuration
public class LdapConfig {
    
    @Autowired(required = false)
    private LdapSettingsRepository ldapSettingsRepository;
    
    @Autowired(required = false)
    private EncryptionService encryptionService;
    
    @Value("${spring.ldap.urls:ldap://localhost:389}")
    private String ldapUrls;
    
    @Value("${spring.ldap.base:dc=example,dc=com}")
    private String ldapBase;
    
    @Value("${spring.ldap.username:}")
    private String ldapUsername;
    
    @Value("${spring.ldap.password:}")
    private String ldapPassword;
    
    @Bean
    @Primary
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        
        // Try to get settings from database first
        if (ldapSettingsRepository != null) {
            Optional<LdapSettings> settingsOpt = ldapSettingsRepository.findByIsEnabledTrue();
            if (settingsOpt.isPresent()) {
                LdapSettings settings = settingsOpt.get();
                contextSource.setUrl(settings.getUrls());
                contextSource.setBase(settings.getBase());
                
                if (settings.getUsername() != null && !settings.getUsername().isEmpty()) {
                    contextSource.setUserDn(settings.getUsername());
                }
                
                if (settings.getPasswordEncrypted() != null && !settings.getPasswordEncrypted().isEmpty() && encryptionService != null) {
                    try {
                        String decryptedPassword = encryptionService.decrypt(settings.getPasswordEncrypted());
                        contextSource.setPassword(decryptedPassword);
                    } catch (Exception e) {
                        // If decryption fails, use empty password
                        System.err.println("Failed to decrypt LDAP password: " + e.getMessage());
                    }
                }
                
                contextSource.afterPropertiesSet();
                return contextSource;
            }
        }
        
        // Fallback to application.yml properties
        contextSource.setUrl(ldapUrls);
        contextSource.setBase(ldapBase);
        
        if (ldapUsername != null && !ldapUsername.isEmpty()) {
            contextSource.setUserDn(ldapUsername);
        }
        
        if (ldapPassword != null && !ldapPassword.isEmpty()) {
            contextSource.setPassword(ldapPassword);
        }
        
        contextSource.afterPropertiesSet();
        return contextSource;
    }
    
    @Bean
    @Primary
    public LdapTemplate ldapTemplate() {
        return new LdapTemplate(contextSource());
    }
}

