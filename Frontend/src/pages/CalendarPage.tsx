import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MonthView from '../components/calendar/MonthView';
import CalendarView from '../components/calendar/CalendarView';
import TeamPlannerView from '../components/calendar/TeamPlannerView';
import TaskModal from '../components/task/TaskModal';
import { Task } from '../types/Task';
import { User } from '../types/User';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { getMonthName, getWeeksInMonth } from '../utils/dateUtils';
import '../App.css';

type ViewMode = 'calendar' | 'planner';

const CalendarPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksData, usersData] = await Promise.all([
          taskService.getTasks(selectedTeamId || undefined, selectedYear),
          userService.getAllUsers(),
        ]);
        setTasks(tasksData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedTeamId]);

  // Reset month view when team changes
  useEffect(() => {
    setSelectedMonth(null);
    setSelectedWeek(1);
  }, [selectedTeamId]);
  
  // Calculate weeks in selected month
  const weeksInMonth = selectedMonth 
    ? getWeeksInMonth(selectedMonth, selectedYear)
    : 0;

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <h2 className="week-title">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </h2>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--ctp-surface0)',
                      backgroundColor: 'var(--ctp-surface0)',
                      color: 'var(--ctp-text)',
                      fontFamily: "'Cascadia Mono', monospace",
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => (
                      <option key={week} value={week}>
                        {week}. Hafta
                      </option>
                    ))}
                  </select>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as ViewMode)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--ctp-surface0)',
                      backgroundColor: 'var(--ctp-surface0)',
                      color: 'var(--ctp-text)',
                      fontFamily: "'Cascadia Mono', monospace",
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="calendar">Takvim Görünümü</option>
                    <option value="planner">Ekip Planlayıcı</option>
                  </select>
                </div>
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
                        backgroundColor: 'var(--ctp-blue)',
                        color: 'var(--ctp-base)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        fontFamily: "'Cascadia Mono', monospace"
                      }}
                    >
                      + Yeni İş
                    </button>
                  </div>
                  {viewMode === 'calendar' ? (
                    <CalendarView 
                      tasks={filteredTasks} 
                      month={selectedMonth} 
                      year={selectedYear}
                      onTaskClick={handleTaskClick} 
                    />
                  ) : (
                    <TeamPlannerView
                      tasks={filteredTasks}
                      users={users}
                      month={selectedMonth}
                      year={selectedYear}
                      selectedWeek={selectedWeek}
                      onTaskClick={handleTaskClick}
                    />
                  )}
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
                  selectedYear={selectedYear}
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

