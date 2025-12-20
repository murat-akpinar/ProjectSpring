package com.projectspring.dto;

import com.projectspring.model.enums.TaskStatus;
import com.projectspring.model.enums.TaskType;
import com.projectspring.model.enums.Priority;
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
    private TaskType taskType;
    private Priority priority;
    private Long teamId;
    private String teamName;
    private String teamColor;
    private String teamIcon;
    private Long projectId;
    private String projectName;
    private Long createdById;
    private String createdByName;
    private Set<Long> assigneeIds;
    private List<String> assigneeNames;
    private List<SubtaskDTO> subtasks;
    private LocalDate postponedToDate;
    private LocalDate postponedFromDate;
    private Boolean isPostponed;
}

