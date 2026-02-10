package com.projectspring.repository;

import com.projectspring.model.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    
    Page<SystemLog> findBySourceOrderByCreatedAtDesc(String source, Pageable pageable);
    
    Page<SystemLog> findByLevelOrderByCreatedAtDesc(String level, Pageable pageable);
    
    Page<SystemLog> findBySourceAndLevelOrderByCreatedAtDesc(String source, String level, Pageable pageable);
    
    Page<SystemLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Source + date range
    @Query("SELECT sl FROM SystemLog sl WHERE sl.source = :source AND sl.createdAt >= :startDate AND sl.createdAt <= :endDate ORDER BY sl.createdAt DESC")
    Page<SystemLog> findBySourceAndDateRange(
            @Param("source") String source,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    // Source + level + date range
    @Query("SELECT sl FROM SystemLog sl WHERE sl.source = :source AND sl.level = :level AND sl.createdAt >= :startDate AND sl.createdAt <= :endDate ORDER BY sl.createdAt DESC")
    Page<SystemLog> findBySourceAndLevelAndDateRange(
            @Param("source") String source,
            @Param("level") String level,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    // Level + date range
    @Query("SELECT sl FROM SystemLog sl WHERE sl.level = :level AND sl.createdAt >= :startDate AND sl.createdAt <= :endDate ORDER BY sl.createdAt DESC")
    Page<SystemLog> findByLevelAndDateRange(
            @Param("level") String level,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    // Date range only
    @Query("SELECT sl FROM SystemLog sl WHERE sl.createdAt >= :startDate AND sl.createdAt <= :endDate ORDER BY sl.createdAt DESC")
    Page<SystemLog> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    
    // All logs ordered
    Page<SystemLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

