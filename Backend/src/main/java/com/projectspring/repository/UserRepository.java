package com.projectspring.repository;

import com.projectspring.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByLdapDn(String ldapDn);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.teams t WHERE t.id = :teamId AND u.isActive = true")
    List<User> findByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles LEFT JOIN FETCH u.teams WHERE u.username = :username")
    Optional<User> findByUsernameWithRolesAndTeams(@Param("username") String username);
}

