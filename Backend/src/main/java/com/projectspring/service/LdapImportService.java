package com.projectspring.service;

import com.projectspring.dto.LdapSearchRequest;
import com.projectspring.dto.LdapUserDTO;
import com.projectspring.model.RoleEntity;
import com.projectspring.model.User;
import com.projectspring.repository.RoleRepository;
import com.projectspring.repository.UserRepository;
import com.projectspring.util.LdapInputSanitizer;
import com.projectspring.model.LdapSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.core.ContextMapper;
import org.springframework.ldap.core.DirContextAdapter;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.support.LdapUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.Name;
import javax.naming.directory.Attributes;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class LdapImportService {

    @Autowired
    private LdapTemplate ldapTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private LdapSettingsService ldapSettingsService;

    public List<LdapUserDTO> searchUsers(String username) {
        List<LdapUserDTO> results = new ArrayList<>();

        try {
            // Check LDAP settings from database
            LdapSettings activeSettings = ldapSettingsService.getActiveLdapSettings();
            if (activeSettings == null || activeSettings.getIsEnabled() == null || !activeSettings.getIsEnabled()) {
                return results; // Return empty list if LDAP is disabled
            }
            
            // Get userSearchBase from database settings
            String userSearchBase = activeSettings.getUserSearchBase();
            
            // Use userSearchBase if available, otherwise use base DN
            Name searchBase = (userSearchBase != null && !userSearchBase.isEmpty())
                ? LdapUtils.newLdapName(userSearchBase)
                : LdapUtils.emptyLdapName();
            
            // Sanitize username input to prevent LDAP injection
            String sanitizedUsername = LdapInputSanitizer.sanitizeUsername(username);
            EqualsFilter filter = new EqualsFilter("uid", sanitizedUsername);
            
            System.out.println("LDAP Search - Username: " + sanitizedUsername + ", SearchBase: " + userSearchBase);
            
            // Use ContextMapper to get DN from search result
            List<LdapUserDTO> users = ldapTemplate.search(
                    searchBase,
                    filter.encode(),
                    (ContextMapper<LdapUserDTO>) ctx -> {
                        DirContextAdapter adapter = (DirContextAdapter) ctx;
                        LdapUserDTO dto = new LdapUserDTO();
                        dto.setUsername(getAttributeValue(adapter.getAttributes(), "uid"));
                        dto.setEmail(getAttributeValue(adapter.getAttributes(), "mail"));
                        dto.setFullName(getAttributeValue(adapter.getAttributes(), "cn"));
                        dto.setCn(getAttributeValue(adapter.getAttributes(), "cn"));
                        dto.setSn(getAttributeValue(adapter.getAttributes(), "sn"));
                        dto.setGivenName(getAttributeValue(adapter.getAttributes(), "givenName"));
                        // Get DN from the context
                        dto.setLdapDn(adapter.getDn().toString());
                        return dto;
                    }
            );
            
            System.out.println("LDAP Search - Found " + users.size() + " users");

            results.addAll(users);
        } catch (Exception e) {
            // Log error but don't throw - return empty list
            System.err.println("LDAP search error: " + e.getMessage());
            e.printStackTrace(); // Print full stack trace for debugging
        }

        return results;
    }

    public User importLdapUser(LdapUserDTO ldapUser, Set<Long> roleIds) {
        // Check if user already exists (including soft-deleted users)
        Optional<User> existingUser = userRepository.findByUsername(ldapUser.getUsername());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // If user is soft-deleted (isActive = false), reactivate and update
            if (user.getIsActive() != null && !user.getIsActive()) {
                System.out.println("LDAP Import - Reactivating soft-deleted user: " + ldapUser.getUsername());
                // Update user info and reactivate
                user.setEmail(ldapUser.getEmail() != null ? ldapUser.getEmail() : user.getEmail());
                user.setFullName(ldapUser.getFullName() != null ? ldapUser.getFullName() : user.getFullName());
                user.setLdapDn(ldapUser.getLdapDn() != null ? ldapUser.getLdapDn() : user.getLdapDn());
                user.setPassword(null); // Ensure password is null for LDAP users
                user.setIsActive(true);
                
                // Update roles if provided
                if (roleIds != null && !roleIds.isEmpty()) {
                    Set<RoleEntity> roles = roleIds.stream()
                            .map(roleId -> roleRepository.findById(roleId)
                                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleId)))
                            .collect(java.util.stream.Collectors.toSet());
                    user.setRoles(roles);
                }
                
                return userRepository.save(user);
            } else {
                // User is active, cannot import
                throw new RuntimeException("User already exists: " + ldapUser.getUsername());
            }
        }

        // Check if LDAP DN already exists (including soft-deleted users)
        if (ldapUser.getLdapDn() != null) {
            Optional<User> existingByDn = userRepository.findByLdapDn(ldapUser.getLdapDn());
            if (existingByDn.isPresent()) {
                User user = existingByDn.get();
                // If user is soft-deleted, reactivate (same logic as above)
                if (user.getIsActive() != null && !user.getIsActive()) {
                    System.out.println("LDAP Import - Reactivating soft-deleted user by DN: " + ldapUser.getLdapDn());
                    user.setEmail(ldapUser.getEmail() != null ? ldapUser.getEmail() : user.getEmail());
                    user.setFullName(ldapUser.getFullName() != null ? ldapUser.getFullName() : user.getFullName());
                    user.setUsername(ldapUser.getUsername()); // Update username if changed
                    user.setPassword(null);
                    user.setIsActive(true);
                    
                    if (roleIds != null && !roleIds.isEmpty()) {
                        Set<RoleEntity> roles = roleIds.stream()
                                .map(roleId -> roleRepository.findById(roleId)
                                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleId)))
                                .collect(java.util.stream.Collectors.toSet());
                        user.setRoles(roles);
                    }
                    
                    return userRepository.save(user);
                } else {
                    throw new RuntimeException("User with this LDAP DN already exists");
                }
            }
        }

        // Create new user
        User user = new User();
        user.setUsername(ldapUser.getUsername());
        user.setEmail(ldapUser.getEmail() != null ? ldapUser.getEmail() : ldapUser.getUsername() + "@example.com");
        user.setFullName(ldapUser.getFullName() != null ? ldapUser.getFullName() : ldapUser.getUsername());
        user.setLdapDn(ldapUser.getLdapDn());
        user.setPassword(null); // LDAP users don't have passwords in database
        user.setIsActive(true);

        // Assign roles
        Set<RoleEntity> roles = new HashSet<>();
        if (roleIds != null && !roleIds.isEmpty()) {
            roles = roleIds.stream()
                    .map(roleId -> roleRepository.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleId)))
                    .collect(java.util.stream.Collectors.toSet());
        } else {
            // Default role if none specified
            roleRepository.findByName("YAZILIMCI")
                    .ifPresent(roles::add);
        }
        user.setRoles(roles);

        return userRepository.save(user);
    }

    private String getAttributeValue(Attributes attrs, String attributeName) {
        try {
            if (attrs.get(attributeName) != null) {
                Object value = attrs.get(attributeName).get();
                return value != null ? value.toString() : null;
            }
        } catch (Exception e) {
            // Attribute not found or error reading
        }
        return null;
    }
}

