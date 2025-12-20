package com.projectspring.repository;

import com.projectspring.model.Project;
import com.projectspring.model.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findByStatus(ProjectStatus status);
    
    @Query("SELECT DISTINCT p FROM Project p JOIN p.teams t WHERE t.id IN :teamIds")
    List<Project> findByTeamIds(@Param("teamIds") List<Long> teamIds);
    
    @Query("SELECT DISTINCT p FROM Project p JOIN p.teams t WHERE t.id = :teamId")
    List<Project> findByTeamId(@Param("teamId") Long teamId);
    
    Optional<Project> findByName(String name);
}

