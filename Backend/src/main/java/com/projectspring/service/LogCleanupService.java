package com.projectspring.service;

import com.projectspring.repository.SystemLogRepository;
import com.projectspring.repository.TaskLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class LogCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(LogCleanupService.class);

    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private TaskLogRepository taskLogRepository;

    @Value("${app.logging.retention.system-logs-days:30}")
    private int systemLogRetentionDays;

    @Value("${app.logging.retention.task-logs-days:90}")
    private int taskLogRetentionDays;

    @Scheduled(cron = "0 30 2 * * ?")
    @Transactional
    public void cleanupOldLogs() {
        cleanupSystemLogs();
        cleanupTaskLogs();
    }

    private void cleanupSystemLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(systemLogRetentionDays);
        long count = systemLogRepository.countByCreatedAtBefore(cutoff);
        if (count > 0) {
            systemLogRepository.deleteByCreatedAtBefore(cutoff);
            logger.info("Cleaned up {} system log entries older than {} days", count, systemLogRetentionDays);
        }
    }

    private void cleanupTaskLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(taskLogRetentionDays);
        long count = taskLogRepository.countByCreatedAtBefore(cutoff);
        if (count > 0) {
            taskLogRepository.deleteByCreatedAtBefore(cutoff);
            logger.info("Cleaned up {} task log entries older than {} days", count, taskLogRetentionDays);
        }
    }
}
