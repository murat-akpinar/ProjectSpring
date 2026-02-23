package com.projectspring.repository;

import com.projectspring.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByName(String name);
    List<Team> findByIsActiveTrue();
    
    @Query("SELECT t FROM Team t JOIN t.members m WHERE m.id = :userId AND t.isActive = true")
    List<Team> findTeamsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Team t WHERE t.leader.id = :userId AND t.isActive = true")
    List<Team> findTeamsByLeaderId(@Param("userId") Long userId);

    @Modifying
    @Query(value = "UPDATE teams SET leader_id = :leaderId WHERE id = :teamId", nativeQuery = true)
    void updateLeaderId(@Param("teamId") Long teamId, @Param("leaderId") Long leaderId);
}

