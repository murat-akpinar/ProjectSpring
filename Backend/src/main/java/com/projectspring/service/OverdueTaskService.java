package com.projectspring.service;

import com.projectspring.model.Task;
import com.projectspring.model.TaskStatusHistory;
import com.projectspring.model.User;
import com.projectspring.model.enums.TaskStatus;
import com.projectspring.repository.TaskRepository;
import com.projectspring.repository.TaskStatusHistoryRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class OverdueTaskService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TaskStatusHistoryRepository statusHistoryRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Scheduled(cron = "0 0 1 * * ?") // Her gün saat 01:00'da çalışır
    @Transactional
    public void updateOverdueTasks() {
        LocalDate today = LocalDate.now();
        List<Task> overdueTasks = taskRepository.findOverdueTasks(today);
        
        User systemUser = userRepository.findByUsername("system")
            .orElseGet(() -> {
                User user = new User();
                user.setUsername("system");
                user.setEmail("system@projectspring.local");
                user.setFullName("System");
                user.setIsActive(false);
                return userRepository.save(user);
            });
        
        for (Task task : overdueTasks) {
            if (task.getStatus() != TaskStatus.COMPLETED && 
                task.getStatus() != TaskStatus.CANCELLED &&
                task.getStatus() != TaskStatus.TESTING &&
                task.getStatus() != TaskStatus.OVERDUE) {
                
                TaskStatus oldStatus = task.getStatus();
                task.setStatus(TaskStatus.OVERDUE);
                taskRepository.save(task);
                
                // Status history
                TaskStatusHistory history = new TaskStatusHistory();
                history.setTask(task);
                history.setOldStatus(oldStatus.name());
                history.setNewStatus(TaskStatus.OVERDUE.name());
                history.setChangedBy(systemUser);
                history.setChangeReason("Automatically marked as overdue");
                statusHistoryRepository.save(history);
            }
        }
    }
}

