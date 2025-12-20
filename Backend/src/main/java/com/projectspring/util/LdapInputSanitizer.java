package com.projectspring.util;

import java.util.regex.Pattern;

public class LdapInputSanitizer {
    
    // LDAP special characters that could be used for injection
    private static final Pattern LDAP_SPECIAL_CHARS = Pattern.compile("[*()\\\\\\x00]");
    
    // Username pattern: alphanumeric, underscore, hyphen, dot (max 100 chars)
    private static final Pattern VALID_USERNAME = Pattern.compile("^[a-zA-Z0-9._-]{1,100}$");
    
    /**
     * Sanitizes username input to prevent LDAP injection
     * @param username The username to sanitize
     * @return Sanitized username
     * @throws IllegalArgumentException if username contains invalid characters
     */
    public static String sanitizeUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be null or empty");
        }
        
        String trimmed = username.trim();
        
        // Check for LDAP special characters
        if (LDAP_SPECIAL_CHARS.matcher(trimmed).find()) {
            throw new IllegalArgumentException("Username contains invalid characters");
        }
        
        // Validate username format
        if (!VALID_USERNAME.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Username format is invalid. Only alphanumeric characters, underscore, hyphen, and dot are allowed.");
        }
        
        return trimmed;
    }
    
    /**
     * Escapes LDAP special characters in search filter
     * @param input The input string to escape
     * @return Escaped string safe for LDAP search
     */
    public static String escapeLdapSearchFilter(String input) {
        if (input == null) {
            return null;
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '\\':
                    sb.append("\\5c");
                    break;
                case '*':
                    sb.append("\\2a");
                    break;
                case '(':
                    sb.append("\\28");
                    break;
                case ')':
                    sb.append("\\29");
                    break;
                case '\0':
                    sb.append("\\00");
                    break;
                default:
                    sb.append(c);
            }
        }
        return sb.toString();
    }
    
    /**
     * Validates that a string doesn't contain LDAP injection patterns
     * @param input The input to validate
     * @return true if safe, false otherwise
     */
    public static boolean isSafeForLdap(String input) {
        if (input == null) {
            return true;
        }
        return !LDAP_SPECIAL_CHARS.matcher(input).find();
    }
}

