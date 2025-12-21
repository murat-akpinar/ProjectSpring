package com.projectspring.controller;

import com.projectspring.dto.LdapSettingsDTO;
import com.projectspring.dto.LdapTestRequest;
import com.projectspring.dto.LdapTestResponse;
import com.projectspring.dto.UpdateLdapSettingsRequest;
import com.projectspring.service.LdapSettingsService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/ldap/settings")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN')")
public class LdapSettingsController {
    
    @Autowired
    private LdapSettingsService ldapSettingsService;
    
    @GetMapping
    public ResponseEntity<LdapSettingsDTO> getLdapSettings() {
        try {
            LdapSettingsDTO settings = ldapSettingsService.getLdapSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping
    public ResponseEntity<?> updateLdapSettings(@Valid @RequestBody UpdateLdapSettingsRequest request) {
        try {
            LdapSettingsDTO settings = ldapSettingsService.updateLdapSettings(request);
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", "LDAP ayarları güncellenemedi: " + e.getMessage()));
        }
    }
    
    @PostMapping("/test")
    public ResponseEntity<LdapTestResponse> testLdapConnection(@Valid @RequestBody LdapTestRequest request) {
        try {
            LdapTestResponse response = ldapSettingsService.testLdapConnection(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            LdapTestResponse errorResponse = new LdapTestResponse(false, "Test başarısız", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/test/auto")
    public ResponseEntity<LdapTestResponse> testLdapConnectionAuto() {
        try {
            LdapTestResponse response = ldapSettingsService.testLdapConnectionWithSavedPassword();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            LdapTestResponse errorResponse = new LdapTestResponse(false, "Otomatik test başarısız", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}

