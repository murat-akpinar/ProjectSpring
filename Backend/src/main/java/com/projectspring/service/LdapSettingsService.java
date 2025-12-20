package com.projectspring.service;

import com.projectspring.dto.LdapSettingsDTO;
import com.projectspring.dto.LdapTestRequest;
import com.projectspring.dto.LdapTestResponse;
import com.projectspring.dto.UpdateLdapSettingsRequest;
import com.projectspring.model.LdapSettings;
import com.projectspring.repository.LdapSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.support.LdapUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class LdapSettingsService {
    
    @Autowired
    private LdapSettingsRepository ldapSettingsRepository;
    
    @Autowired
    private EncryptionService encryptionService;
    
    public LdapSettingsDTO getLdapSettings() {
        Optional<LdapSettings> settingsOpt = ldapSettingsRepository.findByIsEnabledTrue();
        if (settingsOpt.isEmpty()) {
            // Return default empty settings
            LdapSettingsDTO dto = new LdapSettingsDTO();
            dto.setIsEnabled(false);
            return dto;
        }
        
        LdapSettings settings = settingsOpt.get();
        return convertToDTO(settings);
    }
    
    public LdapSettingsDTO updateLdapSettings(UpdateLdapSettingsRequest request) {
        Optional<LdapSettings> existingOpt = ldapSettingsRepository.findByIsEnabledTrue();
        
        LdapSettings settings;
        if (existingOpt.isPresent()) {
            settings = existingOpt.get();
        } else {
            settings = new LdapSettings();
        }
        
        settings.setUrls(request.getUrls());
        settings.setBase(request.getBase());
        settings.setUsername(request.getUsername());
        
        // Encrypt password if provided
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            settings.setPasswordEncrypted(encryptionService.encrypt(request.getPassword()));
        }
        
        settings.setUserSearchBase(request.getUserSearchBase());
        settings.setUserSearchFilter(request.getUserSearchFilter());
        settings.setIsEnabled(request.getIsEnabled() != null ? request.getIsEnabled() : false);
        
        LdapSettings saved = ldapSettingsRepository.save(settings);
        return convertToDTO(saved);
    }
    
    public LdapTestResponse testLdapConnection(LdapTestRequest request) {
        try {
            // Create a temporary LDAP context source for testing
            LdapContextSource testContextSource = new LdapContextSource();
            testContextSource.setUrl(request.getUrls());
            testContextSource.setBase(request.getBase());
            
            if (request.getUsername() != null && !request.getUsername().isEmpty()) {
                testContextSource.setUserDn(request.getUsername());
            }
            
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                testContextSource.setPassword(request.getPassword());
            }
            
            testContextSource.afterPropertiesSet();
            
            // Create a temporary LDAP template
            LdapTemplate testTemplate = new LdapTemplate(testContextSource);
            
            // Try to perform a simple search to test connection
            String searchBase = request.getUserSearchBase() != null && !request.getUserSearchBase().isEmpty() 
                ? request.getUserSearchBase() 
                : request.getBase();
            
            String searchFilter = request.getUserSearchFilter() != null && !request.getUserSearchFilter().isEmpty()
                ? request.getUserSearchFilter().replace("{0}", "*")
                : "(uid=*)";
            
            // Try to search (limit to 1 result for performance)
            // Use a simple filter that should work on most LDAP servers
            EqualsFilter filter = new EqualsFilter("objectClass", "*");
            testTemplate.search(
                LdapUtils.newLdapName(searchBase),
                filter.encode(),
                (org.springframework.ldap.core.AttributesMapper<Object>) attrs -> null // Simple mapper - we just need to test connection
            );
            
            return new LdapTestResponse(true, "LDAP bağlantısı başarılı", null);
            
        } catch (Exception e) {
            return new LdapTestResponse(false, "LDAP bağlantısı başarısız", e.getMessage());
        }
    }
    
    public LdapSettings getActiveLdapSettings() {
        return ldapSettingsRepository.findByIsEnabledTrue().orElse(null);
    }
    
    private LdapSettingsDTO convertToDTO(LdapSettings settings) {
        LdapSettingsDTO dto = new LdapSettingsDTO();
        dto.setId(settings.getId());
        dto.setUrls(settings.getUrls());
        dto.setBase(settings.getBase());
        dto.setUsername(settings.getUsername());
        // Password is never included in DTO
        dto.setUserSearchBase(settings.getUserSearchBase());
        dto.setUserSearchFilter(settings.getUserSearchFilter());
        dto.setIsEnabled(settings.getIsEnabled());
        dto.setCreatedAt(settings.getCreatedAt());
        dto.setUpdatedAt(settings.getUpdatedAt());
        return dto;
    }
}

