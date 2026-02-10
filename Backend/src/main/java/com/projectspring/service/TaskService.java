package com.projectspring.service;

import com.projectspring.dto.*;
import com.projectspring.model.*;
import com.projectspring.model.enums.TaskStatus;
import com.projectspring.repository.ProjectRepository;
import com.projectspring.model.enums.TaskType;
import com.projectspring.model.enums.Priority;
import com.projectspring.model.enums.Role;
import com.projectspring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SubtaskRepository subtaskRepository;
    
    @Autowired
    private TaskStatusHistoryRepository statusHistoryRepository;
    
    @Autowired
    private TeamService teamService;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private TaskLogService taskLogService;
    
    public List<TaskDTO> getTasks(Long teamId, Integer year, Integer month, Long projectId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        if (teamId != null && !accessibleTeamIds.contains(teamId)) {
            throw new RuntimeException("Access denied to this team");
        }
        
        List<Task> tasks;
        
        // Eğer projectId verilmişse, direkt projeye ait task'ları getir
        if (projectId != null) {
            // Proje erişim kontrolü
            Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
            
            User currentUser = getCurrentUser();
            
            // Yetki kontrolü - getProjectById ile aynı mantık
            boolean hasAccess = false;
            if (project.getTeams() != null && !project.getTeams().isEmpty()) {
                hasAccess = project.getTeams().stream()
                    .anyMatch(team -> accessibleTeamIds.contains(team.getId()));
            }
            
            if (!hasAccess && !hasRole(currentUser, Role.ADMIN)) {
                throw new RuntimeException("Access denied to this project");
            }
            
            // Projeye ait task'ları getir
            if (year != null && month != null) {
                tasks = taskRepository.findByProjectIdAndYearAndMonth(projectId, year, month);
            } else if (year != null) {
                tasks = taskRepository.findByProjectIdAndYear(projectId, year);
            } else {
                tasks = taskRepository.findByProjectId(projectId);
            }
        } else if (teamId != null) {
            // Ekip bazlı filtreleme
            if (year != null && month != null) {
                tasks = taskRepository.findByTeamIdAndYearAndMonth(teamId, year, month);
            } else if (year != null) {
                tasks = taskRepository.findByTeamIdAndYear(teamId, year);
            } else {
                tasks = taskRepository.findByTeamId(teamId);
            }
        } else {
            // Tüm erişilebilir ekiplerin task'ları
            if (year != null && month != null) {
                tasks = taskRepository.findByTeamIdsAndYearAndMonth(accessibleTeamIds, year, month);
            } else if (year != null) {
                tasks = taskRepository.findByTeamIdsAndYear(accessibleTeamIds, year);
            } else {
                tasks = accessibleTeamIds.stream()
                    .flatMap(id -> taskRepository.findByTeamId(id).stream())
                    .collect(Collectors.toList());
            }
        }
        
        return tasks.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        if (!accessibleTeamIds.contains(task.getTeam().getId())) {
            throw new RuntimeException("Access denied");
        }
        
        return convertToDTO(task);
    }
    
    public TaskDTO createTask(CreateTaskRequest request) {
        User currentUser = getCurrentUser();
        Team team = teamRepository.findById(request.getTeamId())
            .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Yetki kontrolü
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        if (!accessibleTeamIds.contains(team.getId())) {
            throw new RuntimeException("Access denied to this team");
        }
        
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setContent(request.getContent());
        task.setStartDate(request.getStartDate());
        task.setEndDate(request.getEndDate());
        task.setStatus(request.getStatus());
        task.setTaskType(request.getTaskType() != null ? request.getTaskType() : TaskType.TASK);
        task.setPriority(request.getPriority() != null ? request.getPriority() : Priority.NORMAL);
        task.setTeam(team);
        task.setCreatedBy(currentUser);
        
        // Project assignment
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
            // Projenin ekibine erişim kontrolü
            boolean hasAccess = project.getTeams().stream()
                .anyMatch(t -> accessibleTeamIds.contains(t.getId()));
            if (!hasAccess) {
                throw new RuntimeException("Access denied to this project");
            }
            task.setProject(project);
        }
        
        // Assignees
        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            Set<User> assignees = request.getAssigneeIds().stream()
                .map(userId -> userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId)))
                .collect(Collectors.toSet());
            task.setAssignees(assignees);
        }
        
        task = taskRepository.save(task);
        
        // Subtasks
        if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
            for (CreateSubtaskRequest subtaskRequest : request.getSubtasks()) {
                // Skip empty subtasks
                if (subtaskRequest.getTitle() == null || subtaskRequest.getTitle().trim().isEmpty()) {
                    continue;
                }
                Subtask subtask = new Subtask();
                subtask.setTask(task);
                subtask.setTitle(subtaskRequest.getTitle());
                subtask.setContent(subtaskRequest.getContent());
                subtask.setStartDate(subtaskRequest.getStartDate());
                subtask.setEndDate(subtaskRequest.getEndDate());
                if (subtaskRequest.getAssigneeId() != null) {
                    User assignee = userRepository.findById(subtaskRequest.getAssigneeId())
                        .orElseThrow(() -> new RuntimeException("User not found: " + subtaskRequest.getAssigneeId()));
                    subtask.setAssignee(assignee);
                }
                task.getSubtasks().add(subtask);
            }
        }
        
        // Log task creation
        taskLogService.logTaskAction(task, "CREATED", currentUser, "Task created", null, convertToDTO(task));
        
        return convertToDTO(task);
    }
    
    public TaskDTO updateTask(Long id, CreateTaskRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        if (!accessibleTeamIds.contains(task.getTeam().getId())) {
            throw new RuntimeException("Access denied");
        }
        
        User currentUser = getCurrentUser();
        
        // Store old values for logging
        TaskDTO oldTaskDTO = convertToDTO(task);
        
        task.setTitle(request.getTitle());
        task.setContent(request.getContent());
        task.setStartDate(request.getStartDate());
        task.setEndDate(request.getEndDate());
        task.setStatus(request.getStatus());
        task.setTaskType(request.getTaskType() != null ? request.getTaskType() : TaskType.TASK);
        task.setPriority(request.getPriority() != null ? request.getPriority() : Priority.NORMAL);
        
        // Team güncelleme
        if (request.getTeamId() != null) {
            Team newTeam = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
            if (!accessibleTeamIds.contains(newTeam.getId())) {
                throw new RuntimeException("Access denied to this team");
            }
            task.setTeam(newTeam);
        }
        
        // Project assignment
        if (request.getProjectId() != null) {
            Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
            // Projenin ekibine erişim kontrolü
            boolean hasAccess = project.getTeams().stream()
                .anyMatch(t -> accessibleTeamIds.contains(t.getId()));
            if (!hasAccess) {
                throw new RuntimeException("Access denied to this project");
            }
            task.setProject(project);
        } else {
            task.setProject(null);
        }
        
        if (request.getAssigneeIds() != null) {
            Set<User> assignees = request.getAssigneeIds().stream()
                .map(userId -> userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId)))
                .collect(Collectors.toSet());
            task.setAssignees(assignees);
        }
        
        // Remove existing subtasks
        task.getSubtasks().clear();
        
        // Add new subtasks
        if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
            for (CreateSubtaskRequest subtaskRequest : request.getSubtasks()) {
                // Skip empty subtasks
                if (subtaskRequest.getTitle() == null || subtaskRequest.getTitle().trim().isEmpty()) {
                    continue;
                }
                Subtask subtask = new Subtask();
                subtask.setTask(task);
                subtask.setTitle(subtaskRequest.getTitle());
                subtask.setContent(subtaskRequest.getContent());
                subtask.setStartDate(subtaskRequest.getStartDate());
                subtask.setEndDate(subtaskRequest.getEndDate());
                if (subtaskRequest.getAssigneeId() != null) {
                    User assignee = userRepository.findById(subtaskRequest.getAssigneeId())
                        .orElseThrow(() -> new RuntimeException("User not found: " + subtaskRequest.getAssigneeId()));
                    subtask.setAssignee(assignee);
                }
                task.getSubtasks().add(subtask);
            }
        }
        
        task = taskRepository.save(task);
        
        // Log task update
        TaskDTO newTaskDTO = convertToDTO(task);
        taskLogService.logTaskAction(task, "UPDATED", currentUser, "Task updated", oldTaskDTO, newTaskDTO);
        
        return newTaskDTO;
    }
    
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        if (!accessibleTeamIds.contains(task.getTeam().getId())) {
            throw new RuntimeException("Access denied");
        }
        
        User currentUser = getCurrentUser();
        
        // Log task deletion before deleting
        TaskDTO taskDTO = convertToDTO(task);
        taskLogService.logTaskAction(task, "DELETED", currentUser, "Task deleted", taskDTO, null);
        
        taskRepository.delete(task);
    }
    
    public TaskDTO updateTaskStatus(Long id, UpdateTaskStatusRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        if (!accessibleTeamIds.contains(task.getTeam().getId())) {
            throw new RuntimeException("Access denied");
        }
        
        User currentUser = getCurrentUser();
        TaskStatus oldStatus = task.getStatus();
        
        // Status history kaydı
        TaskStatusHistory history = new TaskStatusHistory();
        history.setTask(task);
        history.setOldStatus(oldStatus.name());
        history.setNewStatus(request.getStatus().name());
        history.setChangedBy(currentUser);
        history.setChangeReason(request.getChangeReason());
        
        // Ertelendi durumu
        if (request.getStatus() == TaskStatus.POSTPONED) {
            task.setIsPostponed(true);
            task.setPostponedFromDate(task.getEndDate());
            if (request.getPostponedToDate() != null) {
                task.setPostponedToDate(request.getPostponedToDate());
                history.setPostponedToDate(request.getPostponedToDate());
            }
        } else {
            task.setIsPostponed(false);
        }
        
        task.setStatus(request.getStatus());
        task = taskRepository.save(task);
        statusHistoryRepository.save(history);
        
        // Log status change in task logs
        taskLogService.logTaskAction(
            task, 
            "STATUS_CHANGED", 
            currentUser, 
            request.getChangeReason(), 
            oldStatus.name(), 
            request.getStatus().name()
        );
        
        return convertToDTO(task);
    }
    
    public List<TaskDTO> getTasksByDateRange(LocalDate startDate, LocalDate endDate, Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        if (teamId != null && !accessibleTeamIds.contains(teamId)) {
            throw new RuntimeException("Access denied");
        }
        
        List<Long> teamIds = teamId != null ? List.of(teamId) : accessibleTeamIds;
        
        return taskRepository.findByTeamIdsAndDateRange(teamIds, startDate, endDate).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setContent(task.getContent());
        dto.setStartDate(task.getStartDate());
        dto.setEndDate(task.getEndDate());
        dto.setStatus(task.getStatus());
        dto.setTaskType(task.getTaskType());
        dto.setPriority(task.getPriority());
        dto.setTeamId(task.getTeam().getId());
        dto.setTeamName(task.getTeam().getName());
        dto.setTeamColor(task.getTeam().getColor());
        dto.setTeamIcon(task.getTeam().getIcon());
        if (task.getProject() != null) {
            dto.setProjectId(task.getProject().getId());
            dto.setProjectName(task.getProject().getName());
        }
        dto.setCreatedById(task.getCreatedBy().getId());
        dto.setCreatedByName(task.getCreatedBy().getFullName());
        dto.setAssigneeIds(task.getAssignees().stream()
            .map(User::getId)
            .collect(Collectors.toSet()));
        dto.setAssigneeNames(task.getAssignees().stream()
            .map(User::getFullName)
            .collect(Collectors.toList()));
        dto.setSubtasks(task.getSubtasks().stream()
            .map(this::convertSubtaskToDTO)
            .collect(Collectors.toList()));
        dto.setPostponedToDate(task.getPostponedToDate());
        dto.setPostponedFromDate(task.getPostponedFromDate());
        dto.setIsPostponed(task.getIsPostponed());
        return dto;
    }
    
    private SubtaskDTO convertSubtaskToDTO(Subtask subtask) {
        SubtaskDTO dto = new SubtaskDTO();
        dto.setId(subtask.getId());
        dto.setTitle(subtask.getTitle());
        dto.setContent(subtask.getContent());
        dto.setStartDate(subtask.getStartDate());
        dto.setEndDate(subtask.getEndDate());
        if (subtask.getAssignee() != null) {
            dto.setAssigneeId(subtask.getAssignee().getId());
            dto.setAssigneeName(subtask.getAssignee().getFullName());
        }
        dto.setIsCompleted(subtask.getIsCompleted());
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

