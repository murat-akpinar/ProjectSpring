package com.projectspring.service;

import com.projectspring.dto.CreateTeamRequest;
import com.projectspring.dto.CreateUserRequest;
import com.projectspring.dto.TeamDTO;
import com.projectspring.dto.UpdateTeamRequest;
import com.projectspring.dto.UpdateUserRequest;
import com.projectspring.dto.UserDTO;
import com.projectspring.model.RoleEntity;
import com.projectspring.model.Team;
import com.projectspring.model.User;
import com.projectspring.repository.RoleRepository;
import com.projectspring.repository.TeamRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToDTO(user);
    }

    public UserDTO createUser(CreateUserRequest request) {
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user.setLdapDn(null); // Local user

        // Assign roles
        Set<RoleEntity> roles = new HashSet<>();
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            roles = request.getRoleIds().stream()
                    .map(roleId -> roleRepository.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleId)))
                    .collect(Collectors.toSet());
        }

        // Add admin role if requested
        if (Boolean.TRUE.equals(request.getIsAdmin())) {
            roleRepository.findByName("DAIRE_BASKANI")
                    .ifPresent(roles::add);
        }

        user.setRoles(roles);

        // Assign teams
        if (request.getTeamIds() != null && !request.getTeamIds().isEmpty()) {
            Set<Team> teams = request.getTeamIds().stream()
                    .map(teamId -> teamRepository.findById(teamId)
                            .orElseThrow(() -> new RuntimeException("Team not found: " + teamId)))
                    .collect(Collectors.toSet());
            user.setTeams(teams);
        }

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if email is being changed and if it's already taken
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getIsActive() != null) {
            // Prevent deactivating the last admin
            if (!request.getIsActive() && hasAdminRole(user)) {
                long adminCount = userRepository.findAll().stream()
                        .filter(this::hasAdminRole)
                        .filter(u -> u.getIsActive())
                        .count();
                if (adminCount <= 1) {
                    throw new RuntimeException("Cannot deactivate the last admin user");
                }
            }
            user.setIsActive(request.getIsActive());
        }

        // Update roles
        if (request.getRoleIds() != null) {
            Set<RoleEntity> roles = new HashSet<>();
            if (!request.getRoleIds().isEmpty()) {
                roles = request.getRoleIds().stream()
                        .map(roleId -> roleRepository.findById(roleId)
                                .orElseThrow(() -> new RuntimeException("Role not found: " + roleId)))
                        .collect(Collectors.toSet());
            }

            // Add admin role if requested
            if (Boolean.TRUE.equals(request.getIsAdmin())) {
                roleRepository.findByName("DAIRE_BASKANI")
                        .ifPresent(roles::add);
            }

            user.setRoles(roles);
        }

        // Update teams
        if (request.getTeamIds() != null) {
            Set<Team> teams = new HashSet<>();
            if (!request.getTeamIds().isEmpty()) {
                teams = request.getTeamIds().stream()
                        .map(teamId -> teamRepository.findById(teamId)
                                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId)))
                        .collect(Collectors.toSet());
            }
            user.setTeams(teams);
        }

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent deleting the last admin
        if (hasAdminRole(user)) {
            long adminCount = userRepository.findAll().stream()
                    .filter(this::hasAdminRole)
                    .filter(u -> u.getIsActive())
                    .count();
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot delete the last admin user");
            }
        }

        // Soft delete by deactivating
        user.setIsActive(false);
        userRepository.save(user);
    }

    public void changeUserPassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRoles(user.getRoles().stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toSet()));
        dto.setTeamIds(user.getTeams().stream()
                .map(Team::getId)
                .collect(Collectors.toSet()));
        dto.setIsActive(user.getIsActive());
        return dto;
    }

    private boolean hasAdminRole(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equals("DAIRE_BASKANI"));
    }

    // Team Management Methods
    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::convertTeamToDTO)
                .collect(Collectors.toList());
    }

    public TeamDTO getTeamById(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        return convertTeamToDTO(team);
    }

    public TeamDTO createTeam(CreateTeamRequest request) {
        // Check if team name already exists
        if (teamRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Team name already exists");
        }

        Team team = new Team();
        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setColor(request.getColor());
        team.setIcon(request.getIcon());
        team.setIsActive(true);

        // Set leader if provided
        if (request.getLeaderId() != null) {
            User leader = userRepository.findById(request.getLeaderId())
                    .orElseThrow(() -> new RuntimeException("Leader not found"));
            team.setLeader(leader);
        }

        Team savedTeam = teamRepository.save(team);
        return convertTeamToDTO(savedTeam);
    }

    public TeamDTO updateTeam(Long id, UpdateTeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Check if name is being changed and if it's already taken
        if (request.getName() != null && !request.getName().equals(team.getName())) {
            if (teamRepository.findByName(request.getName()).isPresent()) {
                throw new RuntimeException("Team name already exists");
            }
            team.setName(request.getName());
        }

        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }

        if (request.getColor() != null) {
            team.setColor(request.getColor());
        }

        if (request.getIcon() != null) {
            team.setIcon(request.getIcon());
        }

        if (request.getIsActive() != null) {
            team.setIsActive(request.getIsActive());
        }

        // Update leader if provided
        if (request.getLeaderId() != null) {
            User leader = userRepository.findById(request.getLeaderId())
                    .orElseThrow(() -> new RuntimeException("Leader not found"));
            team.setLeader(leader);
        }

        Team savedTeam = teamRepository.save(team);
        return convertTeamToDTO(savedTeam);
    }

    public void deleteTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        // Soft delete by deactivating
        team.setIsActive(false);
        teamRepository.save(team);
    }

    private TeamDTO convertTeamToDTO(Team team) {
        TeamDTO dto = new TeamDTO();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setDescription(team.getDescription());
        if (team.getLeader() != null) {
            dto.setLeaderId(team.getLeader().getId());
            dto.setLeaderName(team.getLeader().getFullName());
        }
        dto.setColor(team.getColor());
        dto.setIcon(team.getIcon());
        dto.setIsActive(team.getIsActive());
        return dto;
    }
}

