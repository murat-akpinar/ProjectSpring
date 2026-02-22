import React, { useState, useEffect } from 'react';
import { Project, CreateProjectRequest, ProjectStatus } from '../../types/Project';
import { Team } from '../../types/Team';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import './ProjectModal.css';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  project?: Project | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: ProjectStatus.ACTIVE,
    teamIds: [],
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (project) {
        setFormData({
          name: project.name,
          description: project.description || '',
          startDate: project.startDate || '',
          endDate: project.endDate || '',
          status: project.status,
          teamIds: project.teamIds || [],
        });
      } else {
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          status: ProjectStatus.ACTIVE,
          teamIds: [],
        });
      }
    }
  }, [isOpen, project]);

  const loadData = async () => {
    try {
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare request data - convert empty strings to undefined for optional fields
      const requestData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        startDate: formData.startDate?.trim() || undefined,
        endDate: formData.endDate?.trim() || undefined,
        status: formData.status,
        teamIds: formData.teamIds && formData.teamIds.length > 0 ? formData.teamIds : undefined,
      };

      // Validate required fields
      if (!requestData.name || requestData.name.length === 0) {
        alert('Proje adı zorunludur.');
        setLoading(false);
        return;
      }

      // En az bir ekip zorunlu
      if (!requestData.teamIds || requestData.teamIds.length === 0) {
        alert('En az bir birim seçilmelidir.');
        setLoading(false);
        return;
      }

      if (project) {
        await projectService.updateProject(project.id, requestData);
      } else {
        await projectService.createProject(requestData);
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save project:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Proje kaydedilemedi. Lütfen tekrar deneyin.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: number) => {
    const currentTeamIds = formData.teamIds || [];
    if (currentTeamIds.includes(teamId)) {
      setFormData({
        ...formData,
        teamIds: currentTeamIds.filter(id => id !== teamId),
      });
    } else {
      setFormData({
        ...formData,
        teamIds: [...currentTeamIds, teamId],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Proje Düzenle' : 'Yeni Proje'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Proje Adı *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Başlangıç Tarihi</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Bitiş Tarihi</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className="form-input"
            >
              <option value={ProjectStatus.ACTIVE}>Aktif</option>
              <option value={ProjectStatus.COMPLETED}>Tamamlandı</option>
              <option value={ProjectStatus.ON_HOLD}>Beklemede</option>
              <option value={ProjectStatus.CANCELLED}>İptal Edildi</option>
            </select>
          </div>

          <div className="form-group">
            <label>Birimler *</label>
            <div className="team-checkboxes">
              {teams.map((team) => (
                <label key={team.id} className="team-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.teamIds?.includes(team.id) || false}
                    onChange={() => handleTeamToggle(team.id)}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {team.icon && (
                      <span style={{ color: team.color || 'var(--ctp-text)' }}>
                        {team.icon}
                      </span>
                    )}
                    {team.color && !team.icon && (
                      <span
                        style={{
                          backgroundColor: team.color,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          display: 'inline-block'
                        }}
                      />
                    )}
                    {team.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              İptal
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;

