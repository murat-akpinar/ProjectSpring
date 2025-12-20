package com.projectspring.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class JwtConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtConfig.class);
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    private static final String DEFAULT_SECRET = "your-secret-key-change-this-in-production-min-256-bits";
    private static final int MIN_SECRET_LENGTH = 32; // 256 bits = 32 bytes
    
    @EventListener(ApplicationReadyEvent.class)
    public void validateJwtSecret() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            logger.error("================================================");
            logger.error("SECURITY WARNING: JWT_SECRET is not set!");
            logger.error("Please set a strong JWT secret in your environment variables.");
            logger.error("Minimum length: {} characters (256 bits)", MIN_SECRET_LENGTH);
            logger.error("================================================");
            return;
        }
        
        if (DEFAULT_SECRET.equals(jwtSecret)) {
            logger.warn("================================================");
            logger.warn("SECURITY WARNING: Using default JWT secret!");
            logger.warn("This is insecure for production environments.");
            logger.warn("Please change JWT_SECRET to a strong random value.");
            logger.warn("Minimum length: {} characters (256 bits)", MIN_SECRET_LENGTH);
            logger.warn("Generate a secure secret: openssl rand -base64 32");
            logger.warn("================================================");
            return;
        }
        
        if (jwtSecret.length() < MIN_SECRET_LENGTH) {
            logger.warn("================================================");
            logger.warn("SECURITY WARNING: JWT secret is too short!");
            logger.warn("Current length: {} characters", jwtSecret.length());
            logger.warn("Minimum recommended length: {} characters (256 bits)", MIN_SECRET_LENGTH);
            logger.warn("Please use a longer secret for better security.");
            logger.warn("================================================");
            return;
        }
        
        logger.info("JWT secret validation passed (length: {} characters)", jwtSecret.length());
    }
}

