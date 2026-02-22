import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Team } from '../../types/Team';
import TeamModal from './TeamModal';
import './TeamManagement.css';

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      const data = await adminService.getAllTeams();
      console.log('Fetched teams:', data);
      setTeams(data);
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      const status = error.response?.status;
      if (status === 401) {
        // Token invalid or expired
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Oturum açmanız gerekiyor. Lütfen giriş yapın.');
        } else {
          alert('Oturumunuz sona ermiş veya geçersiz. Lütfen tekrar giriş yapın.');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        alert('Bu işlem için yetkiniz yok. Sadece yöneticiler (ADMIN rolü) erişebilir.');
      } else {
        alert('Birimler yüklenemedi: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTeam(null);
    setShowModal(true);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu birimi silmek istediğinizden emin misiniz?')) {
      try {
        await adminService.deleteTeam(id);
        fetchTeams();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Birim silinemedi');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTeam(null);
    fetchTeams();
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="team-management">
      <div className="team-management-header">
        <h2>Birim Yönetimi</h2>
        <button className="btn-create" onClick={handleCreate}>
          Yeni Birim
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="empty-state">
          <p>Henüz birim bulunmamaktadır.</p>
        </div>
      ) : (
        <table className="teams-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Birim Adı</th>
              <th>Açıklama</th>
              <th>Lider</th>
              <th>Renk</th>
              <th>İkon</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>{team.id}</td>
                <td>{team.name}</td>
                <td>{team.description || '-'}</td>
                <td>{team.leaderName || '-'}</td>
                <td>
                  {team.color && (
                    <span
                      className="color-badge"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.color}
                    </span>
                  )}
                </td>
                <td>{team.icon || '-'}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(team)}>
                    Düzenle
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(team.id)}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <TeamModal
          team={editingTeam}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default TeamManagement;

