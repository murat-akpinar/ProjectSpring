package com.projectspring.controller;

import com.projectspring.dto.CreateLocalUserRequest;
import com.projectspring.dto.LoginRequest;
import com.projectspring.dto.LoginResponse;
import com.projectspring.dto.UserDTO;
import com.projectspring.model.User;
import com.projectspring.repository.UserRepository;
import com.projectspring.service.LdapAuthService;
import com.projectspring.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = ldapAuthService.authenticate(request.getUsername(), request.getPassword());
        
        User user = userRepository.findByUsername(request.getUsername())
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

