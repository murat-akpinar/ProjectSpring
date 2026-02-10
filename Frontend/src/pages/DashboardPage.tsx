import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import TeamDashboard from '../components/dashboard/TeamDashboard';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Date filter state
  const [filterMode, setFilterMode] = useState<string>('all'); // 'all', '1m', '3m', '6m', '1y', 'custom'
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate date range based on filter mode
  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

    switch (filterMode) {
      case '1m': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case '3m': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case '6m': {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case '1y': {
        const start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        return { startDate: start.toISOString().split('T')[0], endDate };
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          return { startDate: customStartDate, endDate: customEndDate };
        }
        return {};
      }
      default:
        return {};
    }
  };

  const dateRange = getDateRange();

  const filterButtons = [
    { key: 'all', label: 'Tümü' },
    { key: '1m', label: 'Son 1 Ay' },
    { key: '3m', label: 'Son 3 Ay' },
    { key: '6m', label: 'Son 6 Ay' },
    { key: '1y', label: 'Son 1 Yıl' },
    { key: 'custom', label: 'Özel Aralık' },
  ];

  return (
    <div className="app-layout">
      <Sidebar selectedTeamId={selectedTeamId} onTeamSelect={setSelectedTeamId} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="main-content">
        <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
        <div className="content-area">
          <div className="dashboard-container">
            <h1 style={{ marginBottom: '20px' }}>Overview</h1>

            {/* Date Filter Bar */}
            <div className="date-filter-bar">
              <div className="filter-buttons">
                {filterButtons.map(btn => (
                  <button
                    key={btn.key}
                    className={`filter-btn ${filterMode === btn.key ? 'active' : ''}`}
                    onClick={() => setFilterMode(btn.key)}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {filterMode === 'custom' && (
                <div className="custom-date-inputs">
                  <div className="date-input-group">
                    <label>Başlangıç</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <span className="date-separator">–</span>
                  <div className="date-input-group">
                    <label>Bitiş</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="date-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <TeamDashboard
              teamId={selectedTeamId || undefined}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
