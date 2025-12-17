import React, { useMemo } from 'react';
import { Task } from '../../types/Task';
import { User } from '../../types/User';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, parseISO, addWeeks, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getStatusColor } from '../../utils/statusColors';
import './TeamPlannerView.css';

interface TeamPlannerViewProps {
  tasks: Task[];
  users: User[];
  month: number;
  year: number;
  selectedWeek: number;
  onTaskClick?: (task: Task) => void;
}

const TeamPlannerView: React.FC<TeamPlannerViewProps> = ({ 
  tasks, 
  users, 
  month, 
  year, 
  selectedWeek,
  onTaskClick 
}) => {
  // Seçilen haftayı hesapla
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const weekStart = addWeeks(startOfWeek(monthStart, { locale: tr, weekStartsOn: 1 }), selectedWeek - 1);
  const weekEnd = endOfWeek(weekStart, { locale: tr, weekStartsOn: 1 });
  
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Atanan kişileri al (tasks'lerden)
  const assignees = useMemo(() => {
    const assigneeSet = new Set<User>();
    tasks.forEach(task => {
      if (task.assigneeIds && task.assigneeNames) {
        task.assigneeIds.forEach((id, index) => {
          const existingUser = users.find(u => u.id === id);
          if (existingUser) {
            assigneeSet.add(existingUser);
          } else {
            // Eğer user listesinde yoksa, task'ten bilgileri al
            assigneeSet.add({
              id,
              username: '',
              email: '',
              fullName: task.assigneeNames[index] || 'Bilinmeyen',
              roles: [],
              teamIds: []
            });
          }
        });
      }
    });
    return Array.from(assigneeSet);
  }, [tasks, users]);
  
  // Her gün için işleri al
  const getTasksForDay = (day: Date, assigneeId: number): Task[] => {
    return tasks.filter(task => {
      if (!task.assigneeIds?.includes(assigneeId)) return false;
      const taskStart = parseISO(task.startDate);
      const taskEnd = parseISO(task.endDate);
      return isWithinInterval(day, { start: taskStart, end: taskEnd });
    });
  };
  
  // Task'ın kaç gün sürdüğünü hesapla ve hangi günlerde görüneceğini belirle
  const getTaskSpanDays = (task: Task): number[] => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.endDate);
    const days: number[] = [];
    
    weekDays.forEach((day, index) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      if (taskStart <= dayEnd && taskEnd >= dayStart) {
        days.push(index);
      }
    });
    
    return days;
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getTaskTypeColor = (taskType?: string): string => {
    switch (taskType) {
      case 'FEATURE':
        return '#a6e3a1'; // Green
      case 'BUG':
        return '#f38ba8'; // Red
      default:
        return '#89b4fa'; // Blue
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
  
  return (
    <div className="team-planner-view">
      <div className="team-planner-grid">
        {/* Header row */}
        <div className="planner-header-cell assignee-header">Atanan</div>
        {weekDays.map((day, index) => (
          <div key={index} className="planner-header-cell day-header">
            <div className="day-number">{format(day, 'd')}</div>
            <div className="day-name">{format(day, 'EEE', { locale: tr })}</div>
          </div>
        ))}
        
        {/* Assignee rows */}
        {assignees.length === 0 ? (
          <div className="planner-empty-message">
            Bu hafta için atanan kişi bulunmuyor
          </div>
        ) : (
          assignees.map((assignee) => (
            <React.Fragment key={assignee.id}>
              {/* Assignee name cell */}
              <div className="planner-assignee-cell">
                <div className="assignee-avatar">
                  {getInitials(assignee.fullName)}
                </div>
                <div className="assignee-name">{assignee.fullName}</div>
              </div>
              
              {/* Task cells for each day */}
              {weekDays.map((day, dayIndex) => {
                const dayTasks = getTasksForDay(day, assignee.id);
                // Her task için hangi günlerde görüneceğini hesapla
                const tasksWithSpan = dayTasks.map(task => ({
                  task,
                  spanDays: getTaskSpanDays(task),
                  firstDay: getTaskSpanDays(task)[0],
                  lastDay: getTaskSpanDays(task)[getTaskSpanDays(task).length - 1],
                }));
                
                // Sadece bu günde başlayan task'ları göster
                const tasksStartingToday = tasksWithSpan.filter(t => t.firstDay === dayIndex);
                
                return (
                  <div key={dayIndex} className="planner-task-cell">
                    {tasksStartingToday.map(({ task, spanDays }) => {
                      const statusColor = getStatusColor(task.status);
                      const typeColor = getTaskTypeColor(task.taskType);
                      const priorityColor = getPriorityColor(task.priority);
                      const spanWidth = spanDays.length * 100;
                      
                      return (
                        <div
                          key={task.id}
                          className="task-bar"
                          style={{
                            left: '0%',
                            width: `${spanWidth}%`,
                            backgroundColor: typeColor,
                            borderLeft: `3px solid ${priorityColor}`,
                            borderTop: `2px solid ${statusColor}`,
                          }}
                          onClick={() => onTaskClick?.(task)}
                          title={`${task.title} - ${task.status}`}
                        >
                          <div className="task-bar-title">{task.title}</div>
                          {task.taskType && (
                            <div className="task-bar-type">
                              {task.taskType === 'FEATURE' ? 'Özellik' : 
                               task.taskType === 'BUG' ? 'Hata' : 'Görev'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamPlannerView;

