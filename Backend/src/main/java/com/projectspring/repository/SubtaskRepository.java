package com.projectspring.repository;

import com.projectspring.model.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByTaskId(Long taskId);
    
    @Query("SELECT s FROM Subtask s WHERE s.task.id = :taskId AND s.isCompleted = false")
    List<Subtask> findIncompleteByTaskId(@Param("taskId") Long taskId);
}

