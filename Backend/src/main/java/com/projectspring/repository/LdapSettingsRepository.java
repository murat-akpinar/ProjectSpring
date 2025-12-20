package com.projectspring.repository;

import com.projectspring.model.LdapSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LdapSettingsRepository extends JpaRepository<LdapSettings, Long> {
    Optional<LdapSettings> findByIsEnabledTrue();
}

