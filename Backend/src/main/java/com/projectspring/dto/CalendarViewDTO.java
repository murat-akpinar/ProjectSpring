package com.projectspring.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarViewDTO {
    private int year;
    private Map<Integer, List<TaskDTO>> tasksByMonth; // month -> tasks
    private Map<String, List<TaskDTO>> tasksByWeek;  // "YYYY-MM-WW" -> tasks
}

