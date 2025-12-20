package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamDTO {
    private Long id;
    private String name;
    private String description;
    private Long leaderId;
    private String leaderName;
    private String color;
    private String icon;
    private Boolean isActive;
}

