package com.projectspring.service;

import com.projectspring.dto.CreateRoleRequest;
import com.projectspring.model.RoleEntity;
import com.projectspring.repository.RoleRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    public List<RoleEntity> getAllRoles() {
        return roleRepository.findAll();
    }

    public RoleEntity getRoleById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
    }

    public RoleEntity createRole(CreateRoleRequest request) {
        // Check if role name already exists
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Role name already exists: " + request.getName());
        }

        RoleEntity role = new RoleEntity();
        role.setName(request.getName());
        role.setDescription(request.getDescription());
        return roleRepository.save(role);
    }

    public RoleEntity updateRole(Long id, CreateRoleRequest request) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Check if name is being changed and if it's already taken
        if (request.getName() != null && !request.getName().equals(role.getName())) {
            if (roleRepository.findByName(request.getName()).isPresent()) {
                throw new RuntimeException("Role name already exists: " + request.getName());
            }
            role.setName(request.getName());
        }

        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        return roleRepository.save(role);
    }

    public void deleteRole(Long id) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Check if role is in use
        long userCount = userRepository.findAll().stream()
                .filter(user -> user.getRoles().contains(role))
                .count();

        if (userCount > 0) {
            throw new RuntimeException("Cannot delete role that is assigned to " + userCount + " user(s)");
        }

        roleRepository.delete(role);
    }
}

