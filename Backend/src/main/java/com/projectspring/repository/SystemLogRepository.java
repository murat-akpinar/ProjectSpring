package com.projectspring.repository;

import com.projectspring.model.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    
    Page<SystemLog> findBySourceOrderByCreatedAtDesc(String source, Pageable pageable);
    
    Page<SystemLog> findByLevelOrderByCreatedAtDesc(String level, Pageable pageable);
    
    Page<SystemLog> findBySourceAndLevelOrderByCreatedAtDesc(String source, String level, Pageable pageable);
    
    Page<SystemLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    @Query("SELECT sl FROM SystemLog sl WHERE sl.createdAt BETWEEN :start AND :end ORDER BY sl.createdAt DESC")
    Page<SystemLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            @Param("start") LocalDateTime start, 
            @Param("end") LocalDateTime end, 
            Pageable pageable
    );
    
    @Query(value = "SELECT * FROM system_logs sl WHERE " +
           "(:source = '' OR sl.source = :source) AND " +
           "(:level = '' OR sl.level = :level) AND " +
           "(:userId IS NULL OR sl.user_id = CAST(:userId AS BIGINT)) AND " +
           "(:startDate IS NULL OR sl.created_at >= CAST(:startDate AS TIMESTAMP)) AND " +
           "(:endDate IS NULL OR sl.created_at <= CAST(:endDate AS TIMESTAMP)) " +
           "ORDER BY sl.created_at DESC",
           nativeQuery = true)
    Page<SystemLog> findWithFilters(
            @Param("source") String source,
            @Param("level") String level,
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}

