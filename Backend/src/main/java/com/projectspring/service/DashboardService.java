package com.projectspring.service;

import com.projectspring.dto.DashboardStatsDTO;
import com.projectspring.model.Task;
import com.projectspring.model.enums.TaskStatus;
import com.projectspring.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class DashboardService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TeamService teamService;
    
    public DashboardStatsDTO getTeamDashboardStats(Long teamId) {
        List<Long> accessibleTeamIds = teamService.getAccessibleTeamIds();
        
        if (teamId != null && !accessibleTeamIds.contains(teamId)) {
            throw new RuntimeException("Access denied");
        }
        
        List<Long> teamIds = teamId != null ? List.of(teamId) : accessibleTeamIds;
        
        DashboardStatsDTO stats = new DashboardStatsDTO();
        
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
}

