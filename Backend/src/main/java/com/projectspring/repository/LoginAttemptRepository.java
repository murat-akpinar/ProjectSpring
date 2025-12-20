package com.projectspring.repository;

import com.projectspring.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ipAddress AND la.attemptTime > :since AND la.success = false")
    Long countFailedAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.username = :username AND la.attemptTime > :since AND la.success = false")
    Long countFailedAttemptsByUsernameSince(@Param("username") String username, @Param("since") LocalDateTime since);
    
    @Query("SELECT la FROM LoginAttempt la WHERE la.username = :username AND la.attemptTime > :since ORDER BY la.attemptTime DESC")
    List<LoginAttempt> findRecentAttemptsByUsername(@Param("username") String username, @Param("since") LocalDateTime since);
    
    @Query("SELECT la FROM LoginAttempt la WHERE la.ipAddress = :ipAddress AND la.attemptTime > :since ORDER BY la.attemptTime DESC")
    List<LoginAttempt> findRecentAttemptsByIp(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
    
    void deleteByAttemptTimeBefore(LocalDateTime cutoff);
}

