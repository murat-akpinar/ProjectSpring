package com.projectspring.service;

import com.projectspring.dto.LdapSearchRequest;
import com.projectspring.dto.LdapUserDTO;
import com.projectspring.model.RoleEntity;
import com.projectspring.model.User;
import com.projectspring.repository.RoleRepository;
import com.projectspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.support.LdapUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.naming.directory.Attributes;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class LdapImportService {

    @Autowired
    private LdapTemplate ldapTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Value("${spring.ldap.user-search-base:}")
    private String userSearchBase;

    @Value("${spring.ldap.user-search-filter:(uid={0})}")
    private String userSearchFilter;

    public List<LdapUserDTO> searchUsers(String username) {
        List<LdapUserDTO> results = new ArrayList<>();

        try {
            EqualsFilter filter = new EqualsFilter("uid", username);
            List<LdapUserDTO> users = ldapTemplate.search(
                    LdapUtils.emptyLdapName(),
                    filter.encode(),
                    (AttributesMapper<LdapUserDTO>) attrs -> {
                        LdapUserDTO dto = new LdapUserDTO();
                        dto.setUsername(getAttributeValue(attrs, "uid"));
                        dto.setEmail(getAttributeValue(attrs, "mail"));
                        dto.setFullName(getAttributeValue(attrs, "cn"));
                        dto.setCn(getAttributeValue(attrs, "cn"));
                        dto.setSn(getAttributeValue(attrs, "sn"));
                        dto.setGivenName(getAttributeValue(attrs, "givenName"));
                        dto.setLdapDn(getAttributeValue(attrs, "distinguishedName"));
                        return dto;
                    }
            );

            results.addAll(users);
        } catch (Exception e) {
            // Log error but don't throw - return empty list
            System.err.println("LDAP search error: " + e.getMessage());
        }

        return results;
    }

    public User importLdapUser(LdapUserDTO ldapUser, Set<Long> roleIds) {
        // Check if user already exists
        Optional<User> existingUser = userRepository.findByUsername(ldapUser.getUsername());
        if (existingUser.isPresent()) {
            throw new RuntimeException("User already exists: " + ldapUser.getUsername());
        }

        // Check if LDAP DN already exists
        if (ldapUser.getLdapDn() != null) {
            Optional<User> existingByDn = userRepository.findByLdapDn(ldapUser.getLdapDn());
            if (existingByDn.isPresent()) {
                throw new RuntimeException("User with this LDAP DN already exists");
            }
        }

        // Create new user
        User user = new User();
        user.setUsername(ldapUser.getUsername());
        user.setEmail(ldapUser.getEmail() != null ? ldapUser.getEmail() : ldapUser.getUsername() + "@example.com");
        user.setFullName(ldapUser.getFullName() != null ? ldapUser.getFullName() : ldapUser.getUsername());
        user.setLdapDn(ldapUser.getLdapDn());
        user.setPassword(null); // LDAP users don't have passwords in database
        user.setIsActive(true);

        // Assign roles
        Set<RoleEntity> roles = new HashSet<>();
        if (roleIds != null && !roleIds.isEmpty()) {
            roles = roleIds.stream()
                    .map(roleId -> roleRepository.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleId)))
                    .collect(java.util.stream.Collectors.toSet());
        } else {
            // Default role if none specified
            roleRepository.findByName("YAZILIMCI")
                    .ifPresent(roles::add);
        }
        user.setRoles(roles);

        return userRepository.save(user);
    }

    private String getAttributeValue(Attributes attrs, String attributeName) {
        try {
            if (attrs.get(attributeName) != null) {
                Object value = attrs.get(attributeName).get();
                return value != null ? value.toString() : null;
            }
        } catch (Exception e) {
            // Attribute not found or error reading
        }
        return null;
    }
}

