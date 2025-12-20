import React from 'react';
import { Task } from '../../types/Task';
import TaskCard from './TaskCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import './CalendarView.css';

interface CalendarViewProps {
  tasks: Task[];
  month: number;
  year: number;
  onTaskClick?: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, month, year, onTaskClick }) => {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { locale: tr });
  const calendarEnd = endOfWeek(monthEnd, { locale: tr });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  
  const getTasksForDay = (day: Date): Task[] => {
    return tasks.filter((task) => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return taskStart <= day && taskEnd >= day;
    });
  };

  return (
    <div className="calendar-view">
      <div className="calendar-grid">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonthDay = isSameMonth(day, monthStart);
          const isTodayDay = isToday(day);
          const dayOfWeek = getDay(day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Pazar, 6 = Cumartesi
          
          return (
            <div
              key={index}
              className={`calendar-day ${!isCurrentMonthDay ? 'other-month' : ''} ${isTodayDay ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
            >
              <div className="calendar-day-number">{format(day, 'd')}</div>
              <div className="calendar-day-tasks">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;

