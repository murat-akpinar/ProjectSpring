package com.projectspring.dto;

import com.projectspring.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTaskRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String content;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    private TaskStatus status = TaskStatus.OPEN;
    
    @NotNull(message = "Team ID is required")
    private Long teamId;
    
    private Set<Long> assigneeIds;
    
    private List<CreateSubtaskRequest> subtasks;
}

