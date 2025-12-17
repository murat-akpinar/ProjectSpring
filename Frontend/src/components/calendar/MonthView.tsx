import React from 'react';
import { Task } from '../../types/Task';
import { getMonthName } from '../../utils/dateUtils';
import './MonthView.css';

interface MonthViewProps {
  tasks: Task[];
  onMonthClick: (month: number) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ tasks, onMonthClick }) => {
  const getTaskCountForMonth = (month: number) => {
    return tasks.filter(
      (task) => new Date(task.startDate).getMonth() + 1 === month
    ).length;
  };

  const getStatusCountForMonth = (month: number, status: string) => {
    return tasks.filter(
      (task) =>
        new Date(task.startDate).getMonth() + 1 === month &&
        task.status === status
    ).length;
  };

  return (
    <div className="month-grid">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const taskCount = getTaskCountForMonth(month);
        const openCount = getStatusCountForMonth(month, 'OPEN');
        const inProgressCount = getStatusCountForMonth(month, 'IN_PROGRESS');
        const completedCount = getStatusCountForMonth(month, 'COMPLETED');

        return (
          <div
            key={month}
            className="month-card"
            onClick={() => onMonthClick(month)}
          >
            <div className="month-name">{getMonthName(month)}</div>
            <div className="month-stats">
              <div className="stat-item">
                <span>Toplam:</span>
                <strong>{taskCount}</strong>
              </div>
              <div className="stat-item">
                <span>Açık:</span>
                <strong>{openCount}</strong>
              </div>
              <div className="stat-item">
                <span>Devam:</span>
                <strong>{inProgressCount}</strong>
              </div>
              <div className="stat-item">
                <span>Tamam:</span>
                <strong>{completedCount}</strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthView;

