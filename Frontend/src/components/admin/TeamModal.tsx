import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Team } from '../../types/Team';
import { User } from '../../types/User';
import { CreateTeamRequest, UpdateTeamRequest } from '../../types/Admin';
import './TeamModal.css';

interface TeamModalProps {
  team: Team | null;
  onClose: () => void;
}

const TeamModal: React.FC<TeamModalProps> = ({ team, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: null as number | null,
    color: '',
    icon: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        leaderId: team.leaderId || null,
        color: team.color || '',
        icon: team.icon || '',
      });
    }
  }, [team]);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (team) {
        const updateRequest: UpdateTeamRequest = {
          name: formData.name,
          description: formData.description,
          leaderId: formData.leaderId || undefined,
          color: formData.color,
          icon: formData.icon,
        };
        await adminService.updateTeam(team.id, updateRequest);
      } else {
        const createRequest: CreateTeamRequest = {
          name: formData.name,
          description: formData.description,
          leaderId: formData.leaderId || undefined,
          color: formData.color,
          icon: formData.icon,
        };
        await adminService.createTeam(createRequest);
      }
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İşlem başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{team ? 'Takım Düzenle' : 'Yeni Takım'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="team-form">
          <div className="form-group">
            <label>Takım Adı *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Takım Lideri</label>
            <select
              value={formData.leaderId || ''}
              onChange={(e) => setFormData({ ...formData, leaderId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Seçiniz</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.username})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Renk (Hex)</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#RRGGBB"
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>

          <div className="form-group">
            <label>İkon</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="emoji veya icon adı"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              İptal
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamModal;

