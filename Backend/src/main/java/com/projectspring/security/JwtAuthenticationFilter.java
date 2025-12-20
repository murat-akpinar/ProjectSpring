package com.projectspring.security;

import com.projectspring.service.JwtService;
import com.projectspring.service.UserDetailsServiceImpl;
import com.projectspring.util.SecurityLoggingUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        
        // Log all admin requests to debug token issues (without sensitive data)
        if (request.getRequestURI().startsWith("/api/admin")) {
            logger.info("Admin request: " + request.getRequestURI() + ", Authorization header: " + (authHeader != null ? "present" : "missing"));
        }
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (request.getRequestURI().startsWith("/api/admin")) {
                logger.warn("No Authorization header or invalid format for admin request: " + request.getRequestURI());
            } else {
                logger.debug("No Authorization header or invalid format for request: " + request.getRequestURI());
            }
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            final String jwt = authHeader.substring(7);
            // Don't log the actual token, just the length
            logger.debug("Processing JWT token for request: " + request.getRequestURI() + ", token length: " + jwt.length());
            final String username = jwtService.extractUsername(jwt);
            logger.debug("Extracted username: " + username + " from token");
            
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                logger.debug("Loading user details for username: " + username);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                logger.debug("User loaded with authorities: " + userDetails.getAuthorities());
                
                if (jwtService.validateToken(jwt, userDetails)) {
                    logger.debug("Token validated successfully for user: " + username);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set for user: " + username + " with authorities: " + userDetails.getAuthorities());
                } else {
                    logger.warn("Token validation failed for user: " + username);
                }
            } else {
                logger.warn("Username is null or authentication already set for request: " + request.getRequestURI());
            }
        } catch (Exception e) {
            // Mask sensitive data in error messages
            String errorMessage = SecurityLoggingUtil.maskSensitiveData(
                    "Cannot set user authentication for request " + request.getRequestURI() + ": " + e.getMessage()
            );
            logger.error(errorMessage, e);
            if (request.getRequestURI().startsWith("/api/admin")) {
                logger.error("Admin request failed authentication. Exception type: " + e.getClass().getName());
            }
        }
        
        filterChain.doFilter(request, response);
    }
}

