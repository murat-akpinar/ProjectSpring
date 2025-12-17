package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubtaskRequest {
    private String title;
    private String content;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long assigneeId;
}

