package com.projectspring.service;

import com.projectspring.model.RoleEntity;
import com.projectspring.model.User;
import com.projectspring.repository.RoleRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User createLocalUser(String username, String email, String fullName, String password, String roleName) {
        // Check if user already exists
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(password));
        user.setIsActive(true);
        user.setLdapDn(null); // Local user, no LDAP DN
        
        // Assign role
        if (roleName != null) {
            roleRepository.findByName(roleName).ifPresent(role -> {
                user.getRoles().add(role);
            });
        }
        
        return userRepository.save(user);
    }
    
    public User updateUserPassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }
    
    public boolean isLocalUser(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        return userOpt.isPresent() && 
               userOpt.get().getPassword() != null && 
               !userOpt.get().getPassword().isEmpty();
    }
    
    public List<com.projectspring.dto.UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> {
                com.projectspring.dto.UserDTO dto = new com.projectspring.dto.UserDTO();
                dto.setId(user.getId());
                dto.setUsername(user.getUsername());
                dto.setEmail(user.getEmail());
                dto.setFullName(user.getFullName());
                dto.setRoles(user.getRoles().stream()
                    .map(RoleEntity::getName)
                    .collect(Collectors.toSet()));
                dto.setTeamIds(user.getTeams().stream()
                    .map(com.projectspring.model.Team::getId)
                    .collect(Collectors.toSet()));
                dto.setIsActive(user.getIsActive());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has a password (local user)
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new RuntimeException("User does not have a password set. This is an LDAP user.");
        }

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        // Set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void updateProfile(Long userId, String fullName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (fullName != null && !fullName.trim().isEmpty()) {
            user.setFullName(fullName.trim());
            userRepository.save(user);
        }
    }
}

