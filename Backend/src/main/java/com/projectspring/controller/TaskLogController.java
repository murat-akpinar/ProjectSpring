package com.projectspring.controller;

import com.projectspring.dto.TaskLogDTO;
import com.projectspring.dto.TaskLogFilterRequest;
import com.projectspring.service.TaskLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN')")
public class TaskLogController {
    
    @Autowired
    private TaskLogService taskLogService;
    
    @GetMapping("/tasks")
    public ResponseEntity<org.springframework.data.domain.Page<TaskLogDTO>> getTaskLogs(
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        org.springframework.data.domain.Page<TaskLogDTO> logs = taskLogService.getTaskLogs(
                taskId, userId, action, startDate, endDate, page, size
        );
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/tasks/user/{userId}")
    public ResponseEntity<List<TaskLogDTO>> getUserTaskHistory(
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<TaskLogDTO> history = taskLogService.getUserTaskHistory(userId, startDate, endDate);
        return ResponseEntity.ok(history);
    }
}

