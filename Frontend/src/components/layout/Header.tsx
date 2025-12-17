import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

interface HeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedYear, onYearChange }) => {
  const { user, logout } = useAuth();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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
        <span className="user-name">{user?.fullName || user?.username}</span>
        <button className="logout-btn" onClick={logout}>
          Çıkış
        </button>
      </div>
    </header>
  );
};

export default Header;

