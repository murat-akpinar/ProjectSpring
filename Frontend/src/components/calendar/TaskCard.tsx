import React from 'react';
import { Task } from '../../types/Task';
import { getStatusColor, getStatusLabel } from '../../utils/statusColors';
import { formatDate } from '../../utils/dateUtils';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const statusColor = getStatusColor(task.status);
  const statusLabel = getStatusLabel(task.status);

  return (
    <div
      className="task-card"
      style={{ borderLeftColor: statusColor }}
      onClick={onClick}
    >
      <div className="task-header">
        <div className="task-title">{task.title}</div>
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

