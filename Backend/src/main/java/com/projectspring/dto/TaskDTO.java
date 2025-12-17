package com.projectspring.dto;

import com.projectspring.model.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    private String title;
    private String content;
    private LocalDate startDate;
    private LocalDate endDate;
    private TaskStatus status;
    private Long teamId;
    private String teamName;
    private Long createdById;
    private String createdByName;
    private Set<Long> assigneeIds;
    private List<String> assigneeNames;
    private List<SubtaskDTO> subtasks;
    private LocalDate postponedToDate;
    private LocalDate postponedFromDate;
    private Boolean isPostponed;
}

