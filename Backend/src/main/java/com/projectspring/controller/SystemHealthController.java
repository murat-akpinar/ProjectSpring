package com.projectspring.controller;

import com.projectspring.dto.SystemHealthDTO;
import com.projectspring.service.SystemHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/health")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'BIRIM_AMIRI')")
public class SystemHealthController {

    @Autowired
    private SystemHealthService systemHealthService;

    @GetMapping
    public ResponseEntity<SystemHealthDTO> getSystemHealth() {
        return ResponseEntity.ok(systemHealthService.checkSystemHealth());
    }
}

