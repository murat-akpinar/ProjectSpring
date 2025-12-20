import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

interface HeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedYear, onYearChange }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const isAdmin = hasRole('ADMIN');

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleAdminPanelClick = () => {
    navigate('/admin');
  };

  const getRoleLabel = (roles: string[]): string => {
    if (roles.includes('ADMIN')) return 'Yönetici';
    if (roles.includes('TAKIM_LIDERI')) return 'Takım Lideri';
    if (roles.includes('YAZILIMCI')) return 'Yazılımcı';
    if (roles.includes('DEVOPS')) return 'DevOps';
    if (roles.includes('IS_ANALISTI')) return 'İş Analisti';
    if (roles.includes('TESTCI')) return 'Test Uzmanı';
    return roles.join(', ') || 'Kullanıcı';
  };

  return (
    <header className="header">
      <div className="year-selector">
        <label htmlFor="year-select">Yıl:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="user-info">
        {isAdmin && (
          <button className="admin-panel-btn" onClick={handleAdminPanelClick}>
            Yönetim Paneli
          </button>
        )}
        <div className="user-profile-section" onClick={handleProfileClick}>
          <span className="user-name">{user?.fullName || user?.username}</span>
          {user?.roles && user.roles.length > 0 && (
            <span className="user-role">{getRoleLabel(user.roles)}</span>
          )}
        </div>
        <button className="logout-btn" onClick={logout}>
          Çıkış
        </button>
      </div>
    </header>
  );
};

export default Header;

