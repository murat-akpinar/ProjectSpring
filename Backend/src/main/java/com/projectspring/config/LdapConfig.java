package com.projectspring.config;

import com.projectspring.model.LdapSettings;
import com.projectspring.repository.LdapSettingsRepository;
import com.projectspring.service.EncryptionService;
import org.springframework.beans.factory.annotation.Autowired;
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
    
    @Bean
    @Primary
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        
        // Only read from database - no fallback to application.yml or docker-compose
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
        
        // If no settings in database or LDAP disabled, return empty context source
        // LDAP will be silently disabled - application continues to work
        contextSource.setUrl("ldap://localhost:389");
        contextSource.setBase("dc=example,dc=com");
        contextSource.afterPropertiesSet();
        return contextSource;
    }
    
    @Bean
    @Primary
    public LdapTemplate ldapTemplate() {
        return new LdapTemplate(contextSource());
    }
}

