import React from 'react';
import { Task } from '../../types/Task';
import { getStatusColor, getStatusLabel } from '../../utils/statusColors';
import { formatDate } from '../../utils/dateUtils';
import { getDay, parseISO } from 'date-fns';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const statusColor = getStatusColor(task.status);
  const statusLabel = getStatusLabel(task.status);
  
  const getPriorityIcon = (priority?: string): string => {
    switch (priority) {
      case 'URGENT':
        return '🔴';
      case 'HIGH':
        return '🟠';
      default:
        return '⚪';
    }
  };
  
  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'URGENT':
        return '#f38ba8';
      case 'HIGH':
        return '#fab387';
      default:
        return '#6c7086';
    }
  };
  
  // Hafta sonu kontrolü
  const taskStart = parseISO(task.startDate);
  const taskEnd = parseISO(task.endDate);
  const hasWeekend = (() => {
    let current = new Date(taskStart);
    while (current <= taskEnd) {
      const dayOfWeek = getDay(current);
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  })();

  return (
    <div
      className={`task-card ${hasWeekend ? 'has-weekend' : ''}`}
      style={{ 
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
        borderLeftColor: getPriorityColor(task.priority),
      }}
      onClick={onClick}
    >
      <div className="task-header">
        <div className="task-title-row">
          <span className="priority-icon">{getPriorityIcon(task.priority)}</span>
          <div className="task-title">{task.title}</div>
        </div>
        <div
          className="task-status-badge"
          style={{ backgroundColor: statusColor, color: 'white' }}
        >
          {statusLabel}
        </div>
      </div>
      {task.content && (
        <div className="task-content">{task.content.substring(0, 100)}...</div>
      )}
      <div className="task-meta">
        <div>
          {formatDate(task.startDate)} - {formatDate(task.endDate)}
        </div>
        {task.isPostponed && task.postponedToDate && (
          <div className="postponed-info">
            <span className="postponed-badge">Ertelendi</span>
            <span>Yeni Tarih: {formatDate(task.postponedToDate)}</span>
          </div>
        )}
      </div>
      {task.assigneeNames && task.assigneeNames.length > 0 && (
        <div className="task-assignees">
          Atanan: {task.assigneeNames.join(', ')}
        </div>
      )}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="task-subtasks">
          Alt işler: {task.subtasks.length} (
          {task.subtasks.filter((s) => s.isCompleted).length} tamamlandı)
        </div>
      )}
    </div>
  );
};

export default TaskCard;

