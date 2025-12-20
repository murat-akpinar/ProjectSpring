package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDetailsDTO {
    private DashboardStatsDTO stats;
    private List<UserLeaderboardDTO> topCompleters;
    private List<UserLeaderboardDTO> topPostponers;
    private List<UserLeaderboardDTO> topCancellers;
    private List<TeamMemberDTO> teamMembers;
}

