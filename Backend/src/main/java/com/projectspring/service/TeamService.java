package com.projectspring.service;

import com.projectspring.dto.TeamDTO;
import com.projectspring.model.Team;
import com.projectspring.model.User;
import com.projectspring.model.enums.Role;
import com.projectspring.repository.TeamRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeamService {
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<TeamDTO> getAllTeams() {
        User currentUser = getCurrentUser();
        
        // Yönetici tüm ekipleri görebilir
        if (hasRole(currentUser, Role.DAIRE_BASKANI)) {
            return teamRepository.findByIsActiveTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        }
        
        // Takım Lideri sadece kendi ekibini görebilir
        if (hasRole(currentUser, Role.TAKIM_LIDERI)) {
            return teamRepository.findTeamsByLeaderId(currentUser.getId()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        }
        
        // Personel sadece üyesi olduğu ekipleri görebilir
        return teamRepository.findTeamsByUserId(currentUser.getId()).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public TeamDTO getTeamById(Long id) {
        Team team = teamRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Team not found"));
        
        User currentUser = getCurrentUser();
        
        // Yetki kontrolü
        if (!hasRole(currentUser, Role.DAIRE_BASKANI)) {
            if (hasRole(currentUser, Role.TAKIM_LIDERI)) {
                if (!team.getLeader().getId().equals(currentUser.getId())) {
                    throw new RuntimeException("Access denied");
                }
            } else {
                boolean isMember = team.getMembers().stream()
                    .anyMatch(m -> m.getId().equals(currentUser.getId()));
                if (!isMember) {
                    throw new RuntimeException("Access denied");
                }
            }
        }
        
        return convertToDTO(team);
    }
    
    public List<Long> getAccessibleTeamIds() {
        User currentUser = getCurrentUser();
        
        if (hasRole(currentUser, Role.DAIRE_BASKANI)) {
            return teamRepository.findByIsActiveTrue().stream()
                .map(Team::getId)
                .collect(Collectors.toList());
        }
        
        if (hasRole(currentUser, Role.TAKIM_LIDERI)) {
            return teamRepository.findTeamsByLeaderId(currentUser.getId()).stream()
                .map(Team::getId)
                .collect(Collectors.toList());
        }
        
        return teamRepository.findTeamsByUserId(currentUser.getId()).stream()
            .map(Team::getId)
            .collect(Collectors.toList());
    }
    
    private TeamDTO convertToDTO(Team team) {
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
        return dto;
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    private boolean hasRole(User user, Role role) {
        return user.getRoles().stream()
            .anyMatch(r -> r.getName().equals(role.name()));
    }
}

