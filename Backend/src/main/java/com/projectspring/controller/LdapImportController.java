package com.projectspring.controller;

import com.projectspring.dto.LdapSearchRequest;
import com.projectspring.dto.LdapUserDTO;
import com.projectspring.model.User;
import com.projectspring.service.LdapImportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/ldap")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN')")
public class LdapImportController {

    @Autowired
    private LdapImportService ldapImportService;

    @PostMapping("/search")
    public ResponseEntity<?> searchUsers(@Valid @RequestBody LdapSearchRequest request) {
        try {
            List<LdapUserDTO> users = ldapImportService.searchUsers(request.getUsername());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to search LDAP users: " + e.getMessage()));
        }
    }

    @PostMapping("/import")
    public ResponseEntity<?> importUser(@RequestBody Map<String, Object> request) {
        try {
            LdapUserDTO ldapUser = new LdapUserDTO();
            ldapUser.setUsername((String) request.get("username"));
            ldapUser.setEmail((String) request.get("email"));
            ldapUser.setFullName((String) request.get("fullName"));
            ldapUser.setLdapDn((String) request.get("ldapDn"));

            @SuppressWarnings("unchecked")
            Set<Long> roleIds = request.get("roleIds") != null ?
                    (Set<Long>) request.get("roleIds") : null;

            User user = ldapImportService.importLdapUser(ldapUser, roleIds);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to import LDAP user"));
        }
    }
}

