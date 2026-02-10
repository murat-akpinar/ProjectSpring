import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SystemHealth from '../components/admin/SystemHealth';
import UserManagement from '../components/admin/UserManagement';
import TeamManagement from '../components/admin/TeamManagement';
import RoleManagement from '../components/admin/RoleManagement';
import LdapImport from '../components/admin/LdapImport';
import SystemLogs from '../components/admin/SystemLogs';
import TaskLogs from '../components/admin/TaskLogs';
import './AdminPanelPage.css';

const AdminPanelPage: React.FC = () => {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'roles' | 'ldap' | 'logs'>('users');
  const [activeLogTab, setActiveLogTab] = useState<'system' | 'tasks'>('system');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    // Wait for user data to load
    if (loading) {
      // Still loading, wait
      return;
    }

    if (user === null) {
      // User data failed to load, might be token issue
      console.warn('User data is null and not loading, might be authentication issue');
      // Don't redirect immediately, let API calls handle it
      return;
    }

    if (user && !hasRole('ADMIN')) {
      alert('Bu sayfaya erişim yetkiniz yok. Sadece yöneticiler (ADMIN rolü) erişebilir.');
      navigate('/');
      return;
    }
  }, [user, hasRole, navigate, loading]);

  return (
    <div className="admin-panel-page">
      <div className="admin-panel-header">
        <h1>Yönetim Paneli</h1>
        <button
          className="btn-back-to-home"
          onClick={() => navigate('/')}
        >
          ← Anasayfaya Dön
        </button>
      </div>

      <SystemHealth />

      <div className="admin-tabs">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Kullanıcılar
        </button>
        <button
          className={activeTab === 'teams' ? 'active' : ''}
          onClick={() => setActiveTab('teams')}
        >
          Birimler
        </button>
        <button
          className={activeTab === 'roles' ? 'active' : ''}
          onClick={() => setActiveTab('roles')}
        >
          Roller
        </button>
        <button
          className={activeTab === 'ldap' ? 'active' : ''}
          onClick={() => setActiveTab('ldap')}
        >
          LDAP Import
        </button>
        <button
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Loglar
        </button>
      </div>

      <div className="admin-tab-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'teams' && <TeamManagement />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'ldap' && <LdapImport />}
        {activeTab === 'logs' && (
          <div className="logs-tab-content">
            <div className="logs-sub-tabs">
              <button
                className={activeLogTab === 'system' ? 'active' : ''}
                onClick={() => setActiveLogTab('system')}
              >
                Sistem Logları
              </button>
              <button
                className={activeLogTab === 'tasks' ? 'active' : ''}
                onClick={() => setActiveLogTab('tasks')}
              >
                İş Logları
              </button>
            </div>
            {activeLogTab === 'system' && <SystemLogs />}
            {activeLogTab === 'tasks' && <TaskLogs />}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanelPage;

