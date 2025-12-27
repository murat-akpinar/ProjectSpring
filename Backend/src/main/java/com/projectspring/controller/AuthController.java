package com.projectspring.controller;

import com.projectspring.dto.CreateLocalUserRequest;
import com.projectspring.dto.LoginRequest;
import com.projectspring.dto.LoginResponse;
import com.projectspring.dto.UserDTO;
import com.projectspring.model.User;
import com.projectspring.repository.UserRepository;
import com.projectspring.service.LdapAuthService;
import com.projectspring.service.LoginAttemptService;
import com.projectspring.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private LdapAuthService ldapAuthService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LoginAttemptService loginAttemptService;
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        String username = request.getUsername();
        
        logger.info("Login attempt for user: {} from IP: {}", username, ipAddress);
        
        // Check IP-based rate limiting
        boolean ipBlocked = loginAttemptService.isIpBlocked(ipAddress);
        logger.debug("Rate limiting check for IP {}: blocked={}", ipAddress, ipBlocked);
        if (ipBlocked) {
            logger.warn("IP blocked for login attempt: {} from IP: {}", username, ipAddress);
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Too many login attempts from this IP. Please try again later.");
            error.put("code", "RATE_LIMIT_EXCEEDED");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
        }
        
        // Check account lockout
        boolean accountLocked = loginAttemptService.isAccountLocked(username);
        logger.debug("Account lockout check for user {}: locked={}", username, accountLocked);
        if (accountLocked) {
            logger.warn("Account locked for login attempt: {}", username);
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Account is temporarily locked due to too many failed login attempts. Please try again later.");
            error.put("code", "ACCOUNT_LOCKED");
            return ResponseEntity.status(HttpStatus.LOCKED).body(error);
        }
        
        try {
            String loginType = request.getLoginType();
            logger.info("Attempting authentication for user: {} with loginType: {}", username, loginType != null ? loginType : "auto");
            String token = ldapAuthService.authenticate(username, request.getPassword(), loginType);
            logger.info("Authentication successful for user: {}", username);
            
            // Record successful login
            loginAttemptService.recordLoginAttempt(username, ipAddress, true);
            
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found after successful authentication"));
            
            UserDTO userDTO = new UserDTO();
            userDTO.setId(user.getId());
            userDTO.setUsername(user.getUsername());
            userDTO.setEmail(user.getEmail());
            userDTO.setFullName(user.getFullName());
            userDTO.setRoles(user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toSet()));
            userDTO.setTeamIds(user.getTeams().stream()
                .map(t -> t.getId())
                .collect(Collectors.toSet()));
            
            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setUser(userDTO);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            // Handle specific authentication errors
            String errorMessage = e.getMessage();
            logger.error("Authentication failed for user: {} from IP: {} - Error: {} (Type: {})", 
                username, ipAddress, errorMessage, e.getClass().getSimpleName(), e);
            
            // Record failed login
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            
            int remainingAttempts = loginAttemptService.getRemainingAttempts(username);
            Map<String, Object> error = new HashMap<>();
            
            // Provide more specific error messages based on exception type
            if (errorMessage != null && errorMessage.contains("LDAP")) {
                error.put("error", "LDAP authentication failed. Please check your credentials or contact administrator.");
                error.put("code", "LDAP_AUTHENTICATION_FAILED");
            } else if (errorMessage != null && errorMessage.contains("User not found")) {
                error.put("error", "Invalid username or password");
                error.put("code", "USER_NOT_FOUND");
            } else if (errorMessage != null && errorMessage.contains("Invalid password")) {
                error.put("error", "Invalid username or password");
                error.put("code", "INVALID_PASSWORD");
            } else {
                error.put("error", "Invalid username or password");
                error.put("code", "AUTHENTICATION_FAILED");
            }
            
            if (remainingAttempts < 5) {
                error.put("remainingAttempts", remainingAttempts);
            }
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            // Handle unexpected errors
            logger.error("Unexpected error during login for user: {} from IP: {} - Error: {}", 
                username, ipAddress, e.getMessage(), e);
            
            // Record failed login
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            
            Map<String, Object> error = new HashMap<>();
            error.put("error", "An error occurred during authentication. Please try again later.");
            error.put("code", "INTERNAL_SERVER_ERROR");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setEmail(user.getEmail());
        userDTO.setFullName(user.getFullName());
        userDTO.setRoles(user.getRoles().stream()
            .map(r -> r.getName())
            .collect(Collectors.toSet()));
        userDTO.setTeamIds(user.getTeams().stream()
            .map(t -> t.getId())
            .collect(Collectors.toSet()));
        userDTO.setIsActive(user.getIsActive());
        
        return ResponseEntity.ok(userDTO);
    }
    
    @PostMapping("/register")
    public ResponseEntity<UserDTO> createLocalUser(@Valid @RequestBody CreateLocalUserRequest request) {
        User user = userService.createLocalUser(
            request.getUsername(),
            request.getEmail(),
            request.getFullName(),
            request.getPassword(),
            request.getRole()
        );
        
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setEmail(user.getEmail());
        userDTO.setFullName(user.getFullName());
        userDTO.setRoles(user.getRoles().stream()
            .map(r -> r.getName())
            .collect(Collectors.toSet()));
        userDTO.setTeamIds(user.getTeams().stream()
            .map(t -> t.getId())
            .collect(Collectors.toSet()));
        userDTO.setIsActive(user.getIsActive());
        
        return ResponseEntity.ok(userDTO);
    }
    
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}

