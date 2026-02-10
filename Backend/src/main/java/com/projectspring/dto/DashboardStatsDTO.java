package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long totalOpen;
    private Long totalInProgress;
    private Long totalTesting;
    private Long totalCompleted;
    private Long totalOverdue;
    private Long totalPostponed;
    private Long totalCancelled;
}
