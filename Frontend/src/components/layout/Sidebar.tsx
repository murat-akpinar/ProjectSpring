import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Team } from '../../types/Team';
import { teamService } from '../../services/teamService';
import './Sidebar.css';

interface SidebarProps {
  selectedTeamId: number | null;
  onTeamSelect: (teamId: number | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedTeamId, onTeamSelect }) => {
  const location = useLocation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getAllTeams();
        setTeams(data);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">ProjectSpring</div>
        <div className="sidebar-subtitle">İş Takip Sistemi</div>
      </div>
      <div className="sidebar-navigation">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          Takvim
        </Link>
        <Link
          to="/projects"
          className={`nav-item ${location.pathname === '/projects' ? 'active' : ''}`}
        >
          Projeler
        </Link>
        <Link
          to="/dashboard"
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
      </div>
      <div className="team-list">
        <div
          className={`team-item ${selectedTeamId === null ? 'active' : ''}`}
          onClick={() => onTeamSelect(null)}
        >
          <div className="team-item-name">Tüm Ekipler</div>
        </div>
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className={`team-item ${selectedTeamId === team.id ? 'active' : ''}`}
              onClick={() => onTeamSelect(team.id)}
              style={{
                borderLeftColor: team.color || (selectedTeamId === team.id ? 'var(--ctp-blue)' : 'transparent')
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {team.icon && (
                  <span className="team-icon" style={{ color: team.color || 'var(--ctp-text)' }}>
                    {team.icon}
                  </span>
                )}
                {team.color && !team.icon && (
                  <span 
                    className="team-color-indicator" 
                    style={{ 
                      backgroundColor: team.color,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      display: 'inline-block'
                    }}
                  />
                )}
                <div className="team-item-name">{team.name}</div>
              </div>
              {team.description && (
                <div className="team-item-description">{team.description}</div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

