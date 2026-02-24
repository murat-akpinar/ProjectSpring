package com.projectspring.aspect;

import com.projectspring.model.User;
import com.projectspring.repository.UserRepository;
import com.projectspring.service.SystemLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Set;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    private static final Set<String> READ_ONLY_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    @Autowired
    private SystemLogService systemLogService;

    @Autowired
    private UserRepository userRepository;

    @Around("execution(* com.projectspring.controller..*(..)) && " +
            "!execution(* com.projectspring.controller.SystemLogController.*(..)) && " +
            "!execution(* com.projectspring.controller.TaskLogController.*(..)) && " +
            "!execution(* com.projectspring.controller.HealthController.*(..)) && " +
            "!execution(* com.projectspring.controller.SystemHealthController.*(..))")
    public Object logControllerMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String ipAddress = null;
        String requestEndpoint = null;
        String httpMethod = null;
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            ipAddress = getClientIpAddress(request);
            httpMethod = request.getMethod();
            requestEndpoint = httpMethod + " " + request.getRequestURI();
        }

        boolean isReadOnly = httpMethod != null && READ_ONLY_METHODS.contains(httpMethod);

        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;

            if (isReadOnly) {
                logger.debug("Request successful: {} ({}ms)", requestEndpoint, duration);
            } else {
                User currentUser = resolveCurrentUser();
                safeLog("INFO",
                    "Request successful: " + requestEndpoint + " (duration: " + duration + "ms)",
                    currentUser, ipAddress, requestEndpoint, null);
            }

            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;

            User currentUser = resolveCurrentUser();
            safeLog("ERROR",
                "Request failed: " + requestEndpoint + " - " + e.getClass().getSimpleName() + ": " + e.getMessage() + " (duration: " + duration + "ms)",
                currentUser, ipAddress, requestEndpoint, e);

            throw e;
        }
    }

    private User resolveCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !authentication.getName().equals("anonymousUser")) {
                return userRepository.findByUsername(authentication.getName()).orElse(null);
            }
        } catch (Exception e) {
            logger.debug("Could not resolve current user: {}", e.getMessage());
        }
        return null;
    }

    private void safeLog(String level, String message, User user, String ipAddress, String endpoint, Exception exception) {
        try {
            systemLogService.log(level, message, "BACKEND", user, ipAddress, endpoint, exception);
        } catch (Exception logException) {
            logger.warn("Failed to persist audit log to database: {}", logException.getMessage());
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

