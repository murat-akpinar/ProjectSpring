package com.projectspring.service;

import com.projectspring.dto.CreateProjectRequest;
import com.projectspring.dto.ProjectDTO;
import com.projectspring.model.Project;
import com.projectspring.model.Team;
import com.projectspring.model.User;
import com.projectspring.model.enums.ProjectStatus;
import com.projectspring.model.enums.Role;
import com.projectspring.repository.ProjectRepository;
import com.projectspring.repository.TaskRepository;
import com.projectspring.repository.TeamRepository;
import com.projectspring.repository.UserRepository;
import com.projectspring.model.enums.TaskStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TeamService teamService;
    
    @Autowired
    private TaskRepository taskRepository;
    
    public List<ProjectDTO> getAllProjects() {
        try {
            User currentUser = getCurrentUser();
            List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
            
            // Yönetici tüm projeleri görebilir
            if (hasRole(currentUser, Role.ADMIN)) {
                return projectRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            }
            
            // Diğer kullanıcılar sadece kendi ekiplerinin projelerini görebilir
            return projectRepository.findByTeamIds(accessibleTeamIds).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch projects: " + e.getMessage(), e);
        }
    }
    
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User currentUser = getCurrentUser();
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        // Yetki kontrolü
        boolean hasAccess = project.getTeams().stream()
            .anyMatch(team -> accessibleTeamIds.contains(team.getId()));
        
        if (!hasAccess && !hasRole(currentUser, Role.ADMIN)) {
            throw new RuntimeException("Access denied");
        }
        
        return convertToDTO(project);
    }
    
    public ProjectDTO createProject(CreateProjectRequest request) {
        User currentUser = getCurrentUser();
        
        // En az bir ekip zorunlu
        if (request.getTeamIds() == null || request.getTeamIds().isEmpty()) {
            throw new RuntimeException("En az bir ekip seçilmelidir");
        }
        
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus() != null ? request.getStatus() : ProjectStatus.ACTIVE);
        project.setCreatedBy(currentUser);
        
        // Ekipleri ata
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        Set<Team> teams = request.getTeamIds().stream()
            .filter(accessibleTeamIds::contains)
            .map(teamId -> teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId)))
            .collect(Collectors.toSet());
        
        if (teams.isEmpty()) {
            throw new RuntimeException("Erişilebilir ekip bulunamadı");
        }
        
        project.setTeams(teams);
        
        project = projectRepository.save(project);
        return convertToDTO(project);
    }
    
    public ProjectDTO updateProject(Long id, CreateProjectRequest request) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User currentUser = getCurrentUser();
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        // Yetki kontrolü
        boolean hasAccess = project.getTeams().stream()
            .anyMatch(team -> accessibleTeamIds.contains(team.getId()));
        
        if (!hasAccess && !hasRole(currentUser, Role.ADMIN)) {
            throw new RuntimeException("Access denied");
        }
        
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus() != null ? request.getStatus() : project.getStatus());
        
        // Ekipleri güncelle - en az bir ekip zorunlu
        if (request.getTeamIds() == null || request.getTeamIds().isEmpty()) {
            throw new RuntimeException("En az bir ekip seçilmelidir");
        }
        
        Set<Team> teams = request.getTeamIds().stream()
            .filter(accessibleTeamIds::contains)
            .map(teamId -> teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found: " + teamId)))
            .collect(Collectors.toSet());
        
        if (teams.isEmpty()) {
            throw new RuntimeException("Erişilebilir ekip bulunamadı");
        }
        
        project.setTeams(teams);
        
        project = projectRepository.save(project);
        return convertToDTO(project);
    }
    
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Proje oluşturan kişi veya Daire Başkanı silebilir
        User currentUser = getCurrentUser();
        if (!project.getCreatedBy().getId().equals(currentUser.getId()) && 
            !hasRole(currentUser, Role.ADMIN)) {
            throw new RuntimeException("Access denied: Only project creator or managers can delete projects");
        }
        
        projectRepository.delete(project);
    }
    
    private ProjectDTO convertToDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setCreatedById(project.getCreatedBy().getId());
        dto.setCreatedByName(project.getCreatedBy().getFullName());
        dto.setTeamIds(project.getTeams() != null ? project.getTeams().stream()
            .map(Team::getId)
            .collect(Collectors.toList()) : new java.util.ArrayList<>());
        dto.setTeamNames(project.getTeams() != null ? project.getTeams().stream()
            .map(Team::getName)
            .collect(Collectors.toList()) : new java.util.ArrayList<>());
        
        // Calculate task counts - handle potential errors gracefully
        try {
            Long taskCount = taskRepository.countByProjectId(project.getId());
            Long completedTaskCount = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.COMPLETED);
            Long cancelledTaskCount = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.CANCELLED);
            // Active tasks = total - completed - cancelled
            Long activeTaskCount = Math.max(0L, taskCount - completedTaskCount - cancelledTaskCount);
            
            dto.setTaskCount(taskCount != null ? taskCount : 0L);
            dto.setCompletedTaskCount(completedTaskCount != null ? completedTaskCount : 0L);
            dto.setActiveTaskCount(activeTaskCount != null ? activeTaskCount : 0L);
        } catch (Exception e) {
            // If task count calculation fails, set defaults
            dto.setTaskCount(0L);
            dto.setCompletedTaskCount(0L);
            dto.setActiveTaskCount(0L);
        }
        
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

