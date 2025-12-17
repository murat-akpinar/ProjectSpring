package com.projectspring.repository;

import com.projectspring.model.TaskStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskStatusHistoryRepository extends JpaRepository<TaskStatusHistory, Long> {
    List<TaskStatusHistory> findByTaskIdOrderByCreatedAtDesc(Long taskId);
    
    @Query("SELECT h FROM TaskStatusHistory h WHERE h.task.id = :taskId AND h.newStatus = 'POSTPONED' ORDER BY h.createdAt DESC")
    List<TaskStatusHistory> findPostponedHistoryByTaskId(@Param("taskId") Long taskId);
}

