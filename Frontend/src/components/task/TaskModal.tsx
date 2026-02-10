import React, { useState, useEffect } from 'react';
import { Task, CreateTaskRequest, CreateSubtaskRequest, TaskStatus, TaskType, Priority, UpdateTaskStatusRequest } from '../../types/Task';
import { Team } from '../../types/Team';
import { User } from '../../types/User';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { Project } from '../../types/Project';
import { getStatusLabel } from '../../utils/statusColors';
import './TaskModal.css';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  task?: Task | null;
  defaultTeamId?: number;
  defaultProjectId?: number;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  defaultTeamId,
  defaultProjectId,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    content: '',
    startDate: defaultStartDate || new Date().toISOString().split('T')[0],
    endDate: defaultEndDate || new Date().toISOString().split('T')[0],
    status: TaskStatus.OPEN,
    taskType: TaskType.TASK,
    priority: Priority.NORMAL,
    teamId: defaultTeamId || 0,
    projectId: undefined,
    assigneeIds: [],
    subtasks: [],
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (task) {
        setFormData({
          title: task.title,
          content: task.content || '',
          startDate: task.startDate,
          endDate: task.endDate,
          status: task.status,
          taskType: task.taskType || TaskType.TASK,
          priority: task.priority || Priority.NORMAL,
          teamId: task.teamId,
          projectId: task.projectId,
          assigneeIds: task.assigneeIds || [],
          subtasks: task.subtasks?.map(s => ({
            title: s.title,
            content: s.content || '',
            startDate: s.startDate || '',
            endDate: s.endDate || '',
            assigneeId: s.assigneeId,
          })) || [],
        });
      } else {
        setFormData({
          title: '',
          content: '',
          startDate: defaultStartDate || new Date().toISOString().split('T')[0],
          endDate: defaultEndDate || new Date().toISOString().split('T')[0],
          status: TaskStatus.OPEN,
          taskType: TaskType.TASK,
          priority: Priority.NORMAL,
          teamId: defaultTeamId || 0,
          projectId: defaultProjectId,
          assigneeIds: [],
          subtasks: [],
        });
      }
    }
  }, [isOpen, task, defaultTeamId, defaultStartDate, defaultEndDate]);

  const loadData = async () => {
    try {
      const [teamsData, usersData, projectsData] = await Promise.all([
        teamService.getAllTeams(),
        userService.getAllUsers(),
        projectService.getAllProjects(),
      ]);
      setTeams(teamsData);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.teamId) {
      alert('Başlık ve Ekip seçimi zorunludur');
      return;
    }

    try {
      setLoading(true);
      if (task) {
        // Check if arrays are equal (assigneeIds)
        const assigneeIdsEqual = JSON.stringify((task.assigneeIds || []).sort()) === JSON.stringify((formData.assigneeIds || []).sort());

        // Check if subtasks are equal (simplified - just count and titles)
        const subtasksEqual = (task.subtasks || []).length === (formData.subtasks || []).length &&
          (task.subtasks || []).every((st, idx) => {
            const newSt = (formData.subtasks || [])[idx];
            return st.title === newSt?.title && st.content === newSt?.content;
          });

        // If only status is changing, use updateTaskStatus
        const onlyStatusChanged = task.status !== formData.status &&
          task.title === formData.title &&
          (task.content || '') === (formData.content || '') &&
          task.startDate === formData.startDate &&
          task.endDate === formData.endDate &&
          (task.taskType || TaskType.TASK) === (formData.taskType || TaskType.TASK) &&
          (task.priority || Priority.NORMAL) === (formData.priority || Priority.NORMAL) &&
          task.teamId === formData.teamId &&
          task.projectId === formData.projectId &&
          assigneeIdsEqual &&
          subtasksEqual;

        if (onlyStatusChanged) {
          const statusUpdate: UpdateTaskStatusRequest = {
            status: formData.status!,
            changeReason: 'Status updated from task modal'
          };
          await taskService.updateTaskStatus(task.id, statusUpdate);
        } else {
          await taskService.updateTask(task.id, formData);
        }
      } else {
        await taskService.createTask(formData);
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'İş kaydedilemedi';
      alert(`İş kaydedilemedi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [...(formData.subtasks || []), {
        title: '',
        content: '',
        startDate: formData.startDate,
        endDate: formData.endDate,
      }],
    });
  };

  const removeSubtask = (index: number) => {
    const newSubtasks = [...(formData.subtasks || [])];
    newSubtasks.splice(index, 1);
    setFormData({ ...formData, subtasks: newSubtasks });
  };

  const updateSubtask = (index: number, field: keyof CreateSubtaskRequest, value: string | number | undefined) => {
    const newSubtasks = [...(formData.subtasks || [])];
    newSubtasks[index] = { ...newSubtasks[index], [field]: value };
    setFormData({ ...formData, subtasks: newSubtasks });
  };

  if (!isOpen) return null;

  return (
    <div className="task-modal modal-overlay" onClick={onClose}>
      <div className="task-modal-content modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'İş Düzenle' : 'Yeni İş Oluştur'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Başlık *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>İçerik</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Başlangıç Tarihi *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Bitiş Tarihi *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ekip *</label>
              <select
                value={formData.teamId}
                onChange={(e) => {
                  const newTeamId = parseInt(e.target.value);
                  setFormData({ ...formData, teamId: newTeamId, projectId: undefined });
                }}
                required
              >
                <option value={0}>Ekip Seçin</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Proje</label>
              <select
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">Proje Seçin (Opsiyonel)</option>
                {projects
                  .filter(project => formData.teamId && project.teamIds.includes(formData.teamId))
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Durum</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                {Object.values(TaskStatus).map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>İş Türü</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value as TaskType })}
              >
                <option value={TaskType.TASK}>Görev</option>
                <option value={TaskType.FEATURE}>Özellik</option>
                <option value={TaskType.BUG}>Hata</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Önem</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
              >
                <option value={Priority.NORMAL}>Normal</option>
                <option value={Priority.HIGH}>Yüksek</option>
                <option value={Priority.URGENT}>Acil</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Atanan Kişiler</label>
            <div className="checkbox-group">
              {users.map((user) => (
                <label key={user.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.assigneeIds?.includes(user.id) || false}
                    onChange={(e) => {
                      const currentIds = formData.assigneeIds || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, assigneeIds: [...currentIds, user.id] });
                      } else {
                        setFormData({
                          ...formData,
                          assigneeIds: currentIds.filter((id) => id !== user.id),
                        });
                      }
                    }}
                  />
                  {user.fullName}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="subtasks-header">
              <label>Alt İşler</label>
              <button type="button" onClick={addSubtask} className="btn-add-subtask">
                + Alt İş Ekle
              </button>
            </div>
            <div className="subtasks-container">
              {formData.subtasks?.map((subtask, index) => (
                <div key={index} className="subtask-item">
                  <input
                    type="text"
                    placeholder="Alt iş başlığı"
                    value={subtask.title}
                    onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                  />
                  <textarea
                    placeholder="Alt iş içeriği (opsiyonel)"
                    value={subtask.content || ''}
                    onChange={(e) => updateSubtask(index, 'content', e.target.value)}
                    rows={2}
                  />
                  <div className="form-row" style={{ marginTop: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label style={{ fontSize: '12px', marginBottom: '3px' }}>Başlangıç Tarihi</label>
                      <input
                        type="date"
                        value={subtask.startDate || ''}
                        onChange={(e) => updateSubtask(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label style={{ fontSize: '12px', marginBottom: '3px' }}>Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={subtask.endDate || ''}
                        onChange={(e) => updateSubtask(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '8px', marginBottom: '0' }}>
                    <label style={{ fontSize: '12px', marginBottom: '3px' }}>Atanan Kişi</label>
                    <select
                      value={subtask.assigneeId || ''}
                      onChange={(e) => updateSubtask(index, 'assigneeId', e.target.value ? parseInt(e.target.value) : undefined)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '14px' }}
                    >
                      <option value="">Atanan Kişi Seçin</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubtask(index)}
                    className="btn-remove-subtask"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              İptal
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Kaydediliyor...' : task ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

