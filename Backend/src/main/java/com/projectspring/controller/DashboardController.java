package com.projectspring.controller;

import com.projectspring.dto.DashboardDetailsDTO;
import com.projectspring.dto.DashboardStatsDTO;
import com.projectspring.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    @Autowired
    private DashboardService dashboardService;
    
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<DashboardStatsDTO> getTeamDashboard(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getTeamDashboardStats(id, startDate, endDate));
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDTO> getAllTeamsDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getTeamDashboardStats(null, startDate, endDate));
    }
    
    @GetMapping("/{id}/dashboard/details")
    public ResponseEntity<DashboardDetailsDTO> getTeamDashboardDetails(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getTeamDashboardDetails(id, startDate, endDate));
    }
    
    @GetMapping("/dashboard/details")
    public ResponseEntity<DashboardDetailsDTO> getAllTeamsDashboardDetails(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardService.getTeamDashboardDetails(null, startDate, endDate));
    }
}
