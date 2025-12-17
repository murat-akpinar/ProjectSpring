import React, { useMemo, useState } from 'react';
import { Task, TaskType, TaskStatus } from '../../types/Task';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO, isSameMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getStatusColor, getStatusLabel } from '../../utils/statusColors';
import './GanttChartView.css';

interface GanttChartViewProps {
  tasks: Task[];
  month: number;
  year: number;
  onTaskClick?: (task: Task) => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ 
  tasks, 
  month, 
  year, 
  onTaskClick 
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { locale: tr, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: tr, weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Task'ları hiyerarşik olarak düzenle (subtask'lar parent'ın altında)
  const organizedTasks = useMemo(() => {
    const parentTasks = tasks.filter(t => !t.subtasks || t.subtasks.length === 0);
    const tasksWithSubtasks = tasks.filter(t => t.subtasks && t.subtasks.length > 0);
    
    const result: Array<{ task: Task; level: number; isSubtask: boolean }> = [];
    
    tasksWithSubtasks.forEach(parent => {
      result.push({ task: parent, level: 0, isSubtask: false });
      if (expandedTasks.has(parent.id)) {
        parent.subtasks?.forEach(subtask => {
          // Subtask'ı Task formatına dönüştür
          const subtaskAsTask: Task = {
            id: subtask.id || 0,
            title: subtask.title,
            content: subtask.content,
            startDate: subtask.startDate || parent.startDate,
            endDate: subtask.endDate || parent.endDate,
            status: subtask.isCompleted ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
            taskType: parent.taskType,
            priority: parent.priority,
            teamId: parent.teamId,
            teamName: parent.teamName,
            createdById: parent.createdById,
            createdByName: parent.createdByName,
            assigneeIds: subtask.assigneeId ? [subtask.assigneeId] : [],
            assigneeNames: subtask.assigneeName ? [subtask.assigneeName] : [],
            subtasks: [],
            postponedToDate: undefined,
            postponedFromDate: undefined,
            isPostponed: false,
          };
          result.push({ task: subtaskAsTask, level: 1, isSubtask: true });
        });
      }
    });
    
    parentTasks.forEach(task => {
      if (!tasksWithSubtasks.find(t => t.id === task.id)) {
        result.push({ task, level: 0, isSubtask: false });
      }
    });
    
    return result;
  }, [tasks, expandedTasks]);
  
  const toggleExpand = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };
  
  const getTaskTypeLabel = (type?: TaskType): string => {
    switch (type) {
      case TaskType.FEATURE:
        return 'ÖZELLİK';
      case TaskType.BUG:
        return 'HATA';
      default:
        return 'GÖREV';
    }
  };
  
  const getTaskTypeColor = (type?: TaskType): string => {
    switch (type) {
      case TaskType.FEATURE:
        return '#a6e3a1'; // Green
      case TaskType.BUG:
        return '#f38ba8'; // Red
      default:
        return '#89b4fa'; // Blue
    }
  };
  
  const getPriorityLabel = (priority?: string): string => {
    switch (priority) {
      case 'HIGH':
        return 'Yüksek';
      case 'URGENT':
        return 'Acil';
      default:
        return 'Normal';
    }
  };
  
  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'URGENT':
        return '#f38ba8'; // Red
      case 'HIGH':
        return '#fab387'; // Peach
      default:
        return '#6c7086'; // Overlay0
    }
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Task'ın timeline'da nerede başlayıp nerede bittiğini hesapla
  const getTaskBarPosition = (task: Task) => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.endDate);
    
    let startIndex = -1;
    let endIndex = -1;
    
    days.forEach((day, index) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      if (startIndex === -1 && taskStart <= dayEnd && taskStart >= dayStart) {
        startIndex = index;
      }
      if (taskEnd >= dayStart && taskEnd <= dayEnd) {
        endIndex = index;
      }
    });
    
    if (startIndex === -1) startIndex = 0;
    if (endIndex === -1) endIndex = days.length - 1;
    
    const left = (startIndex / days.length) * 100;
    const width = ((endIndex - startIndex + 1) / days.length) * 100;
    
    return { left, width, startIndex, endIndex };
  };
  
  const isToday = (day: Date): boolean => {
    const today = new Date();
    return format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };
  
  const daysCount = days.length;
  
  return (
    <div className="gantt-chart-view" style={{ '--days-count': daysCount } as React.CSSProperties}>
      <div className="gantt-container">
        {/* Sol Panel - Task Listesi */}
        <div className="gantt-left-panel">
          <div className="gantt-table-header">
            <div className="gantt-col-subject">Konu</div>
            <div className="gantt-col-type">Tür</div>
            <div className="gantt-col-status">Durum</div>
            <div className="gantt-col-priority">Önem</div>
            <div className="gantt-col-assignee">Atanan</div>
          </div>
          <div className="gantt-table-body">
            {organizedTasks.map(({ task, level, isSubtask }) => {
              const hasSubtasks = task.subtasks && task.subtasks.length > 0;
              const isExpanded = expandedTasks.has(task.id);
              
              return (
                <div
                  key={task.id}
                  className={`gantt-table-row ${isSubtask ? 'subtask-row' : ''}`}
                  style={{ paddingLeft: `${level * 20 + 10}px` }}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="gantt-col-subject">
                    {hasSubtasks && (
                      <button
                        className="expand-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(task.id);
                        }}
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    )}
                    <span className="task-title">{task.title}</span>
                  </div>
                  <div className="gantt-col-type">
                    <span
                      className="type-badge"
                      style={{ backgroundColor: getTaskTypeColor(task.taskType) }}
                    >
                      {getTaskTypeLabel(task.taskType)}
                    </span>
                  </div>
                  <div className="gantt-col-status">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    />
                    {getStatusLabel(task.status)}
                  </div>
                  <div className="gantt-col-priority">
                    <span
                      className="priority-dot"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    />
                    {getPriorityLabel(task.priority)}
                  </div>
                  <div className="gantt-col-assignee">
                    {task.assigneeNames && task.assigneeNames.length > 0 ? (
                      <div className="assignee-info">
                        <div className="assignee-avatar-small">
                          {getInitials(task.assigneeNames[0])}
                        </div>
                        <span>{task.assigneeNames[0]}</span>
                      </div>
                    ) : (
                      <span className="no-assignee">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Sağ Panel - Timeline/Gantt Chart */}
        <div className="gantt-right-panel">
          <div className="gantt-timeline-header">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDay = isToday(day);
              
              return (
                <div
                  key={index}
                  className={`timeline-day-header ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDay ? 'today' : ''}`}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  <div className="day-name">{format(day, 'EEE', { locale: tr })}</div>
                </div>
              );
            })}
          </div>
          
          <div className="gantt-timeline-body">
            {organizedTasks.map(({ task, level, isSubtask }) => {
              const { width, startIndex, endIndex } = getTaskBarPosition(task);
              const typeColor = getTaskTypeColor(task.taskType);
              const isMilestone = width < 2; // Çok kısa task'lar milestone olarak göster
              
              return (
                <div
                  key={task.id}
                  className={`gantt-timeline-row ${isSubtask ? 'subtask-row' : ''}`}
                  style={{ paddingLeft: `${level * 20}px` }}
                >
                  <div className="timeline-bars-container">
                    {days.map((day, index) => {
                      const isCurrentMonth = isSameMonth(day, monthStart);
                      const isTodayDay = isToday(day);
                      const isInRange = index >= startIndex && index <= endIndex;
                      
                      return (
                        <div
                          key={index}
                          className={`timeline-cell ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDay ? 'today' : ''}`}
                        >
                          {isInRange && index === startIndex && (
                            <div
                              className={isMilestone ? 'gantt-milestone' : 'gantt-bar'}
                              style={{
                                left: '0',
                                width: isMilestone ? 'auto' : `calc(${width}% - 2px)`,
                                backgroundColor: typeColor,
                                borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                                borderTop: `2px solid ${getStatusColor(task.status)}`,
                              }}
                              onClick={() => onTaskClick?.(task)}
                              title={`${task.title} - ${format(parseISO(task.startDate), 'dd.MM.yyyy')} - ${format(parseISO(task.endDate), 'dd.MM.yyyy')}`}
                            >
                              {!isMilestone && (
                                <div className="gantt-bar-content">
                                  <div className="gantt-bar-title">{task.title}</div>
                                </div>
                              )}
                            </div>
                          )}
                          {isTodayDay && (
                            <div className="today-indicator" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChartView;

