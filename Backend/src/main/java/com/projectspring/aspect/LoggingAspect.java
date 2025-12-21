package com.projectspring.aspect;

import com.projectspring.model.User;
import com.projectspring.repository.UserRepository;
import com.projectspring.service.SystemLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

@Aspect
@Component
public class LoggingAspect {
    
    @Autowired
    private SystemLogService systemLogService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Around("execution(* com.projectspring.controller..*(..)) && " +
            "!execution(* com.projectspring.controller.SystemLogController.*(..)) && " +
            "!execution(* com.projectspring.controller.TaskLogController.*(..))")
    public Object logControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String endpoint = className + "." + methodName;
        
        // Get request information
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String ipAddress = null;
        String requestEndpoint = null;
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            ipAddress = getClientIpAddress(request);
            requestEndpoint = request.getMethod() + " " + request.getRequestURI();
        }
        
        // Get current user
        User currentUser = null;
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !authentication.getName().equals("anonymousUser")) {
                currentUser = userRepository.findByUsername(authentication.getName()).orElse(null);
            }
        } catch (Exception e) {
            // Ignore
        }
        
        long startTime = System.currentTimeMillis();
        Exception exception = null;
        Object result = null;
        
        try {
            result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            
            // Log successful request
            systemLogService.log(
                "INFO",
                "Request successful: " + requestEndpoint + " (duration: " + duration + "ms)",
                "BACKEND",
                currentUser,
                ipAddress,
                requestEndpoint,
                null
            );
            
            return result;
        } catch (Exception e) {
            exception = e;
            long duration = System.currentTimeMillis() - startTime;
            
            // Log failed request
            systemLogService.log(
                "ERROR",
                "Request failed: " + requestEndpoint + " - " + e.getClass().getSimpleName() + ": " + e.getMessage() + " (duration: " + duration + "ms)",
                "BACKEND",
                currentUser,
                ipAddress,
                requestEndpoint,
                e
            );
            
            throw e;
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
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

