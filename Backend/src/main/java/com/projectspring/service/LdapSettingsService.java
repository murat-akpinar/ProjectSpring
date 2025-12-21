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
            
            // Test connection: First try base DN (always exists), then userSearchBase if provided
            String baseDn = request.getBase();
            String userSearchBase = request.getUserSearchBase();
            
            // Step 1: Test base DN connection by trying to lookup or search the base DN
            try {
                // Try to lookup the base DN to verify it exists and is accessible
                testTemplate.lookup(LdapUtils.newLdapName(baseDn));
            } catch (Exception e) {
                // If lookup fails, try a simple search as fallback (scope: base)
                try {
                    EqualsFilter filter = new EqualsFilter("objectClass", "*");
                    testTemplate.search(
                        LdapUtils.newLdapName(baseDn),
                        filter.encode(),
                        (org.springframework.ldap.core.AttributesMapper<Object>) attrs -> null
                    );
                } catch (Exception e2) {
                    // If both fail, the base DN doesn't exist or is not accessible
                    String errorMsg = "LDAP bağlantısı başarısız: Base DN '" + baseDn + "' bulunamadı veya erişilemedi. " + 
                        "Lütfen şunları kontrol edin:\n" +
                        "1. LDAP sunucusunda bu DN'in mevcut olduğundan emin olun\n" +
                        "2. Kullanıcı adı ve şifrenin doğru olduğundan emin olun\n" +
                        "3. LDAP URL'sinin doğru olduğundan emin olun (Docker içinden: ldap://ldap-test:389)\n" +
                        "Hata: " + e2.getMessage();
                    return new LdapTestResponse(false, errorMsg, e2.getMessage());
                }
            }
            
            // Step 2: If userSearchBase is provided, test it (optional)
            String warningMessage = null;
            if (userSearchBase != null && !userSearchBase.isEmpty()) {
                try {
                    EqualsFilter filter = new EqualsFilter("objectClass", "*");
                    testTemplate.search(
                        LdapUtils.newLdapName(userSearchBase),
                        filter.encode(),
                        (org.springframework.ldap.core.AttributesMapper<Object>) attrs -> null
                    );
                } catch (Exception e) {
                    // userSearchBase doesn't exist, but base connection is OK
                    warningMessage = "LDAP bağlantısı başarılı, ancak User Search Base '" + userSearchBase + "' bulunamadı. " +
                        "Lütfen bu DN'in LDAP sunucusunda mevcut olduğundan emin olun. " +
                        "Hata: " + e.getMessage();
                }
            }
            
            // Connection successful
            String successMessage = warningMessage != null 
                ? "LDAP bağlantısı başarılı. Uyarı: " + warningMessage
                : "LDAP bağlantısı başarılı";
            
            return new LdapTestResponse(true, successMessage, warningMessage);
            
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

