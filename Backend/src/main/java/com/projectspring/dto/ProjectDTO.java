package com.projectspring.dto;

import com.projectspring.model.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProjectStatus status;
    private Long createdById;
    private String createdByName;
    private List<Long> teamIds;
    private List<String> teamNames;
    private Long taskCount;
    private Long completedTaskCount;
    private Long activeTaskCount;
}

