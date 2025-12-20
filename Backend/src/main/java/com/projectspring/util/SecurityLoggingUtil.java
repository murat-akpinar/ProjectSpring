package com.projectspring.util;

import java.util.regex.Pattern;

public class SecurityLoggingUtil {
    
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("(?i)(password|pwd|pass|secret|token|jwt|api[_-]?key|auth[_-]?token)");
    private static final String MASKED_VALUE = "***REDACTED***";
    
    /**
     * Masks sensitive information in log messages
     * @param message The log message
     * @return Masked message with sensitive data redacted
     */
    public static String maskSensitiveData(String message) {
        if (message == null || message.isEmpty()) {
            return message;
        }
        
        // Mask common sensitive patterns
        // Password in JSON: "password":"value" -> "password":"***REDACTED***"
        message = message.replaceAll("(?i)(\"password\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        message = message.replaceAll("(?i)(\"pwd\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        message = message.replaceAll("(?i)(\"pass\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        message = message.replaceAll("(?i)(\"secret\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        message = message.replaceAll("(?i)(\"token\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        message = message.replaceAll("(?i)(\"jwt\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        message = message.replaceAll("(?i)(\"api[_-]?key\"\\s*:\\s*\")([^\"]+)(\")", "$1" + MASKED_VALUE + "$3");
        
        // Mask JWT tokens (Bearer token format)
        message = message.replaceAll("Bearer\\s+[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+", "Bearer " + MASKED_VALUE);
        
        // Mask password in key=value format
        message = message.replaceAll("(?i)(password|pwd|pass|secret|token|jwt|api[_-]?key)\\s*=\\s*[^\\s,;]+", "$1=" + MASKED_VALUE);
        
        return message;
    }
    
    /**
     * Checks if a string contains sensitive information
     * @param text The text to check
     * @return true if contains sensitive data
     */
    public static boolean containsSensitiveData(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        return PASSWORD_PATTERN.matcher(text).find();
    }
    
    /**
     * Safely logs a message, masking sensitive data
     * @param logger The logger instance
     * @param level The log level (info, warn, error, debug)
     * @param message The message to log
     */
    public static void safeLog(org.slf4j.Logger logger, String level, String message) {
        String maskedMessage = maskSensitiveData(message);
        switch (level.toLowerCase()) {
            case "debug":
                logger.debug(maskedMessage);
                break;
            case "info":
                logger.info(maskedMessage);
                break;
            case "warn":
                logger.warn(maskedMessage);
                break;
            case "error":
                logger.error(maskedMessage);
                break;
            default:
                logger.info(maskedMessage);
        }
    }
}

