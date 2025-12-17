import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import TeamDashboard from '../components/dashboard/TeamDashboard';
import '../App.css';

const DashboardPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  return (
    <div className="app-container">
      <Sidebar selectedTeamId={selectedTeamId} onTeamSelect={setSelectedTeamId} />
      <div className="main-content">
        <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
        <div className="content-area">
          <div className="dashboard-container">
            <h1 style={{ marginBottom: '20px' }}>Ekip Dashboard</h1>
            <TeamDashboard teamId={selectedTeamId || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

