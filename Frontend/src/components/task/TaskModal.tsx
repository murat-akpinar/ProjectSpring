import React, { useState, useEffect } from 'react';
import { Task, CreateTaskRequest, CreateSubtaskRequest, TaskStatus } from '../../types/Task';
import { Team } from '../../types/Team';
import { User } from '../../types/User';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';
import { userService } from '../../services/userService';
import { getStatusLabel } from '../../utils/statusColors';
import './TaskModal.css';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  task?: Task | null;
  defaultTeamId?: number;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  defaultTeamId,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    content: '',
    startDate: defaultStartDate || new Date().toISOString().split('T')[0],
    endDate: defaultEndDate || new Date().toISOString().split('T')[0],
    status: TaskStatus.OPEN,
    teamId: defaultTeamId || 0,
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
          teamId: task.teamId,
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
          teamId: defaultTeamId || 0,
          assigneeIds: [],
          subtasks: [],
        });
      }
    }
  }, [isOpen, task, defaultTeamId, defaultStartDate, defaultEndDate]);

  const loadData = async () => {
    try {
      const [teamsData, usersData] = await Promise.all([
        teamService.getAllTeams(),
        userService.getAllUsers(),
      ]);
      setTeams(teamsData);
      setUsers(usersData);
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
        await taskService.updateTask(task.id, formData);
      } else {
        await taskService.createTask(formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('İş kaydedilemedi');
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                onChange={(e) => setFormData({ ...formData, teamId: parseInt(e.target.value) })}
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

