import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MonthView from '../components/calendar/MonthView';
import CalendarView from '../components/calendar/CalendarView';
import GanttChartView from '../components/calendar/GanttChartView';
import KanbanBoardView from '../components/calendar/KanbanBoardView';
import TaskModal from '../components/task/TaskModal';
import { Task } from '../types/Task';
import { Project } from '../types/Project';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { getMonthName, getWeeksInMonth } from '../utils/dateUtils';
import { useSidebar } from '../hooks/useSidebar';
import '../App.css';

type ViewMode = 'calendar' | 'gantt' | 'kanban';

const CalendarPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isCollapsed, toggleSidebar } = useSidebar();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const data = await taskService.getTasks(selectedTeamId || undefined, selectedYear, undefined, selectedProjectId || undefined);
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedYear, selectedTeamId, selectedProjectId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  // Reset month view when team changes
  useEffect(() => {
    setSelectedMonth(null);
    setSelectedWeek(0);
    setViewMode('calendar');
    setSelectedProjectId(null);
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

  // Task'ları filtrele: startDate veya endDate seçilen ay içinde olmalı
  const filteredTasks = selectedMonth
    ? tasks.filter((task) => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const taskStartMonth = taskStart.getMonth() + 1;
        const taskEndMonth = taskEnd.getMonth() + 1;
        // Task'ın startDate'i veya endDate'i seçilen ay içinde olmalı
        return taskStartMonth === selectedMonth || taskEndMonth === selectedMonth;
      })
    : tasks;

  return (
    <div className="app-container">
      <Sidebar 
        selectedTeamId={selectedTeamId} 
        onTeamSelect={setSelectedTeamId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
        <div className="content-area">
          {selectedMonth ? (
            <div className="week-container">
              <div className="week-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  <h2 className="week-title">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </h2>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
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
                    <option value="">Tüm Projeler</option>
                    {projects
                      .filter(project => !selectedTeamId || project.teamIds.includes(selectedTeamId))
                      .map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                  {viewMode === 'gantt' && (
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
                      <option value={0}>Tüm Ay</option>
                      {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => (
                        <option key={week} value={week}>
                          {week}. Hafta
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="view-mode-buttons">
                    <button
                      className={`view-mode-button ${viewMode === 'calendar' ? 'active' : ''}`}
                      onClick={() => setViewMode('calendar')}
                    >
                      Takvim Görünümü
                    </button>
                    <button
                      className={`view-mode-button ${viewMode === 'gantt' ? 'active' : ''}`}
                      onClick={() => setViewMode('gantt')}
                    >
                      Gantt Chart
                    </button>
                    <button
                      className={`view-mode-button ${viewMode === 'kanban' ? 'active' : ''}`}
                      onClick={() => setViewMode('kanban')}
                    >
                      Kanban Board
                    </button>
                  </div>
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
                  ) : viewMode === 'gantt' ? (
                    <GanttChartView
                      tasks={filteredTasks}
                      month={selectedMonth}
                      year={selectedYear}
                      selectedWeek={selectedWeek}
                      weeksInMonth={weeksInMonth}
                      onTaskClick={handleTaskClick}
                    />
                  ) : (
                    <KanbanBoardView
                      tasks={filteredTasks}
                      month={selectedMonth}
                      year={selectedYear}
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

