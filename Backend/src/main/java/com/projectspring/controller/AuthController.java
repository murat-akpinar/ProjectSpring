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
        
        // Check IP-based rate limiting
        if (loginAttemptService.isIpBlocked(ipAddress)) {
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Too many login attempts from this IP. Please try again later.");
            error.put("code", "RATE_LIMIT_EXCEEDED");
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
        }
        
        // Check account lockout
        if (loginAttemptService.isAccountLocked(username)) {
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Account is temporarily locked due to too many failed login attempts. Please try again later.");
            error.put("code", "ACCOUNT_LOCKED");
            return ResponseEntity.status(HttpStatus.LOCKED).body(error);
        }
        
        try {
            String token = ldapAuthService.authenticate(username, request.getPassword());
            
            // Record successful login
            loginAttemptService.recordLoginAttempt(username, ipAddress, true);
            
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
            
            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setUser(userDTO);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Record failed login
            loginAttemptService.recordLoginAttempt(username, ipAddress, false);
            
            int remainingAttempts = loginAttemptService.getRemainingAttempts(username);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid username or password");
            error.put("code", "AUTHENTICATION_FAILED");
            if (remainingAttempts < 5) {
                error.put("remainingAttempts", remainingAttempts);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
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

