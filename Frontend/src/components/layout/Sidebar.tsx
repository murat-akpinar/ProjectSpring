import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuCalendar, LuFolderKanban, LuLayoutDashboard, LuUsers, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Team } from '../../types/Team';
import { teamService } from '../../services/teamService';
import './Sidebar.css';

interface SidebarProps {
  selectedTeamId: number | null;
  onTeamSelect: (teamId: number | null) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedTeamId, onTeamSelect, isCollapsed = false, onToggleCollapse }) => {
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
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {!isCollapsed && (
            <div>
              <div className="sidebar-title">ProjectSpring</div>
              <div className="sidebar-subtitle">İş Takip Sistemi</div>
            </div>
          )}
          {onToggleCollapse && (
            <button
              className="sidebar-toggle-btn"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Menüyü Göster' : 'Menüyü Gizle'}
              style={isCollapsed ? { width: '100%', justifyContent: 'center' } : {}}
            >
              {isCollapsed ? <LuChevronRight size={18} /> : <LuChevronLeft size={18} />}
            </button>
          )}
        </div>
      </div>
      <div className="sidebar-navigation">
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          title={isCollapsed ? 'Takvim' : undefined}
        >
          <span className="nav-icon"><LuCalendar size={18} /></span>
          <span className="nav-label">Takvim</span>
        </Link>
        <Link
          to="/projects"
          className={`nav-item ${location.pathname === '/projects' ? 'active' : ''}`}
          title={isCollapsed ? 'Projeler' : undefined}
        >
          <span className="nav-icon"><LuFolderKanban size={18} /></span>
          <span className="nav-label">Projeler</span>
        </Link>
        <Link
          to="/dashboard"
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          title={isCollapsed ? 'Overview' : undefined}
        >
          <span className="nav-icon"><LuLayoutDashboard size={18} /></span>
          <span className="nav-label">Overview</span>
        </Link>
      </div>
      <div className="team-list">
        <div
          className={`team-item ${selectedTeamId === null ? 'active' : ''}`}
          onClick={() => onTeamSelect(null)}
          title={isCollapsed ? 'Tüm Birimler' : undefined}
        >
          <div className="team-item-content">
            <span className="nav-icon"><LuUsers size={18} /></span>
            <span className="nav-label team-item-name">Tüm Birimler</span>
          </div>
        </div>
        {loading ? (
          <div className="loading">{isCollapsed ? '...' : 'Yükleniyor...'}</div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className={`team-item ${selectedTeamId === team.id ? 'active' : ''}`}
              onClick={() => onTeamSelect(team.id)}
              title={isCollapsed ? team.name : undefined}
              style={{
                borderLeftColor: team.color || (selectedTeamId === team.id ? 'var(--ctp-blue)' : 'transparent')
              }}
            >
              <div className="team-item-content">
                <span className="nav-icon">
                  {team.icon ? (
                    <span className="team-icon" style={{ color: team.color || 'var(--ctp-text)' }}>
                      {team.icon}
                    </span>
                  ) : team.color ? (
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
                  ) : (
                    <span className="team-color-indicator" style={{
                      backgroundColor: 'var(--ctp-overlay0)',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      display: 'inline-block'
                    }} />
                  )}
                </span>
                <span className="nav-label">
                  <div className="team-item-name">{team.name}</div>
                  {team.description && (
                    <div className="team-item-description">{team.description}</div>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

