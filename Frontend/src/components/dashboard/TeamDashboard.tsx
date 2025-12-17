import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../../types/Dashboard';
import { dashboardService } from '../../services/dashboardService';
import './TeamDashboard.css';

interface TeamDashboardProps {
  teamId?: number;
}

const TeamDashboard: React.FC<TeamDashboardProps> = ({ teamId }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = teamId
          ? await dashboardService.getTeamDashboard(teamId)
          : await dashboardService.getAllTeamsDashboard();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [teamId]);

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!stats) {
    return <div className="error">Veri yüklenemedi</div>;
  }

  return (
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
  );
};

export default TeamDashboard;

