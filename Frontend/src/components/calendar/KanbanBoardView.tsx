import React from 'react';
import { Task, TaskStatus } from '../../types/Task';
import { formatDate } from '../../utils/dateUtils';
import { getStatusColor } from '../../utils/statusColors';
import './KanbanBoardView.css';

interface KanbanBoardViewProps {
  tasks: Task[];
  month: number;
  year: number;
  onTaskClick?: (task: Task) => void;
}

const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  tasks,
  onTaskClick,
}) => {
  // Status'lere göre kolonlar
  const columns: { status: TaskStatus; label: string }[] = [
    { status: TaskStatus.OPEN, label: 'Yeni' },
    { status: TaskStatus.IN_PROGRESS, label: 'Yapılıyor' },
    { status: TaskStatus.COMPLETED, label: 'Tamamlandı' },
    { status: TaskStatus.CANCELLED, label: 'İptal Edildi' },
    { status: TaskStatus.POSTPONED, label: 'Ertelendi' },
    { status: TaskStatus.OVERDUE, label: 'Yetişmedi' },
  ];

  // Task'ları status'e göre grupla
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.status] = tasks.filter((task) => task.status === column.status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const getTaskTypeLabel = (taskType?: string): string => {
    switch (taskType) {
      case 'FEATURE':
        return 'ÖZELLİK';
      case 'BUG':
        return 'HATA';
      default:
        return 'GÖREV';
    }
  };

  const getTaskTypeColor = (taskType?: string): string => {
    switch (taskType) {
      case 'FEATURE':
        return '#94e2d5'; // Teal
      case 'BUG':
        return '#ff5e6c'; // Coral Pink
      default:
        return '#ffaaab'; // Pink Leaf
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="kanban-board-view">
      {columns.map((column) => {
        const columnTasks = tasksByStatus[column.status] || [];
        const statusColor = getStatusColor(column.status);

        return (
          <div key={column.status} className="kanban-column">
            <div className="kanban-column-header">
              <div
                className="kanban-column-indicator"
                style={{ backgroundColor: statusColor }}
              />
              <h3 className="kanban-column-title">{column.label}</h3>
              <span className="kanban-column-count">{columnTasks.length}</span>
            </div>
            <div className="kanban-column-content">
              {columnTasks.length === 0 ? (
                <div className="kanban-empty-state">Bu kolonda görev yok</div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="kanban-card"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="kanban-card-header">
                      <span
                        className="kanban-card-type"
                        style={{ color: getTaskTypeColor(task.taskType) }}
                      >
                        {getTaskTypeLabel(task.taskType)}
                      </span>
                    </div>
                    <div className="kanban-card-title">{task.title}</div>
                    {task.content && (
                      <div className="kanban-card-content">
                        {task.content.substring(0, 100)}
                        {task.content.length > 100 ? '...' : ''}
                      </div>
                    )}
                    <div className="kanban-card-footer">
                      <div className="kanban-card-assignee">
                        {task.assigneeNames && task.assigneeNames.length > 0 ? (
                          <>
                            <div className="kanban-card-avatar">
                              {getInitials(task.assigneeNames[0])}
                            </div>
                            <span className="kanban-card-assignee-name">
                              {task.assigneeNames[0]}
                            </span>
                          </>
                        ) : (
                          <span className="kanban-card-no-assignee">Atanan yok</span>
                        )}
                      </div>
                      <div className="kanban-card-id">#{task.id}</div>
                    </div>
                    <div className="kanban-card-dates">
                      {formatDate(task.startDate)} - {formatDate(task.endDate)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoardView;

