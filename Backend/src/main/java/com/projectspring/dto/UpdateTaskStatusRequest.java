package com.projectspring.dto;

import com.projectspring.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskStatusRequest {
    @NotNull(message = "Status is required")
    private TaskStatus status;
    
    private String changeReason;
    
    private LocalDate postponedToDate; // Ertelendi durumunda yeni tarih
}

