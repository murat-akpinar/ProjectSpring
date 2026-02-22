import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../../types/Task';
import { getStatusColor, getStatusLabel } from '../../utils/statusColors';
import './KanbanBoardView.css';

interface KanbanBoardViewProps {
  tasks: Task[];
  month: number;
  year: number;
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
}

const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Tüm iş durumlarını Kanban sütunu olarak göster
  const columns: { status: TaskStatus; label: string; icon: string }[] = [
    { status: TaskStatus.OPEN, label: getStatusLabel(TaskStatus.OPEN), icon: '📋' },
    { status: TaskStatus.IN_PROGRESS, label: getStatusLabel(TaskStatus.IN_PROGRESS), icon: '🔄' },
    { status: TaskStatus.TESTING, label: getStatusLabel(TaskStatus.TESTING), icon: '🧪' },
    { status: TaskStatus.COMPLETED, label: getStatusLabel(TaskStatus.COMPLETED), icon: '✅' },
    { status: TaskStatus.POSTPONED, label: getStatusLabel(TaskStatus.POSTPONED), icon: '⏸️' },
    { status: TaskStatus.CANCELLED, label: getStatusLabel(TaskStatus.CANCELLED), icon: '❌' },
    { status: TaskStatus.OVERDUE, label: getStatusLabel(TaskStatus.OVERDUE), icon: '⚠️' },
  ];

  // Task'ları status'e göre direkt grupla (artık mapping yok)
  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.status] = tasks.filter((task) => task.status === column.status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Priority'ye göre önem etiketi (Türkçe)
  const getDifficultyBadge = (priority?: Priority): { label: string; color: string } => {
    switch (priority) {
      case Priority.URGENT:
        return { label: 'Acil', color: '#f38ba8' };
      case Priority.HIGH:
        return { label: 'Yüksek', color: '#fab387' };
      case Priority.NORMAL:
      default:
        return { label: 'Normal', color: '#a6e3a1' };
    }
  };

  // Gün hesaplama
  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Progress hesaplama
  const progressMap = useMemo(() => {
    const map: Record<number, number> = {};
    tasks.forEach((task) => {
      if (task.status === TaskStatus.COMPLETED) {
        map[task.id] = 100;
      } else if (task.status === TaskStatus.TESTING) {
        // Test aşamasında olan işler %80-95 arası
        if (task.subtasks && task.subtasks.length > 0) {
          const completed = task.subtasks.filter(s => s.isCompleted).length;
          map[task.id] = Math.max(80, Math.round((completed / task.subtasks.length) * 100));
        } else {
          map[task.id] = 85;
        }
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        if (task.subtasks && task.subtasks.length > 0) {
          const completed = task.subtasks.filter(s => s.isCompleted).length;
          map[task.id] = Math.round((completed / task.subtasks.length) * 100);
        } else {
          const start = new Date(task.startDate).getTime();
          const end = new Date(task.endDate).getTime();
          const now = Date.now();
          if (now >= end) map[task.id] = 95;
          else if (now <= start) map[task.id] = 10;
          else map[task.id] = Math.round(((now - start) / (end - start)) * 100);
        }
      } else if (task.status === TaskStatus.POSTPONED) {
        const start = new Date(task.startDate).getTime();
        const end = new Date(task.endDate).getTime();
        const now = Date.now();
        if (now >= end) map[task.id] = 60;
        else if (now <= start) map[task.id] = 20;
        else map[task.id] = Math.round(((now - start) / (end - start)) * 70);
      } else {
        map[task.id] = 0;
      }
    });
    return map;
  }, [tasks]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId.toString());
    (e.target as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    (e.target as HTMLElement).classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));

    if (taskId && onStatusChange) {
      onStatusChange(taskId, newStatus);
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="kanban-board-view kanban-light-theme">
      {columns.map((column) => {
        const columnTasks = tasksByColumn[column.status] || [];
        const statusColor = getStatusColor(column.status);
        const isDropTarget = dragOverColumn === column.status;

        return (
          <div
            key={column.status}
            className={`kanban-column ${isDropTarget ? 'drop-target' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="kanban-column-header">
              <span className="kanban-column-indicator" style={{ backgroundColor: statusColor }}></span>
              <span className="kanban-column-icon">{column.icon}</span>
              <h3 className="kanban-column-title">{column.label}</h3>
              <span className="kanban-column-count">{columnTasks.length}</span>
            </div>
            <div className="kanban-column-content">
              {columnTasks.length === 0 ? (
                <div className="kanban-empty-state">
                  {isDropTarget ? '📥 Buraya bırak' : 'Bu kolonda görev yok'}
                </div>
              ) : (
                columnTasks.map((task) => {
                  const difficulty = getDifficultyBadge(task.priority);
                  const daysRemaining = getDaysRemaining(task.endDate);
                  const progress = progressMap[task.id] ?? 0;
                  const isDragging = draggedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick?.(task)}
                    >
                      {/* Drag Handle */}
                      <div className="kanban-card-drag-handle">⋮⋮</div>

                      {/* Badges Row */}
                      <div className="kanban-card-badges">
                        <span
                          className="kanban-badge difficulty"
                          style={{
                            backgroundColor: difficulty.color + '20',
                            color: difficulty.color,
                            borderColor: difficulty.color
                          }}
                        >
                          {difficulty.label}
                        </span>
                        <span className="kanban-badge days">
                          <span className="days-icon">⏱</span>
                          {daysRemaining} Gün
                        </span>
                      </div>

                      {/* Title */}
                      <div className="kanban-card-title">{task.title}</div>

                      {/* Progress Bar */}
                      <div className="kanban-progress-container">
                        <div className="kanban-progress-bar">
                          <div
                            className="kanban-progress-fill"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: progress === 100 ? '#a6e3a1' : '#89b4fa'
                            }}
                          ></div>
                        </div>
                        <span className="kanban-progress-text">{progress}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoardView;
