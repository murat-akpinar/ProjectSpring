package com.projectspring.service;

import com.projectspring.dto.SystemHealthDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class SystemHealthService {

    @Autowired
    private DataSource dataSource;

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${app.frontend.url:http://frontend:80}")
    private String frontendUrl;

    private static final int HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

    public SystemHealthDTO checkSystemHealth() {
        SystemHealthDTO health = new SystemHealthDTO();
        health.setLastChecked(LocalDateTime.now());

        // Check backend (always healthy if this service is running)
        health.setBackendStatus(SystemHealthDTO.HealthStatus.HEALTHY);
        health.setBackendMessage("Backend is running");

        // Check database
        SystemHealthDTO.HealthStatus dbStatus = checkDatabase();
        health.setDatabaseStatus(dbStatus);
        if (dbStatus == SystemHealthDTO.HealthStatus.HEALTHY) {
            health.setDatabaseMessage("Database connection is healthy");
        } else {
            health.setDatabaseMessage("Database connection failed");
        }

        // Check frontend (optional)
        SystemHealthDTO.HealthStatus frontendStatus = checkFrontend();
        health.setFrontendStatus(frontendStatus);
        if (frontendStatus == SystemHealthDTO.HealthStatus.HEALTHY) {
            health.setFrontendMessage("Frontend is accessible");
        } else if (frontendStatus == SystemHealthDTO.HealthStatus.UNKNOWN) {
            health.setFrontendMessage("Frontend check skipped");
        } else {
            health.setFrontendMessage("Frontend is not accessible");
        }

        return health;
    }

    private SystemHealthDTO.HealthStatus checkDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(5)) { // 5 second timeout
                return SystemHealthDTO.HealthStatus.HEALTHY;
            } else {
                return SystemHealthDTO.HealthStatus.UNHEALTHY;
            }
        } catch (Exception e) {
            return SystemHealthDTO.HealthStatus.UNHEALTHY;
        }
    }

    private SystemHealthDTO.HealthStatus checkFrontend() {
        try {
            URL url = new URL(frontendUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(HEALTH_CHECK_TIMEOUT);
            connection.setReadTimeout(HEALTH_CHECK_TIMEOUT);
            
            int responseCode = connection.getResponseCode();
            connection.disconnect();
            
            // Consider 2xx and 3xx as healthy
            if (responseCode >= 200 && responseCode < 400) {
                return SystemHealthDTO.HealthStatus.HEALTHY;
            } else {
                return SystemHealthDTO.HealthStatus.UNHEALTHY;
            }
        } catch (Exception e) {
            // Log the exception for debugging
            System.err.println("Frontend health check failed: " + e.getMessage());
            // If frontend URL is not configured or unreachable, return UNKNOWN
            // This is optional check, so we don't want to fail the whole health check
            return SystemHealthDTO.HealthStatus.UNKNOWN;
        }
    }
}

