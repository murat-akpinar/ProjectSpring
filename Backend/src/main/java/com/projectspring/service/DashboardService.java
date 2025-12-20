package com.projectspring.service;

import com.projectspring.dto.*;
import com.projectspring.model.Task;
import com.projectspring.model.Team;
import com.projectspring.model.User;
import com.projectspring.model.enums.TaskStatus;
import com.projectspring.repository.TaskRepository;
import com.projectspring.repository.TeamRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class DashboardService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TeamService teamService;
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public DashboardStatsDTO getTeamDashboardStats(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        if (teamId != null && !accessibleTeamIds.contains(teamId)) {
            throw new RuntimeException("Access denied");
        }
        
        List<Long> teamIds = teamId != null ? List.of(teamId) : accessibleTeamIds;
        
        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalOpen(0L);
        stats.setTotalInProgress(0L);
        stats.setTotalCompleted(0L);
        stats.setTotalOverdue(0L);
        stats.setTotalPostponed(0L);
        stats.setTotalCancelled(0L);
        
        for (Long tid : teamIds) {
            List<Task> tasks = taskRepository.findByTeamId(tid);
            
            stats.setTotalOpen(stats.getTotalOpen() + 
                tasks.stream().filter(t -> t.getStatus() == TaskStatus.OPEN).count());
            stats.setTotalInProgress(stats.getTotalInProgress() + 
                tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
            stats.setTotalCompleted(stats.getTotalCompleted() + 
                tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count());
            stats.setTotalOverdue(stats.getTotalOverdue() + 
                tasks.stream().filter(t -> t.getStatus() == TaskStatus.OVERDUE).count());
            stats.setTotalPostponed(stats.getTotalPostponed() + 
                tasks.stream().filter(t -> t.getStatus() == TaskStatus.POSTPONED).count());
            stats.setTotalCancelled(stats.getTotalCancelled() + 
                tasks.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count());
        }
        
        return stats;
    }
    
    public DashboardDetailsDTO getTeamDashboardDetails(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        if (teamId != null && !accessibleTeamIds.contains(teamId)) {
            throw new RuntimeException("Access denied");
        }
        
        DashboardStatsDTO stats = getTeamDashboardStats(teamId);
        
        List<UserLeaderboardDTO> topCompleters = getTopCompleters(teamId);
        List<UserLeaderboardDTO> topPostponers = getTopPostponers(teamId);
        List<UserLeaderboardDTO> topCancellers = getTopCancellers(teamId);
        List<TeamMemberDTO> teamMembers = getTeamMembers(teamId);
        
        return new DashboardDetailsDTO(stats, topCompleters, topPostponers, topCancellers, teamMembers);
    }
    
    private List<UserLeaderboardDTO> getTopCompleters(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        List<Long> teamIds = teamId != null ? List.of(teamId) : accessibleTeamIds;
        
        Map<Long, Long> userCounts = new HashMap<>();
        
        for (Long tid : teamIds) {
            List<Task> tasks = taskRepository.findByTeamId(tid);
            tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .flatMap(t -> t.getAssignees().stream())
                .forEach(user -> userCounts.merge(user.getId(), 1L, Long::sum));
        }
        
        return userCounts.entrySet().stream()
            .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
            .limit(5)
            .map(entry -> {
                User user = userRepository.findById(entry.getKey()).orElse(null);
                if (user != null) {
                    return new UserLeaderboardDTO(user.getId(), user.getFullName(), entry.getValue());
                }
                return null;
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
    
    private List<UserLeaderboardDTO> getTopPostponers(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        List<Long> teamIds = teamId != null ? List.of(teamId) : accessibleTeamIds;
        
        Map<Long, Long> userCounts = new HashMap<>();
        
        for (Long tid : teamIds) {
            List<Task> tasks = taskRepository.findByTeamId(tid);
            tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.POSTPONED)
                .flatMap(t -> t.getAssignees().stream())
                .forEach(user -> userCounts.merge(user.getId(), 1L, Long::sum));
        }
        
        return userCounts.entrySet().stream()
            .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
            .limit(5)
            .map(entry -> {
                User user = userRepository.findById(entry.getKey()).orElse(null);
                if (user != null) {
                    return new UserLeaderboardDTO(user.getId(), user.getFullName(), entry.getValue());
                }
                return null;
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
    
    private List<UserLeaderboardDTO> getTopCancellers(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        List<Long> teamIds = teamId != null ? List.of(teamId) : accessibleTeamIds;
        
        Map<Long, Long> userCounts = new HashMap<>();
        
        for (Long tid : teamIds) {
            List<Task> tasks = taskRepository.findByTeamId(tid);
            tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.CANCELLED)
                .flatMap(t -> t.getAssignees().stream())
                .forEach(user -> userCounts.merge(user.getId(), 1L, Long::sum));
        }
        
        return userCounts.entrySet().stream()
            .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
            .limit(5)
            .map(entry -> {
                User user = userRepository.findById(entry.getKey()).orElse(null);
                if (user != null) {
                    return new UserLeaderboardDTO(user.getId(), user.getFullName(), entry.getValue());
                }
                return null;
            })
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
    
    private List<TeamMemberDTO> getTeamMembers(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        if (teamId != null && !accessibleTeamIds.contains(teamId)) {
            throw new RuntimeException("Access denied");
        }
        
        List<TeamMemberDTO> members = new ArrayList<>();
        
        if (teamId != null) {
            Team team = teamRepository.findById(teamId).orElse(null);
            if (team != null) {
                for (User user : team.getMembers()) {
                    List<String> roleNames = user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList());
                    boolean isLeader = team.getLeader() != null && team.getLeader().getId().equals(user.getId());
                    members.add(new TeamMemberDTO(user.getId(), user.getFullName(), roleNames, isLeader));
                }
            }
        } else {
            // All accessible teams
            for (Long tid : accessibleTeamIds) {
                Team team = teamRepository.findById(tid).orElse(null);
                if (team != null) {
                    for (User user : team.getMembers()) {
                        // Check if user already added
                        boolean exists = members.stream()
                            .anyMatch(m -> m.getUserId().equals(user.getId()));
                        if (!exists) {
                            List<String> roleNames = user.getRoles().stream()
                                .map(role -> role.getName())
                                .collect(Collectors.toList());
                            boolean isLeader = team.getLeader() != null && team.getLeader().getId().equals(user.getId());
                            members.add(new TeamMemberDTO(user.getId(), user.getFullName(), roleNames, isLeader));
                        }
                    }
                }
            }
        }
        
        // Sort: leaders first, then by name
        members.sort((a, b) -> {
            if (a.getIsLeader() && !b.getIsLeader()) return -1;
            if (!a.getIsLeader() && b.getIsLeader()) return 1;
            return a.getUserName().compareToIgnoreCase(b.getUserName());
        });
        
        return members;
    }
}

