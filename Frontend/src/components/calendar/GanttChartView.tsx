import React, { useMemo, useState } from 'react';
import { Task, TaskType, TaskStatus } from '../../types/Task';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, parseISO, isSameMonth, addWeeks, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getStatusColor, getStatusLabel } from '../../utils/statusColors';
import './GanttChartView.css';

interface GanttChartViewProps {
  tasks: Task[];
  month: number;
  year: number;
  selectedWeek?: number;
  weeksInMonth?: number;
  onTaskClick?: (task: Task) => void;
}

const GanttChartView: React.FC<GanttChartViewProps> = ({ 
  tasks, 
  month, 
  year, 
  selectedWeek,
  weeksInMonth,
  onTaskClick 
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  
  // Hafta seçimi varsa sadece o haftayı göster
  let calendarStart: Date;
  let calendarEnd: Date;
  
  if (selectedWeek && selectedWeek > 0 && weeksInMonth) {
    const firstWeekStart = startOfWeek(monthStart, { locale: tr, weekStartsOn: 1 });
    const weekStart = addWeeks(firstWeekStart, selectedWeek - 1);
    calendarStart = weekStart;
    calendarEnd = endOfWeek(weekStart, { locale: tr, weekStartsOn: 1 });
  } else {
    calendarStart = startOfWeek(monthStart, { locale: tr, weekStartsOn: 1 });
    calendarEnd = endOfWeek(monthEnd, { locale: tr, weekStartsOn: 1 });
  }
  
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
        return '#94e2d5'; // Teal (daha açık yeşil)
      case TaskType.BUG:
        return '#eba0ac'; // Maroon (daha açık kırmızı)
      default:
        return '#89dceb'; // Sky (daha açık mavi)
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
        return '#eba0ac'; // Maroon (daha açık kırmızı)
      case 'HIGH':
        return '#f2cdcd'; // Flamingo (daha açık turuncu)
      default:
        return '#7f849c'; // Overlay1 (daha açık gri)
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
    taskStart.setHours(0, 0, 0, 0);
    const taskEnd = parseISO(task.endDate);
    taskEnd.setHours(23, 59, 59, 999);
    
    // Timeline'ın başlangıç ve bitiş tarihleri
    const timelineStart = new Date(days[0]);
    timelineStart.setHours(0, 0, 0, 0);
    const timelineEnd = new Date(days[days.length - 1]);
    timelineEnd.setHours(23, 59, 59, 999);
    
    // Task timeline ile kesişiyor mu kontrol et
    if (taskEnd < timelineStart || taskStart > timelineEnd) {
      // Task timeline ile kesişmiyor, görünmez
      return { left: 0, width: 0, startIndex: -1, endIndex: -1, isVisible: false };
    }
    
    let startIndex = -1;
    let endIndex = -1;
    
    days.forEach((day, index) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Task bu günde başlıyor mu?
      if (startIndex === -1 && taskStart <= dayEnd && taskStart >= dayStart) {
        startIndex = index;
      }
      // Task bu günde bitiyor mu?
      if (taskEnd >= dayStart && taskEnd <= dayEnd) {
        endIndex = index;
      }
    });
    
    // Eğer task timeline'dan önce başlıyorsa, timeline'ın başından başlat
    if (startIndex === -1 && taskStart < timelineStart) {
      startIndex = 0;
    }
    // Eğer task timeline'dan sonra bitiyorsa, timeline'ın sonuna kadar göster
    if (endIndex === -1 && taskEnd > timelineEnd) {
      endIndex = days.length - 1;
    }
    
    // Eğer hala bulunamadıysa, task timeline ile kesişmiyor demektir
    if (startIndex === -1 || endIndex === -1) {
      return { left: 0, width: 0, startIndex: -1, endIndex: -1, isVisible: false };
    }
    
    // Her günün genişliği eşit olduğu için, index bazlı hesaplama
    const cellWidth = 100 / days.length;
    const left = startIndex * cellWidth;
    const width = (endIndex - startIndex + 1) * cellWidth;
    
    return { left, width, startIndex, endIndex, isVisible: true };
  };
  
  const isToday = (day: Date): boolean => {
    const today = new Date();
    return format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };
  
  const isWeekend = (day: Date): boolean => {
    const dayOfWeek = getDay(day);
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Pazar, 6 = Cumartesi
  };
  
  const getPriorityIcon = (priority?: string): string => {
    switch (priority) {
      case 'URGENT':
        return '🔴'; // Kırmızı daire
      case 'HIGH':
        return '🟠'; // Turuncu daire
      default:
        return '⚪'; // Beyaz daire (Normal)
    }
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
              const isWeekendDay = isWeekend(day);
              
              return (
                <div
                  key={index}
                  className={`timeline-day-header ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDay ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''}`}
                >
                  <div className="day-number">{format(day, 'd')}</div>
                  <div className="day-name">{format(day, 'EEE', { locale: tr })}</div>
                </div>
              );
            })}
          </div>
          
          <div className="gantt-timeline-body">
            {organizedTasks.map(({ task, level, isSubtask }) => {
              const { left, width, isVisible } = getTaskBarPosition(task);
              const typeColor = getTaskTypeColor(task.taskType);
              const isMilestone = width < 2; // Çok kısa task'lar milestone olarak göster
              
              // Task görünür değilse render etme
              if (!isVisible) {
                return null;
              }
              
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
                      const isWeekendDay = isWeekend(day);
                      
                      return (
                        <div
                          key={index}
                          className={`timeline-cell ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDay ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''}`}
                        >
                          {isTodayDay && (
                            <div className="today-indicator" />
                          )}
                        </div>
                      );
                    })}
                    {/* Task bar'ı container içinde absolute positioning ile yerleştir */}
                    <div
                      className={isMilestone ? 'gantt-milestone' : 'gantt-bar'}
                      style={{
                        left: `${left}%`,
                        width: isMilestone ? 'auto' : `${width}%`,
                        backgroundColor: typeColor,
                        borderLeft: `3px solid ${getPriorityColor(task.priority)}`,
                        borderTop: `2px solid ${getStatusColor(task.status)}`,
                      }}
                      onClick={() => onTaskClick?.(task)}
                      title={`${task.title} - ${format(parseISO(task.startDate), 'dd.MM.yyyy')} - ${format(parseISO(task.endDate), 'dd.MM.yyyy')}`}
                    >
                      {!isMilestone && (
                        <div className="gantt-bar-content">
                          <span className="priority-icon-small">{getPriorityIcon(task.priority)}</span>
                          <div className="gantt-bar-title">{task.title}</div>
                        </div>
                      )}
                    </div>
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

