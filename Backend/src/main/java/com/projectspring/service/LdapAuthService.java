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
import org.springframework.ldap.core.ContextMapper;
import org.springframework.ldap.core.DirContextAdapter;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.Name;
import javax.naming.directory.Attributes;
import java.util.List;
import java.util.Optional;

@Service
public class LdapAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(LdapAuthService.class);
    
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
        return authenticate(username, password, null);
    }
    
    public String authenticate(String username, String password, String loginType) {
        // Sanitize username input to prevent LDAP injection
        String sanitizedUsername = LdapInputSanitizer.sanitizeUsername(username);
        
        // Check LDAP settings from database
        LdapSettings activeSettings = ldapSettingsService.getActiveLdapSettings();
        boolean ldapEnabled = activeSettings != null && activeSettings.getIsEnabled() != null && activeSettings.getIsEnabled();
        
        // If loginType is "standard", skip LDAP and go directly to local authentication
        if ("standard".equalsIgnoreCase(loginType)) {
            logger.info("Login type is 'standard', skipping LDAP authentication");
            return authenticateLocal(sanitizedUsername, password);
        }
        
        // If loginType is "ldap", only try LDAP authentication
        if ("ldap".equalsIgnoreCase(loginType)) {
            if (!ldapEnabled) {
                throw new RuntimeException("LDAP authentication is disabled");
            }
            logger.info("Login type is 'ldap', attempting LDAP authentication only");
            return authenticateLdap(sanitizedUsername, password, activeSettings);
        }
        
        // Try LDAP first if enabled (auto mode - loginType is null or empty)
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
                logger.info("LDAP Auth - Attempting authentication for user: {}, SearchBase: {}", sanitizedUsername, userSearchBase);
                boolean authenticated = ldapTemplate.authenticate(
                    searchBase,
                    filter.encode(),
                    password
                );
                
                logger.info("LDAP Auth - Authentication result: {}", authenticated);
                
                if (authenticated) {
                    // Get user details from LDAP
                    String userDn = findUserDn(sanitizedUsername, activeSettings);
                    logger.info("LDAP Auth - Found user DN: {}", userDn);
                    
                    // Sync user to database
                    User user = syncUserFromLdap(sanitizedUsername, userDn);
                    logger.info("LDAP Auth - User synced to database: {}", user.getUsername());
                    
                    // Generate JWT token
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    return jwtService.generateToken(userDetails);
                } else {
                    logger.warn("LDAP Auth - Authentication failed for user: {}", sanitizedUsername);
                }
            } catch (Exception e) {
                // LDAP failed, log error and try local authentication
                logger.error("LDAP Auth - LDAP authentication error for user {}: {}", sanitizedUsername, e.getMessage(), e);
                // Continue to local user check below
            }
        }
        
        // Try local user authentication (fallback for auto mode, or if LDAP failed)
        return authenticateLocal(sanitizedUsername, password);
    }
    
    private String authenticateLdap(String sanitizedUsername, String password, LdapSettings activeSettings) {
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
            logger.info("LDAP Auth - Attempting authentication for user: {}, SearchBase: {}", sanitizedUsername, userSearchBase);
            boolean authenticated = ldapTemplate.authenticate(
                searchBase,
                filter.encode(),
                password
            );
            
            logger.info("LDAP Auth - Authentication result: {}", authenticated);
            
            if (!authenticated) {
                throw new RuntimeException("LDAP authentication failed");
            }
            
            // Get user details from LDAP
            String userDn = findUserDn(sanitizedUsername, activeSettings);
            logger.info("LDAP Auth - Found user DN: {}", userDn);
            
            // Sync user to database
            User user = syncUserFromLdap(sanitizedUsername, userDn);
            logger.info("LDAP Auth - User synced to database: {}", user.getUsername());
            
            // Generate JWT token
            UserDetails userDetails = userDetailsService.loadUserByUsername(sanitizedUsername);
            return jwtService.generateToken(userDetails);
        } catch (Exception e) {
            logger.error("LDAP Auth - LDAP authentication error for user {}: {}", sanitizedUsername, e.getMessage(), e);
            throw new RuntimeException("LDAP authentication failed: " + e.getMessage());
        }
    }
    
    private String authenticateLocal(String sanitizedUsername, String password) {
        Optional<User> userOpt = userRepository.findByUsername(sanitizedUsername);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Check if user has password (local user)
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                // Verify password
                if (passwordEncoder.matches(password, user.getPassword())) {
                    // Generate JWT token
                    UserDetails userDetails = userDetailsService.loadUserByUsername(sanitizedUsername);
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
        
        // Use ContextMapper to get DN directly from search result (OpenLDAP doesn't have distinguishedName attribute)
        List<String> dns = ldapTemplate.search(
            searchBase,
            filter.encode(),
            (ContextMapper<String>) ctx -> {
                DirContextAdapter adapter = (DirContextAdapter) ctx;
                return adapter.getDn().toString();
            }
        );
        
        return dns.stream().findFirst().orElse(null);
    }
    
    @Transactional
    public User syncUserFromLdap(String username, String ldapDn) {
        Optional<User> existingUser = userRepository.findByUsername(username);
        
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Update LDAP DN if provided
            if (ldapDn != null) {
                user.setLdapDn(ldapDn);
            }
            // Reactivate if soft-deleted
            if (user.getIsActive() != null && !user.getIsActive()) {
                logger.info("LDAP Auth - Reactivating soft-deleted user during login: {}", username);
                user.setIsActive(true);
            }
            // Ensure password is null for LDAP users
            user.setPassword(null);
            return userRepository.save(user);
        } else {
            // Create new user from LDAP
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(username + "@example.com"); // LDAP'den alınabilir
            newUser.setFullName(username); // LDAP'den alınabilir
            newUser.setLdapDn(ldapDn);
            newUser.setIsActive(true);
            newUser.setPassword(null); // LDAP users don't have passwords
            
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

