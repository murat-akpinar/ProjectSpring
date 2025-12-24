import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import GanttChartView from '../components/calendar/GanttChartView';
import TaskModal from '../components/task/TaskModal';
import { Project } from '../types/Project';
import { Task, TaskStatus } from '../types/Task';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { formatDate } from '../utils/dateUtils';
import { getWeeksInMonth } from '../utils/dateUtils';
import '../App.css';
import './ProjectDetailPage.css';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (id) {
      fetchProjectAndTasks();
    }
  }, [id, selectedYear, selectedMonth, selectedTeamId]);

  const fetchProjectAndTasks = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        projectService.getProjectById(parseInt(id)),
        taskService.getTasks(selectedTeamId || undefined, selectedYear, selectedMonth, parseInt(id)),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      alert('Proje yüklenemedi.');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
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
    fetchProjectAndTasks();
  };

  const getProjectStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return '#89b4fa'; // Blue
      case 'COMPLETED':
        return '#a6e3a1'; // Green
      case 'ON_HOLD':
        return '#f9e2af'; // Yellow
      case 'CANCELLED':
        return '#9399b2'; // Overlay1
      default:
        return '#6c7086'; // Overlay0
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.OPEN:
        return '#89b4fa'; // Blue
      case TaskStatus.IN_PROGRESS:
        return '#f9e2af'; // Yellow
      case TaskStatus.COMPLETED:
        return '#a6e3a1'; // Green
      case TaskStatus.OVERDUE:
        return '#f38ba8'; // Red
      case TaskStatus.POSTPONED:
        return '#9399b2'; // Overlay1
      case TaskStatus.CANCELLED:
        return '#6c7086'; // Overlay0
      default:
        return '#6c7086';
    }
  };

  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.OPEN:
        return 'Açık';
      case TaskStatus.IN_PROGRESS:
        return 'Yapılıyor';
      case TaskStatus.COMPLETED:
        return 'Tamamlandı';
      case TaskStatus.OVERDUE:
        return 'Yetişmeyen';
      case TaskStatus.POSTPONED:
        return 'Ertelendi';
      case TaskStatus.CANCELLED:
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  // Calculate status distribution
  const statusCounts = tasks.reduce((acc, task) => {
    const status = task.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as TaskStatus,
    count: count as number,
    label: getStatusLabel(status as TaskStatus),
    color: getStatusColor(status as TaskStatus),
  }));

  const maxCount = Math.max(...statusData.map(s => s.count), 1);

  const weeksInMonth = getWeeksInMonth(selectedMonth, selectedYear);

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar selectedTeamId={selectedTeamId} onTeamSelect={setSelectedTeamId} />
        <div className="main-content">
          <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
          <div className="content-area">
            <div className="loading">Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const handleTeamSelect = (teamId: number | null) => {
    setSelectedTeamId(teamId);
    // Proje detay sayfasındayken ekip değiştiğinde projeler listesine dön
    navigate('/projects');
  };

  return (
    <div className="app-container">
      <Sidebar 
        selectedTeamId={selectedTeamId} 
        onTeamSelect={handleTeamSelect}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
        <div className="content-area">
          <div className="project-detail-container">
            {/* Header */}
            <div className="project-detail-header">
              <button className="btn-back" onClick={() => navigate('/projects')}>
                ← Projelere Dön
              </button>
              <div className="project-detail-title-section">
                <h1>{project.name}</h1>
                <div className="project-detail-meta">
                  <span className="project-status-badge" style={{ backgroundColor: getProjectStatusColor(project.status) }}>
                    {project.status === 'ACTIVE' ? 'Aktif' : 
                     project.status === 'COMPLETED' ? 'Tamamlandı' :
                     project.status === 'ON_HOLD' ? 'Beklemede' :
                     project.status === 'CANCELLED' ? 'İptal Edildi' : project.status}
                  </span>
                  {project.startDate && project.endDate && (
                    <span className="project-dates">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn-create-task" onClick={handleCreateTask}>
                + Yeni İş
              </button>
            </div>

            {project.description && (
              <div className="project-description">
                <p>{project.description}</p>
              </div>
            )}

            {/* Status Chart + Project Plan - Side by Side */}
            <div className="status-and-plan-container">
              {/* Left: Status Chart - Vertical Bar Chart */}
              {statusData.length > 0 && (
                <div className="status-chart-section">
                  <h2>Durum</h2>
                  <div className="status-chart-vertical">
                    <div className="status-chart-bars-vertical">
                      {statusData.map((item) => (
                        <div key={item.status} className="status-bar-vertical">
                          <div className="status-bar-value-vertical">{item.count}</div>
                          <div className="status-bar-wrapper-vertical">
                            <div
                              className="status-bar-fill-vertical"
                              style={{
                                height: `${(item.count / maxCount) * 100}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                          <div className="status-bar-label-vertical">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Right: Project Plan Table */}
              <div className="project-plan-section">
                <div className="project-plan-header">
                  <h2>Proje Planı</h2>
                </div>
                
                <div className="tasks-table-container">
                  <table className="tasks-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>KONU</th>
                        <th>TÜR</th>
                        <th>DURUM</th>
                        <th>ATANAN</th>
                        <th>ÖNEM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-tasks">
                            Henüz iş eklenmemiş
                          </td>
                        </tr>
                      ) : (
                        tasks.map((task) => (
                          <tr 
                            key={task.id} 
                            className="task-row"
                            onClick={() => handleTaskClick(task)}
                          >
                            <td>{task.id}</td>
                            <td className="task-subject">{task.title}</td>
                            <td>
                              <span className={`task-type-badge task-type-${task.taskType?.toLowerCase() || 'task'}`}>
                                {task.taskType === 'TASK' ? 'GÖREV' : 
                                 task.taskType === 'FEATURE' ? 'ÖZELLİK' : 
                                 task.taskType === 'BUG' ? 'HATA' : 'GÖREV'}
                              </span>
                            </td>
                            <td>
                              <span 
                                className="task-status-badge"
                                style={{ backgroundColor: getStatusColor(task.status) }}
                              >
                                {getStatusLabel(task.status)}
                              </span>
                            </td>
                            <td>
                              {task.assigneeNames && task.assigneeNames.length > 0 ? (
                                <div className="task-assignees">
                                  {task.assigneeNames.map((name, idx) => (
                                    <span key={idx} className="assignee-name">{name}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="no-assignee">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`priority-badge priority-${task.priority?.toLowerCase() || 'normal'}`}>
                                {task.priority === 'NORMAL' ? 'Normal' : 
                                 task.priority === 'HIGH' ? 'Yüksek' : 
                                 task.priority === 'URGENT' ? 'Acil' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Gantt Chart - Full Width Below */}
            <div className="gantt-section">
              <div className="gantt-header">
                <h2>İş Planı</h2>
                <div className="gantt-controls">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="month-select"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(selectedYear, month - 1).toLocaleDateString('tr-TR', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                    className="week-select"
                  >
                    <option value={0}>Tüm Ay</option>
                    {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => (
                      <option key={week} value={week}>
                        {week}. Hafta
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="gantt-chart-container-full">
                <GanttChartView
                  tasks={tasks}
                  month={selectedMonth}
                  year={selectedYear}
                  selectedWeek={selectedWeek}
                  weeksInMonth={weeksInMonth}
                  onTaskClick={handleTaskClick}
                />
              </div>
            </div>
          </div>
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
        defaultProjectId={project.id}
      />
    </div>
  );
};

export default ProjectDetailPage;

