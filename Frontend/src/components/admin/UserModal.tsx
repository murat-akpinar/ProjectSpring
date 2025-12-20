import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User } from '../../types/User';
import { Team } from '../../types/Team';
import { CreateUserRequest, UpdateUserRequest, Role } from '../../types/Admin';
import './UserModal.css';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    roleIds: [] as number[],
    teamIds: [] as number[],
    isAdmin: false,
    isActive: true,
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        password: '',
        roleIds: [], // Will be populated from roles
        teamIds: Array.from(user.teamIds),
        isAdmin: user.roles.includes('ADMIN'),
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [rolesData, teamsData] = await Promise.all([
        adminService.getAllRoles(),
        adminService.getAllTeams(),
      ]);
      setRoles(rolesData);
      setTeams(teamsData);

      if (user && user.roles) {
        const userRoleIds = rolesData
          .filter(role => user.roles.includes(role.name))
          .map(role => role.id);
        setFormData(prev => ({ ...prev, roleIds: userRoleIds }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        const updateRequest: UpdateUserRequest = {
          fullName: formData.fullName,
          email: formData.email,
          roleIds: formData.roleIds,
          teamIds: formData.teamIds,
          isAdmin: formData.isAdmin,
          isActive: formData.isActive,
        };
        await adminService.updateUser(user.id, updateRequest);
      } else {
        const createRequest: CreateUserRequest = {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          roleIds: formData.roleIds,
          teamIds: formData.teamIds,
          isAdmin: formData.isAdmin,
        };
        await adminService.createUser(createRequest);
      }
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İşlem başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleTeamToggle = (teamId: number) => {
    setFormData(prev => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId)
        ? prev.teamIds.filter(id => id !== teamId)
        : [...prev.teamIds, teamId],
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          {!user && (
            <>
              <div className="form-group">
                <label>Kullanıcı Adı *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Parola *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>İsim Soyisim *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Roller</label>
            <div className="checkbox-group">
              {roles.map((role) => (
                <label key={role.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Takımlar</label>
            <div className="checkbox-group">
              {teams.map((team) => (
                <label key={team.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.teamIds.includes(team.id)}
                    onChange={() => handleTeamToggle(team.id)}
                  />
                  {team.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              />
              Yönetici (ADMIN)
            </label>
          </div>

          {user && (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Aktif
              </label>
            </div>
          )}

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

export default UserModal;

