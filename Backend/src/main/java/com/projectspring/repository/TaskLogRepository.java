package com.projectspring.repository;

import com.projectspring.model.TaskLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskLogRepository extends JpaRepository<TaskLog, Long> {
    
    Page<TaskLog> findByTaskIdOrderByCreatedAtDesc(Long taskId, Pageable pageable);
    
    Page<TaskLog> findByChangedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    Page<TaskLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);
    
    Page<TaskLog> findByChangedByIdAndActionOrderByCreatedAtDesc(Long userId, String action, Pageable pageable);
    
    @Query("SELECT tl FROM TaskLog tl WHERE tl.createdAt BETWEEN :start AND :end ORDER BY tl.createdAt DESC")
    Page<TaskLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            @Param("start") LocalDateTime start, 
            @Param("end") LocalDateTime end, 
            Pageable pageable
    );
    
    @Query(value = "SELECT * FROM task_logs tl WHERE " +
           "(:taskId IS NULL OR tl.task_id = :taskId) AND " +
           "(:userId IS NULL OR tl.changed_by = :userId) AND " +
           "(:action = '' OR tl.action = :action) AND " +
           "(:startDate IS NULL OR tl.created_at >= :startDate) AND " +
           "(:endDate IS NULL OR tl.created_at <= :endDate) " +
           "ORDER BY tl.created_at DESC",
           nativeQuery = true)
    Page<TaskLog> findWithFilters(
            @Param("taskId") Long taskId,
            @Param("userId") Long userId,
            @Param("action") String action,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    @Query("SELECT tl FROM TaskLog tl WHERE tl.changedBy.id = :userId AND " +
           "(:startDate IS NULL OR tl.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR tl.createdAt <= :endDate) " +
           "ORDER BY tl.createdAt DESC")
    List<TaskLog> findUserTaskHistory(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}

