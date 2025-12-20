import React, { useEffect, useState } from 'react';
import { DashboardDetails } from '../../types/Dashboard';
import { dashboardService } from '../../services/dashboardService';
import './TeamDashboard.css';

interface TeamDashboardProps {
  teamId?: number;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ teamId }) => {
  const [details, setDetails] = useState<DashboardDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = teamId
          ? await dashboardService.getTeamDashboardDetails(teamId)
          : await dashboardService.getAllTeamsDashboardDetails();
        setDetails(data);
      } catch (error) {
        console.error('Failed to fetch dashboard details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [teamId]);

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!details || !details.stats) {
    return <div className="error">Veri yüklenemedi</div>;
  }

  const stats = details.stats;

  return (
    <div className="dashboard-container-full">
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card open">
          <div className="stat-label">Açık İşler</div>
          <div className="stat-value">{stats.totalOpen}</div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-label">Devam Eden İşler</div>
          <div className="stat-value">{stats.totalInProgress}</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-label">Tamamlanan İşler</div>
          <div className="stat-value">{stats.totalCompleted}</div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-label">Yetişmeyen İşler</div>
          <div className="stat-value">{stats.totalOverdue}</div>
        </div>
        <div className="stat-card postponed">
          <div className="stat-label">Ertelenen İşler</div>
          <div className="stat-value">{stats.totalPostponed}</div>
        </div>
        <div className="stat-card cancelled">
          <div className="stat-label">İptal Edilen İşler</div>
          <div className="stat-value">{stats.totalCancelled}</div>
        </div>
      </div>

      {/* Leaderboard and Team Members Section */}
      <div className="dashboard-details-section">
        {/* Leaderboards */}
        <div className="leaderboards-container">
          <div className="leaderboard-card">
            <h3 className="leaderboard-title">🏆 En Çok İş Tamamlayanlar</h3>
            {details.topCompleters && details.topCompleters.length > 0 ? (
              <ul className="leaderboard-list">
                {details.topCompleters.map((user, index) => (
                  <li key={user.userId} className="leaderboard-item">
                    <span className="leaderboard-rank">{index + 1}.</span>
                    <span className="leaderboard-name">{user.userName}</span>
                    <span className="leaderboard-count">{user.count} iş</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-leaderboard">Henüz veri yok</div>
            )}
          </div>

          <div className="leaderboard-card">
            <h3 className="leaderboard-title">⏸️ En Çok İş Erteleyenler</h3>
            {details.topPostponers && details.topPostponers.length > 0 ? (
              <ul className="leaderboard-list">
                {details.topPostponers.map((user, index) => (
                  <li key={user.userId} className="leaderboard-item">
                    <span className="leaderboard-rank">{index + 1}.</span>
                    <span className="leaderboard-name">{user.userName}</span>
                    <span className="leaderboard-count">{user.count} iş</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-leaderboard">Henüz veri yok</div>
            )}
          </div>

          <div className="leaderboard-card">
            <h3 className="leaderboard-title">❌ En Çok İş İptal Edenler</h3>
            {details.topCancellers && details.topCancellers.length > 0 ? (
              <ul className="leaderboard-list">
                {details.topCancellers.map((user, index) => (
                  <li key={user.userId} className="leaderboard-item">
                    <span className="leaderboard-rank">{index + 1}.</span>
                    <span className="leaderboard-name">{user.userName}</span>
                    <span className="leaderboard-count">{user.count} iş</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-leaderboard">Henüz veri yok</div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="team-members-card">
          <h3 className="team-members-title">👥 Ekip Üyeleri</h3>
          {details.teamMembers && details.teamMembers.length > 0 ? (
            <ul className="team-members-list">
              {details.teamMembers.map((member) => (
                <li key={member.userId} className={`team-member-item ${member.isLeader ? 'leader' : ''}`}>
                  <span className="member-name">{member.userName}</span>
                  <span className="member-separator">:</span>
                  <span className="member-roles">
                    {member.isLeader && <span className="role-leader">Takım Lideri</span>}
                    {member.roles && member.roles.length > 0 && (
                      <>
                        {member.isLeader && member.roles.length > 0 && ' / '}
                        {member.roles.map((role, idx) => (
                          <span key={idx}>
                            {role.replace(/_/g, ' ')}
                            {idx < member.roles.length - 1 && ' / '}
                          </span>
                        ))}
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-members">Henüz üye yok</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;

