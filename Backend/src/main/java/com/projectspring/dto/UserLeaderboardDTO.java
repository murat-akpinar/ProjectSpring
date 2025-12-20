package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLeaderboardDTO {
    private Long userId;
    private String userName;
    private Long count;
}

