package com.projectspring.controller;

import com.projectspring.dto.CalendarViewDTO;
import com.projectspring.dto.TaskDTO;
import com.projectspring.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "*")
public class CalendarController {
    
    @Autowired
    private TaskService taskService;
    
    @GetMapping("/{year}")
    public ResponseEntity<CalendarViewDTO> getCalendarByYear(
            @PathVariable int year,
            @RequestParam(required = false) Long teamId) {
        
        List<TaskDTO> tasks = taskService.getTasks(teamId, year, null);
        
        CalendarViewDTO dto = new CalendarViewDTO();
        dto.setYear(year);
        
        // Group by month
        Map<Integer, List<TaskDTO>> tasksByMonth = new HashMap<>();
        for (int month = 1; month <= 12; month++) {
            final int m = month;
            List<TaskDTO> monthTasks = tasks.stream()
                .filter(t -> t.getStartDate().getMonthValue() == m)
                .collect(Collectors.toList());
            tasksByMonth.put(month, monthTasks);
        }
        dto.setTasksByMonth(tasksByMonth);
        
        // Group by week
        Map<String, List<TaskDTO>> tasksByWeek = new HashMap<>();
        for (TaskDTO task : tasks) {
            String weekKey = getWeekKey(task.getStartDate());
            tasksByWeek.computeIfAbsent(weekKey, k -> new ArrayList<>()).add(task);
        }
        dto.setTasksByWeek(tasksByWeek);
        
        return ResponseEntity.ok(dto);
    }
    
    @GetMapping("/{year}/{month}")
    public ResponseEntity<Map<String, List<TaskDTO>>> getCalendarByMonth(
            @PathVariable int year,
            @PathVariable int month,
            @RequestParam(required = false) Long teamId) {
        
        List<TaskDTO> tasks = taskService.getTasks(teamId, year, month);
        
        Map<String, List<TaskDTO>> tasksByWeek = new HashMap<>();
        for (TaskDTO task : tasks) {
            String weekKey = getWeekKey(task.getStartDate());
            tasksByWeek.computeIfAbsent(weekKey, k -> new ArrayList<>()).add(task);
        }
        
        return ResponseEntity.ok(tasksByWeek);
    }
    
    private String getWeekKey(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();
        
        // Calculate week number in month
        LocalDate firstDayOfMonth = LocalDate.of(year, month, 1);
        int dayOfWeek = firstDayOfMonth.getDayOfWeek().getValue();
        int weekNumber = ((day + dayOfWeek - 1) / 7) + 1;
        
        return String.format("%d-%02d-W%02d", year, month, weekNumber);
    }
}

