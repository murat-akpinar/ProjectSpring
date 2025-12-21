package com.projectspring.service;

import com.projectspring.model.RoleEntity;
import com.projectspring.model.User;
import com.projectspring.model.enums.Role;
import com.projectspring.repository.RoleRepository;
import com.projectspring.repository.UserRepository;
import com.projectspring.util.LdapInputSanitizer;
import com.projectspring.model.LdapSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.support.LdapUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.ldap.authentication.ad.ActiveDirectoryLdapAuthenticationProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.Name;
import javax.naming.directory.Attributes;
import java.util.Optional;

@Service
public class LdapAuthService {
    
    @Autowired
    private LdapTemplate ldapTemplate;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private LdapSettingsService ldapSettingsService;
    
    public String authenticate(String username, String password) {
        // Sanitize username input to prevent LDAP injection
        String sanitizedUsername = LdapInputSanitizer.sanitizeUsername(username);
        
        // Check LDAP settings from database
        LdapSettings activeSettings = ldapSettingsService.getActiveLdapSettings();
        boolean ldapEnabled = activeSettings != null && activeSettings.getIsEnabled() != null && activeSettings.getIsEnabled();
        
        // Try LDAP first if enabled
        if (ldapEnabled) {
            try {
                // Get userSearchBase from database settings
                String userSearchBase = activeSettings.getUserSearchBase();
                String userSearchFilter = activeSettings.getUserSearchFilter() != null 
                    ? activeSettings.getUserSearchFilter() 
                    : "(uid={0})";
                
                // Use userSearchBase if available, otherwise use base DN
                Name searchBase = (userSearchBase != null && !userSearchBase.isEmpty())
                    ? LdapUtils.newLdapName(userSearchBase)
                    : LdapUtils.emptyLdapName();
                
                // LDAP authentication
                EqualsFilter filter = new EqualsFilter("uid", sanitizedUsername);
                boolean authenticated = ldapTemplate.authenticate(
                    searchBase,
                    filter.encode(),
                    password
                );
                
                if (authenticated) {
                    // Get user details from LDAP
                    String userDn = findUserDn(sanitizedUsername, activeSettings);
                    
                    // Sync user to database
                    User user = syncUserFromLdap(sanitizedUsername, userDn);
                    
                    // Generate JWT token
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    return jwtService.generateToken(userDetails);
                }
            } catch (Exception e) {
                // LDAP failed, try local authentication
                // Continue to local user check below
            }
        }
        
        // Try local user authentication
        Optional<User> userOpt = userRepository.findByUsername(sanitizedUsername);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Check if user has password (local user)
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                // Verify password
                if (passwordEncoder.matches(password, user.getPassword())) {
                    // Generate JWT token
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    return jwtService.generateToken(userDetails);
                } else {
                    throw new RuntimeException("Invalid password");
                }
            } else {
                // User exists but no password set - must use LDAP
                throw new RuntimeException("User not found or authentication failed");
            }
        }
        
        throw new RuntimeException("User not found or authentication failed");
    }
    
    private String findUserDn(String username, LdapSettings settings) {
        EqualsFilter filter = new EqualsFilter("uid", username);
        
        // Use userSearchBase if available, otherwise use base DN
        Name searchBase = (settings.getUserSearchBase() != null && !settings.getUserSearchBase().isEmpty())
            ? LdapUtils.newLdapName(settings.getUserSearchBase())
            : LdapUtils.emptyLdapName();
        
        return ldapTemplate.search(
            searchBase,
            filter.encode(),
            (AttributesMapper<String>) attrs -> {
                return (String) attrs.get("distinguishedName").get();
            }
        ).stream().findFirst().orElse(null);
    }
    
    @Transactional
    public User syncUserFromLdap(String username, String ldapDn) {
        Optional<User> existingUser = userRepository.findByUsername(username);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (ldapDn != null) {
                user.setLdapDn(ldapDn);
            }
            return userRepository.save(user);
        } else {
            // Create new user from LDAP
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(username + "@example.com"); // LDAP'den alınabilir
            newUser.setFullName(username); // LDAP'den alınabilir
            newUser.setLdapDn(ldapDn);
            newUser.setIsActive(true);
            
            // Default role assignment (can be customized)
            roleRepository.findByName("YAZILIMCI").ifPresent(role -> {
                newUser.getRoles().add(role);
            });
            
            return userRepository.save(newUser);
        }
    }
    
    public boolean validateCredentials(String username, String password) {
        try {
            // Check LDAP settings from database
            LdapSettings activeSettings = ldapSettingsService.getActiveLdapSettings();
            if (activeSettings == null || activeSettings.getIsEnabled() == null || !activeSettings.getIsEnabled()) {
                return false;
            }
            
            // Sanitize username input to prevent LDAP injection
            String sanitizedUsername = LdapInputSanitizer.sanitizeUsername(username);
            EqualsFilter filter = new EqualsFilter("uid", sanitizedUsername);
            
            // Use userSearchBase if available, otherwise use base DN
            Name searchBase = (activeSettings.getUserSearchBase() != null && !activeSettings.getUserSearchBase().isEmpty())
                ? LdapUtils.newLdapName(activeSettings.getUserSearchBase())
                : LdapUtils.emptyLdapName();
            
            return ldapTemplate.authenticate(
                searchBase,
                filter.encode(),
                password
            );
        } catch (Exception e) {
            return false;
        }
    }
}

