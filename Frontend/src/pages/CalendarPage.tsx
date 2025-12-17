import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MonthView from '../components/calendar/MonthView';
import WeekView from '../components/calendar/WeekView';
import TaskModal from '../components/task/TaskModal';
import { Task } from '../types/Task';
import { taskService } from '../services/taskService';
import { getMonthName } from '../utils/dateUtils';
import '../App.css';

const CalendarPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskService.getTasks(selectedTeamId || undefined, selectedYear);
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedYear, selectedTeamId]);

  // Reset month view when team changes
  useEffect(() => {
    setSelectedMonth(null);
  }, [selectedTeamId]);

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
  };

  const handleBackToMonths = () => {
    setSelectedMonth(null);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSaved = () => {
    // Refresh tasks
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskService.getTasks(selectedTeamId || undefined, selectedYear);
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  };

  const filteredTasks = selectedMonth
    ? tasks.filter((task) => new Date(task.startDate).getMonth() + 1 === selectedMonth)
    : tasks;

  return (
    <div className="app-container">
      <Sidebar selectedTeamId={selectedTeamId} onTeamSelect={setSelectedTeamId} />
      <div className="main-content">
        <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
        <div className="content-area">
          {selectedMonth ? (
            <div className="week-container">
              <div className="week-header">
                <h2 className="week-title">
                  {getMonthName(selectedMonth)} {selectedYear}
                </h2>
                <button className="back-button" onClick={handleBackToMonths}>
                  Aylara Dön
                </button>
              </div>
              {loading ? (
                <div>Yükleniyor...</div>
              ) : (
                <>
                  <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                    <button 
                      onClick={handleCreateTask}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      + Yeni İş
                    </button>
                  </div>
                  <WeekView tasks={filteredTasks} onTaskClick={handleTaskClick} />
                </>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                <h1 style={{ margin: 0 }}>
                  {selectedYear} Yılı - Aylık Görünüm
                </h1>
                <button 
                  onClick={handleCreateTask}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  + Yeni İş
                </button>
              </div>
              {loading ? (
                <div>Yükleniyor...</div>
              ) : (
                <MonthView
                  tasks={tasks}
                  onMonthClick={handleMonthClick}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSaved}
        task={selectedTask}
        defaultTeamId={selectedTeamId || undefined}
      />
    </div>
  );
};

export default CalendarPage;

