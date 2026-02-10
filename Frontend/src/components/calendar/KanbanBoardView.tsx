import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../../types/Task';
import { getStatusColor } from '../../utils/statusColors';
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

  // Dashboard.jpeg'deki gibi 4 kolon
  const columns: { status: TaskStatus; label: string; icon: string }[] = [
    { status: TaskStatus.OPEN, label: 'Backlog', icon: '|' },
    { status: TaskStatus.IN_PROGRESS, label: 'Devam Eden', icon: '|' },
    { status: TaskStatus.POSTPONED, label: 'İnceleme', icon: '|' },
    { status: TaskStatus.COMPLETED, label: 'Tamamlanan', icon: '|' },
  ];

  // Diğer durumları da hesaba kat (CANCELLED, OVERDUE -> Backlog'a ekle)
  const getColumnForStatus = (status: TaskStatus): TaskStatus => {
    switch (status) {
      case TaskStatus.CANCELLED:
      case TaskStatus.OVERDUE:
        return TaskStatus.OPEN;
      default:
        return status;
    }
  };

  // Task'ları status'e göre grupla
  const tasksByColumn = columns.reduce((acc, column) => {
    acc[column.status] = tasks.filter((task) => getColumnForStatus(task.status) === column.status);
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

  // getEasyBadge artık kullanılmıyor - priority değerini direkt kullanıyoruz
  const getEasyBadge = (_task: Task): { label: string; color: string } | null => {
    return null;
  };

  // Gün hesaplama
  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Progress hesaplama - useMemo ile sabit değer (her render'da değişmez)
  const progressMap = useMemo(() => {
    const map: Record<number, number> = {};
    tasks.forEach((task) => {
      if (task.status === TaskStatus.COMPLETED) {
        map[task.id] = 100;
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        if (task.subtasks && task.subtasks.length > 0) {
          const completed = task.subtasks.filter(s => s.isCompleted).length;
          map[task.id] = Math.round((completed / task.subtasks.length) * 100);
        } else {
          // Başlangıç ve bitiş tarihleri arasındaki ilerleme
          const start = new Date(task.startDate).getTime();
          const end = new Date(task.endDate).getTime();
          const now = Date.now();
          if (now >= end) map[task.id] = 95;
          else if (now <= start) map[task.id] = 10;
          else map[task.id] = Math.round(((now - start) / (end - start)) * 100);
        }
      } else if (task.status === TaskStatus.POSTPONED) {
        // Ertelenen işlerde tarih bazlı ilerleme
        const start = new Date(task.startDate).getTime();
        const end = new Date(task.endDate).getTime();
        const now = Date.now();
        if (now >= end) map[task.id] = 60;
        else if (now <= start) map[task.id] = 20;
        else map[task.id] = Math.round(((now - start) / (end - start)) * 70);
      } else {
        // Açık görevler için 0
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
              <h3 className="kanban-column-title">{column.label}</h3>
              <span className="kanban-column-count">{columnTasks.length}</span>
              <span className="kanban-column-menu">⋮</span>
            </div>
            <div className="kanban-column-content">
              {columnTasks.length === 0 ? (
                <div className="kanban-empty-state">
                  {isDropTarget ? '📥 Buraya bırak' : 'Bu kolonda görev yok'}
                </div>
              ) : (
                columnTasks.map((task) => {
                  const difficulty = getDifficultyBadge(task.priority);
                  const easyBadge = getEasyBadge(task);
                  const finalBadge = easyBadge || difficulty;
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
                            backgroundColor: finalBadge.color + '20',
                            color: finalBadge.color,
                            borderColor: finalBadge.color
                          }}
                        >
                          {finalBadge.label}
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
