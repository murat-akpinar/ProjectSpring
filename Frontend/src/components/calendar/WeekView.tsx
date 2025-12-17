import React from 'react';
import { Task } from '../../types/Task';
import TaskCard from './TaskCard';
import './WeekView.css';

interface WeekViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ tasks, onTaskClick }) => {
  // Group tasks by week
  const tasksByWeek: Record<string, Task[]> = {};
  
  tasks.forEach((task) => {
    const date = new Date(task.startDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const week = Math.ceil(date.getDate() / 7);
    const weekKey = `${year}-${month.toString().padStart(2, '0')}-W${week.toString().padStart(2, '0')}`;
    
    if (!tasksByWeek[weekKey]) {
      tasksByWeek[weekKey] = [];
    }
    tasksByWeek[weekKey].push(task);
  });

  return (
    <div className="weeks-grid">
      {Object.entries(tasksByWeek).map(([weekKey, weekTasks]) => (
        <div key={weekKey} className="week-card">
          <div className="week-label">{weekKey}</div>
          {weekTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default WeekView;

