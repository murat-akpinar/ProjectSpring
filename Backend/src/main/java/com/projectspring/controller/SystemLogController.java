package com.projectspring.controller;

import com.projectspring.dto.FrontendLogRequest;
import com.projectspring.dto.SystemLogDTO;
import com.projectspring.dto.SystemLogFilterRequest;
import com.projectspring.model.User;
import com.projectspring.repository.UserRepository;
import com.projectspring.service.SystemLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/logs")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN')")
public class SystemLogController {
    
    @Autowired
    private SystemLogService systemLogService;
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping("/system")
    public ResponseEntity<Page<SystemLogDTO>> getSystemLogs(
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Page<SystemLogDTO> logs = systemLogService.getSystemLogs(
                source, level, userId, startDate, endDate, page, size
        );
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/system/backend")
    public ResponseEntity<Page<SystemLogDTO>> getBackendLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Page<SystemLogDTO> logs = systemLogService.getBackendLogs(
                level, userId, startDate, endDate, page, size
        );
        return ResponseEntity.ok(logs);
    }
    
    @GetMapping("/system/frontend")
    public ResponseEntity<Page<SystemLogDTO>> getFrontendLogs(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        Page<SystemLogDTO> logs = systemLogService.getFrontendLogs(
                level, userId, startDate, endDate, page, size
        );
        return ResponseEntity.ok(logs);
    }
    
    @PostMapping("/system/frontend")
    public ResponseEntity<?> receiveFrontendLog(
            @RequestBody FrontendLogRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        // Frontend'den log gönderme endpoint'i
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        User currentUser = null;
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getName().equals("anonymousUser")) {
            currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
        }
        
        String ipAddress = getClientIpAddress(httpRequest);
        String endpoint = httpRequest.getMethod() + " " + httpRequest.getRequestURI();
        
        Exception exception = null;
        if (request.getStackTrace() != null && !request.getStackTrace().isEmpty()) {
            exception = new Exception(request.getStackTrace());
        }
        
        systemLogService.log(
            request.getLevel(),
            request.getMessage(),
            "FRONTEND",
            currentUser,
            ipAddress,
            endpoint,
            exception
        );
        
        return ResponseEntity.ok().build();
    }
    
    private String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}

