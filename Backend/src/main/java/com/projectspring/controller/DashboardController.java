package com.projectspring.controller;

import com.projectspring.dto.DashboardStatsDTO;
import com.projectspring.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    @Autowired
    private DashboardService dashboardService;
    
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<DashboardStatsDTO> getTeamDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(dashboardService.getTeamDashboardStats(id));
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getAllTeamsDashboard() {
        return ResponseEntity.ok(dashboardService.getTeamDashboardStats(null));
    }
}

