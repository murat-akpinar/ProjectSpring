package com.projectspring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectspring.dto.TaskLogDTO;
import com.projectspring.model.Task;
import com.projectspring.model.TaskLog;
import com.projectspring.model.User;
import com.projectspring.repository.TaskLogRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskLogService {
    
    @Autowired
    private TaskLogRepository taskLogRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void logTaskAction(Task task, String action, User changedBy, String changeReason, Object oldValue, Object newValue) {
        TaskLog log = new TaskLog();
        log.setTask(task);
        log.setTaskTitle(task.getTitle());
        log.setAction(action);
        log.setChangedBy(changedBy);
        log.setChangeReason(changeReason);
        
        try {
            if (oldValue != null) {
                log.setOldValue(objectMapper.writeValueAsString(oldValue));
            }
            if (newValue != null) {
                log.setNewValue(objectMapper.writeValueAsString(newValue));
            }
        } catch (Exception e) {
            // If JSON serialization fails, store as string
            log.setOldValue(oldValue != null ? oldValue.toString() : null);
            log.setNewValue(newValue != null ? newValue.toString() : null);
        }
        
        taskLogRepository.save(log);
    }
    
    public void detachTaskFromLogs(Task task) {
        List<TaskLog> logs = taskLogRepository.findByTask(task);
        for (TaskLog log : logs) {
            if (log.getTaskTitle() == null) {
                log.setTaskTitle(task.getTitle());
            }
            log.setTask(null);
        }
        taskLogRepository.saveAll(logs);
    }
    
    public Page<TaskLogDTO> getTaskLogs(Long taskId, Long userId, String action, 
                                        LocalDateTime startDate, LocalDateTime endDate, 
                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TaskLog> logs;
        
        // Try to use simpler queries when possible to avoid PostgreSQL native query parameter issues
        // Only use native query when absolutely necessary (multiple filters including dates)
        if (taskId != null && userId == null && (action == null || action.isEmpty()) && startDate == null && endDate == null) {
            logs = taskLogRepository.findByTaskIdOrderByCreatedAtDesc(taskId, pageable);
        } else if (taskId == null && userId != null && (action == null || action.isEmpty()) && startDate == null && endDate == null) {
            logs = taskLogRepository.findByChangedByIdOrderByCreatedAtDesc(userId, pageable);
        } else if (taskId == null && userId == null && action != null && !action.isEmpty() && startDate == null && endDate == null) {
            logs = taskLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
        } else if (taskId == null && userId != null && action != null && !action.isEmpty() && startDate == null && endDate == null) {
            logs = taskLogRepository.findByChangedByIdAndActionOrderByCreatedAtDesc(userId, action, pageable);
        } else if (startDate != null && endDate != null && taskId == null && userId == null && (action == null || action.isEmpty())) {
            logs = taskLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate, pageable);
        } else {
            // For complex filters, use EntityManager to build dynamic native query
            StringBuilder sql = new StringBuilder("SELECT * FROM task_logs tl WHERE 1=1");
            List<Object> params = new java.util.ArrayList<>();
            
            if (taskId != null) {
                sql.append(" AND tl.task_id = ?");
                params.add(taskId);
            }
            
            if (userId != null) {
                sql.append(" AND tl.changed_by = ?");
                params.add(userId);
            }
            
            if (action != null && !action.isEmpty()) {
                sql.append(" AND tl.action = ?");
                params.add(action);
            }
            
            if (startDate != null) {
                sql.append(" AND tl.created_at >= ?");
                params.add(startDate);
            }
            
            if (endDate != null) {
                sql.append(" AND tl.created_at <= ?");
                params.add(endDate);
            }
            
            sql.append(" ORDER BY tl.created_at DESC");
            
            // Create query
            Query query = entityManager.createNativeQuery(sql.toString(), TaskLog.class);
            for (int i = 0; i < params.size(); i++) {
                query.setParameter(i + 1, params.get(i));
            }
            
            // Apply pagination
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
            
            List<TaskLog> resultList = query.getResultList();
            
            // Count total
            StringBuilder countSqlBuilder = new StringBuilder("SELECT COUNT(*) FROM task_logs tl WHERE 1=1");
            if (taskId != null) {
                countSqlBuilder.append(" AND tl.task_id = ?");
            }
            if (userId != null) {
                countSqlBuilder.append(" AND tl.changed_by = ?");
            }
            if (action != null && !action.isEmpty()) {
                countSqlBuilder.append(" AND tl.action = ?");
            }
            if (startDate != null) {
                countSqlBuilder.append(" AND tl.created_at >= ?");
            }
            if (endDate != null) {
                countSqlBuilder.append(" AND tl.created_at <= ?");
            }
            
            Query countQuery = entityManager.createNativeQuery(countSqlBuilder.toString());
            for (int i = 0; i < params.size(); i++) {
                countQuery.setParameter(i + 1, params.get(i));
            }
            
            long total = ((Number) countQuery.getSingleResult()).longValue();
            
            logs = new PageImpl<>(resultList, pageable, total);
        }
        
        return logs.map(this::convertToDTO);
    }
    
    public List<TaskLogDTO> getUserTaskHistory(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        List<TaskLog> logs = taskLogRepository.findUserTaskHistory(userId, startDate, endDate);
        return logs.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private TaskLogDTO convertToDTO(TaskLog log) {
        TaskLogDTO dto = new TaskLogDTO();
        dto.setId(log.getId());
        
        // Task silinmiş olabilir, null kontrolü yap
        if (log.getTask() != null) {
            dto.setTaskId(log.getTask().getId());
            dto.setTaskTitle(log.getTask().getTitle());
        } else {
            dto.setTaskId(null);
            dto.setTaskTitle(log.getTaskTitle() != null ? log.getTaskTitle() + " (silinmiş)" : "Silinmiş İş");
        }
        
        dto.setAction(log.getAction());
        dto.setOldValue(log.getOldValue());
        dto.setNewValue(log.getNewValue());
        dto.setChangedById(log.getChangedBy().getId());
        dto.setChangedByUsername(log.getChangedBy().getUsername());
        dto.setChangedByFullName(log.getChangedBy().getFullName());
        dto.setChangeReason(log.getChangeReason());
        dto.setCreatedAt(log.getCreatedAt());
        
        return dto;
    }
}

