import React, { useEffect, useState } from 'react';
import { Team } from '../../types/Team';
import { teamService } from '../../services/teamService';
import './Sidebar.css';

interface SidebarProps {
  selectedTeamId: number | null;
  onTeamSelect: (teamId: number | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedTeamId, onTeamSelect }) => {
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
            >
              <div className="team-item-name">{team.name}</div>
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

