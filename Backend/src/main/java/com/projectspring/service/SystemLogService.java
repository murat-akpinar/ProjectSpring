package com.projectspring.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectspring.dto.SystemLogDTO;
import com.projectspring.model.SystemLog;
import com.projectspring.model.User;
import com.projectspring.repository.SystemLogRepository;
import com.projectspring.util.SecurityLoggingUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@Transactional
public class SystemLogService {
    
    @Autowired
    private SystemLogRepository systemLogRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void log(String level, String message, String source, User user, String ipAddress, String endpoint, Exception exception) {
        SystemLog log = new SystemLog();
        log.setLevel(level);
        
        // Mask sensitive data in message
        String maskedMessage = SecurityLoggingUtil.maskSensitiveData(message);
        log.setMessage(maskedMessage);
        
        log.setSource(source);
        log.setUser(user);
        log.setIpAddress(ipAddress);
        log.setEndpoint(endpoint);
        
        if (exception != null) {
            // Mask sensitive data in exception message
            String exceptionMessage = SecurityLoggingUtil.maskSensitiveData(
                    exception.getClass().getSimpleName() + ": " + exception.getMessage()
            );
            log.setException(exceptionMessage);
        }
        
        systemLogRepository.save(log);
    }
    
    public Page<SystemLogDTO> getSystemLogs(String source, String level, Long userId, 
                                            LocalDateTime startDate, LocalDateTime endDate, 
                                            int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SystemLog> logs;
        
        // If date filters are present, always use native query
        // Otherwise use simpler queries when possible to avoid PostgreSQL parameter type issues
        if (startDate != null || endDate != null) {
            // Use native query for complex filters including date filters
            logs = systemLogRepository.findWithFilters(
                    source != null ? source : "",
                    level != null ? level : "",
                    userId,
                    startDate,
                    endDate,
                    pageable
            );
        } else if (source != null && level != null && userId == null) {
            logs = systemLogRepository.findBySourceAndLevelOrderByCreatedAtDesc(source, level, pageable);
        } else if (source != null && level == null && userId == null) {
            logs = systemLogRepository.findBySourceOrderByCreatedAtDesc(source, pageable);
        } else if (source == null && level != null && userId == null) {
            logs = systemLogRepository.findByLevelOrderByCreatedAtDesc(level, pageable);
        } else if (source == null && level == null && userId != null) {
            logs = systemLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        } else {
            // Use native query for complex filters
            logs = systemLogRepository.findWithFilters(
                    source != null ? source : "",
                    level != null ? level : "",
                    userId,
                    startDate,
                    endDate,
                    pageable
            );
        }
        
        return logs.map(this::convertToDTO);
    }
    
    public Page<SystemLogDTO> getBackendLogs(String level, Long userId, 
                                             LocalDateTime startDate, LocalDateTime endDate, 
                                             int page, int size) {
        return getSystemLogs("BACKEND", level, userId, startDate, endDate, page, size);
    }
    
    public Page<SystemLogDTO> getFrontendLogs(String level, Long userId, 
                                              LocalDateTime startDate, LocalDateTime endDate, 
                                              int page, int size) {
        return getSystemLogs("FRONTEND", level, userId, startDate, endDate, page, size);
    }
    
    private SystemLogDTO convertToDTO(SystemLog log) {
        SystemLogDTO dto = new SystemLogDTO();
        dto.setId(log.getId());
        dto.setLevel(log.getLevel());
        dto.setMessage(log.getMessage());
        dto.setSource(log.getSource());
        dto.setIpAddress(log.getIpAddress());
        dto.setEndpoint(log.getEndpoint());
        dto.setException(log.getException());
        dto.setCreatedAt(log.getCreatedAt());
        
        if (log.getUser() != null) {
            dto.setUserId(log.getUser().getId());
            dto.setUsername(log.getUser().getUsername());
            dto.setFullName(log.getUser().getFullName());
        }
        
        return dto;
    }
}

