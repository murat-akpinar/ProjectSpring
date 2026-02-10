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

  // Toplam iş sayısı
  const total = stats.totalOpen + stats.totalInProgress + stats.totalCompleted +
    stats.totalOverdue + stats.totalPostponed + stats.totalCancelled;

  // Trend hesaplama (mock - gerçek uygulamada backend'den gelir)
  const getTrend = (value: number): { percent: number; isUp: boolean } => {
    // Simüle edilmiş trend
    const percent = Math.floor(Math.random() * 20) + 1;
    const isUp = value > 2;
    return { percent, isUp };
  };

  // Mini bar grafik için mock data
  const getMiniChart = (value: number): number[] => {
    const bars = [];
    for (let i = 0; i < 6; i++) {
      bars.push(Math.floor(Math.random() * value) + 1);
    }
    return bars;
  };

  // Stat kartları için konfigürasyon
  const statCards = [
    {
      key: 'progress',
      label: 'Devam Eden İşler',
      value: stats.totalInProgress,
      icon: '🔄',
      color: '#89b4fa',
      bgColor: 'rgba(137, 180, 250, 0.1)'
    },
    {
      key: 'completed',
      label: 'Tamamlanan İşler',
      value: stats.totalCompleted,
      icon: '✅',
      color: '#a6e3a1',
      bgColor: 'rgba(166, 227, 161, 0.1)'
    },
    {
      key: 'open',
      label: 'Açık İşler',
      value: stats.totalOpen,
      icon: '📋',
      color: '#f9e2af',
      bgColor: 'rgba(249, 226, 175, 0.1)'
    },
    {
      key: 'overdue',
      label: 'Yetişmeyen İşler',
      value: stats.totalOverdue,
      icon: '⚠️',
      color: '#f38ba8',
      bgColor: 'rgba(243, 139, 168, 0.1)'
    },
    {
      key: 'postponed',
      label: 'Ertelenen İşler',
      value: stats.totalPostponed,
      icon: '⏸️',
      color: '#fab387',
      bgColor: 'rgba(250, 179, 135, 0.1)'
    },
    {
      key: 'cancelled',
      label: 'İptal Edilen',
      value: stats.totalCancelled,
      icon: '❌',
      color: '#6c7086',
      bgColor: 'rgba(108, 112, 134, 0.1)'
    },
  ];

  return (
    <div className="dashboard-container-full">

      {/* Overview Header */}
      <div className="overview-header">
        <h2 className="overview-title">Overview</h2>
        <p className="overview-subtitle">Ekip performansı ve iş takibi</p>
      </div>

      {/* Modern Stats Cards */}
      <div className="stats-grid">
        {statCards.map((card) => {
          const trend = getTrend(card.value);
          const miniChart = getMiniChart(card.value);
          const maxBar = Math.max(...miniChart);

          return (
            <div
              key={card.key}
              className="stat-card-modern"
              style={{ '--accent-color': card.color, '--bg-color': card.bgColor } as React.CSSProperties}
            >
              <div className="stat-card-header">
                <span className="stat-icon">{card.icon}</span>
                <span className="stat-label-modern">{card.label}</span>
                <span className="stat-expand">↗</span>
              </div>

              <div className="stat-content">
                <div className="stat-main">
                  <span className="stat-value-modern">{card.value.toLocaleString()}</span>
                  <span className="stat-unit">Görev</span>
                </div>

                <div className="stat-mini-chart">
                  {miniChart.map((height, idx) => (
                    <div
                      key={idx}
                      className="mini-bar"
                      style={{
                        height: `${(height / maxBar) * 100}%`,
                        backgroundColor: card.color
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="stat-footer">
                <span className={`trend-badge ${trend.isUp ? 'up' : 'down'}`}>
                  {trend.isUp ? '↑' : '↓'} {trend.percent}%
                </span>
                <span className="trend-text">vs geçen ay</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Progress Bar */}
      <div className="total-progress-section">
        <h3>Toplam İş Dağılımı</h3>
        <div className="total-progress-bar">
          <div
            className="progress-segment completed"
            style={{ width: `${(stats.totalCompleted / total) * 100}%` }}
            title={`Tamamlanan: ${stats.totalCompleted}`}
          />
          <div
            className="progress-segment in-progress"
            style={{ width: `${(stats.totalInProgress / total) * 100}%` }}
            title={`Devam Eden: ${stats.totalInProgress}`}
          />
          <div
            className="progress-segment open"
            style={{ width: `${(stats.totalOpen / total) * 100}%` }}
            title={`Açık: ${stats.totalOpen}`}
          />
          <div
            className="progress-segment overdue"
            style={{ width: `${(stats.totalOverdue / total) * 100}%` }}
            title={`Yetişmeyen: ${stats.totalOverdue}`}
          />
          <div
            className="progress-segment postponed"
            style={{ width: `${(stats.totalPostponed / total) * 100}%` }}
            title={`Ertelenen: ${stats.totalPostponed}`}
          />
        </div>
        <div className="progress-legend">
          <span className="legend-item"><span className="dot completed"></span> Tamamlanan</span>
          <span className="legend-item"><span className="dot in-progress"></span> Devam Eden</span>
          <span className="legend-item"><span className="dot open"></span> Açık</span>
          <span className="legend-item"><span className="dot overdue"></span> Yetişmeyen</span>
          <span className="legend-item"><span className="dot postponed"></span> Ertelenen</span>
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
                    <span className={`leaderboard-rank rank-${index + 1}`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
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
                  <span className="member-avatar">
                    {member.userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="member-name">{member.userName}</span>
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
