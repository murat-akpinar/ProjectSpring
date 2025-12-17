package com.projectspring.repository;

import com.projectspring.model.Task;
import com.projectspring.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    @Query("SELECT t FROM Task t WHERE t.team.id = :teamId")
    List<Task> findByTeamId(@Param("teamId") Long teamId);
    
    @Query("SELECT t FROM Task t WHERE t.team.id = :teamId AND YEAR(t.startDate) = :year")
    List<Task> findByTeamIdAndYear(@Param("teamId") Long teamId, @Param("year") int year);
    
    @Query("SELECT t FROM Task t WHERE t.team.id = :teamId AND YEAR(t.startDate) = :year AND MONTH(t.startDate) = :month")
    List<Task> findByTeamIdAndYearAndMonth(@Param("teamId") Long teamId, @Param("year") int year, @Param("month") int month);
    
    @Query("SELECT t FROM Task t JOIN t.assignees a WHERE a.id = :userId")
    List<Task> findByAssigneeId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Task t WHERE t.team.id = :teamId AND t.status = :status")
    List<Task> findByTeamIdAndStatus(@Param("teamId") Long teamId, @Param("status") TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.endDate < :today AND t.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Task> findOverdueTasks(@Param("today") LocalDate today);
    
    @Query("SELECT t FROM Task t WHERE t.team.id IN :teamIds AND YEAR(t.startDate) = :year")
    List<Task> findByTeamIdsAndYear(@Param("teamIds") List<Long> teamIds, @Param("year") int year);
    
    @Query("SELECT t FROM Task t WHERE t.team.id IN :teamIds AND YEAR(t.startDate) = :year AND MONTH(t.startDate) = :month")
    List<Task> findByTeamIdsAndYearAndMonth(@Param("teamIds") List<Long> teamIds, @Param("year") int year, @Param("month") int month);
    
    @Query("SELECT t FROM Task t WHERE t.team.id IN :teamIds AND t.startDate >= :startDate AND t.endDate <= :endDate")
    List<Task> findByTeamIdsAndDateRange(@Param("teamIds") List<Long> teamIds, 
                                         @Param("startDate") LocalDate startDate, 
                                         @Param("endDate") LocalDate endDate);
}

