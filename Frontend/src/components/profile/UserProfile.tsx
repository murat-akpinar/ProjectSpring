import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { Task, TaskStatus } from '../../types/Task';
import { getStatusLabel } from '../../utils/statusColors';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await userService.getMyTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('İsim boş olamaz');
      return;
    }

    setUpdating(true);
    try {
      await userService.updateProfile(fullName);
      alert('Profil güncellendi');
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Profil güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('Tüm alanlar doldurulmalıdır');
      return;
    }

    if (newPassword.length < 6) {
      alert('Yeni parola en az 6 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Yeni parola ve onay parolası eşleşmiyor');
      return;
    }

    setChangingPassword(true);
    try {
      await userService.changePassword(oldPassword, newPassword);
      alert('Parola değiştirildi');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Parola değiştirilemedi');
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (roles: string[]): string => {
    if (roles.includes('ADMIN')) return 'Yönetici';
    if (roles.includes('TAKIM_LIDERI')) return 'Birim Lideri';
    if (roles.includes('YAZILIMCI')) return 'Yazılımcı';
    if (roles.includes('DEVOPS')) return 'DevOps';
    if (roles.includes('IS_ANALISTI')) return 'İş Analisti';
    if (roles.includes('TESTCI')) return 'Test Uzmanı';
    return roles.join(', ') || 'Kullanıcı';
  };

  // ========= COMPUTED STATS =========
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeTasks = tasks.filter(
    (t) => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
  );
  const inProgressTasks = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.TESTING
  );
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Deadline approaching: active tasks with endDate within 7 days
  const deadlineTasks = activeTasks
    .filter((t) => {
      if (!t.endDate) return false;
      const end = new Date(t.endDate);
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  // New tasks: OPEN status
  const newTasks = tasks.filter((t) => t.status === TaskStatus.OPEN);

  const getDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineClass = (days: number): string => {
    if (days <= 0) return 'deadline-overdue';
    if (days <= 3) return 'deadline-urgent';
    return 'deadline-warning';
  };

  const getDeadlineLabel = (days: number): string => {
    if (days < 0) return `${Math.abs(days)} gün gecikti`;
    if (days === 0) return 'Bugün!';
    return `${days} gün kaldı`;
  };

  const getPriorityLabel = (priority?: string): string => {
    switch (priority) {
      case 'URGENT': return 'Acil';
      case 'HIGH': return 'Yüksek';
      case 'NORMAL': return 'Normal';
      default: return 'Normal';
    }
  };

  const getPriorityClass = (priority?: string): string => {
    switch (priority) {
      case 'URGENT': return 'priority-urgent';
      case 'HIGH': return 'priority-high';
      default: return 'priority-normal';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'OPEN': return 'badge-open';
      case 'IN_PROGRESS': return 'badge-progress';
      case 'TESTING': return 'badge-testing';
      case 'COMPLETED': return 'badge-completed';
      case 'POSTPONED': return 'badge-postponed';
      case 'CANCELLED': return 'badge-cancelled';
      case 'OVERDUE': return 'badge-overdue';
      default: return '';
    }
  };

  if (!user) {
    return <div className="loading">Kullanıcı bilgisi yükleniyor...</div>;
  }

  return (
    <div className="user-profile">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="avatar-section">
          <div className="avatar">
            {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="user-info-header">
            <h2>{user.fullName}</h2>
            <span className="role-badge">{getRoleLabel(user.roles)}</span>
            <span className="username-badge">@{user.username}</span>
          </div>
        </div>
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Ayarlar
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-value">{tasks.length}</div>
                <div className="stat-label">Toplam İş</div>
              </div>
            </div>
            <div className="stat-card stat-active">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <div className="stat-value">{inProgressTasks.length}</div>
                <div className="stat-label">Devam Eden</div>
              </div>
            </div>
            <div className="stat-card stat-completed">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-value">{completedTasks.length}</div>
                <div className="stat-label">Tamamlanan</div>
                <div className="stat-sub">{completionRate}% tamamlanma</div>
              </div>
              <div className="completion-ring">
                <svg viewBox="0 0 36 36">
                  <path
                    className="ring-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="ring-fill"
                    strokeDasharray={`${completionRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
            <div className="stat-card stat-open">
              <div className="stat-icon">🆕</div>
              <div className="stat-content">
                <div className="stat-value">{newTasks.length}</div>
                <div className="stat-label">Yeni İş</div>
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="dashboard-columns">
            {/* Deadline Tasks */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3>🔥 Son Günü Yaklaşan İşler</h3>
                {deadlineTasks.length > 0 && (
                  <span className="section-count">{deadlineTasks.length}</span>
                )}
              </div>
              <div className="section-content">
                {loading ? (
                  <div className="loading-mini">Yükleniyor...</div>
                ) : deadlineTasks.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🎉</span>
                    <p>Yaklaşan deadline yok!</p>
                  </div>
                ) : (
                  <div className="task-cards">
                    {deadlineTasks.map((task) => {
                      const days = getDaysRemaining(task.endDate);
                      return (
                        <div key={task.id} className={`task-card ${getDeadlineClass(days)}`}>
                          <div className="task-card-header">
                            <span className="task-card-title">{task.title}</span>
                            <span className={`deadline-badge ${getDeadlineClass(days)}`}>
                              {getDeadlineLabel(days)}
                            </span>
                          </div>
                          <div className="task-card-meta">
                            {task.teamName && <span className="meta-tag team-tag">🏢 {task.teamName}</span>}
                            {task.projectName && <span className="meta-tag project-tag">📁 {task.projectName}</span>}
                            <span className={`meta-tag ${getPriorityClass(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>
                          <div className="task-card-footer">
                            <span className="task-date">
                              📅 {new Date(task.endDate).toLocaleDateString('tr-TR')}
                            </span>
                            <span className={`status-mini ${getStatusBadgeClass(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* New Tasks */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3>🆕 Yeni Atanan İşler</h3>
                {newTasks.length > 0 && (
                  <span className="section-count">{newTasks.length}</span>
                )}
              </div>
              <div className="section-content">
                {loading ? (
                  <div className="loading-mini">Yükleniyor...</div>
                ) : newTasks.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <p>Yeni atanmış iş yok</p>
                  </div>
                ) : (
                  <div className="task-cards">
                    {newTasks.map((task) => (
                      <div key={task.id} className="task-card task-card-new">
                        <div className="task-card-header">
                          <span className="task-card-title">{task.title}</span>
                          <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                        <div className="task-card-meta">
                          {task.teamName && <span className="meta-tag team-tag">🏢 {task.teamName}</span>}
                          {task.projectName && <span className="meta-tag project-tag">📁 {task.projectName}</span>}
                        </div>
                        <div className="task-card-footer">
                          <span className="task-date">
                            📅 {new Date(task.startDate).toLocaleDateString('tr-TR')} — {new Date(task.endDate).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Task Table */}
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h3>📋 Tüm İşler</h3>
              <span className="section-count">{tasks.length}</span>
            </div>
            <div className="section-content">
              {loading ? (
                <div className="loading-mini">Yükleniyor...</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>Size atanmış iş bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="tasks-table-v2">
                    <thead>
                      <tr>
                        <th>Konu</th>
                        <th>Birim</th>
                        <th>Proje</th>
                        <th>Durum</th>
                        <th>Öncelik</th>
                        <th>Başlangıç</th>
                        <th>Bitiş</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td className="td-title">{task.title}</td>
                          <td><span className="meta-tag team-tag">{task.teamName}</span></td>
                          <td>{task.projectName || <span className="text-muted">—</span>}</td>
                          <td>
                            <span className={`status-badge-v2 ${getStatusBadgeClass(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                          </td>
                          <td>
                            <span className={`priority-dot ${getPriorityClass(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </td>
                          <td className="td-date">{task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '—'}</td>
                          <td className="td-date">{task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Settings Tab */
        <>
          <div className="settings-grid">
            <div className="dashboard-section">
              <div className="section-header">
                <h3>👤 Profil Bilgileri</h3>
              </div>
              <div className="section-content">
                <div className="profile-info">
                  <div className="info-item">
                    <label>Kullanıcı Adı</label>
                    <span>{user.username}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{user.email}</span>
                  </div>
                  <div className="info-item">
                    <label>İsim Soyisim</label>
                    <span>{user.fullName}</span>
                  </div>
                  <div className="info-item">
                    <label>Rol</label>
                    <span className="role-text">{getRoleLabel(user.roles)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h3>✏️ İsim Değiştir</h3>
              </div>
              <div className="section-content">
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="form-group">
                    <label>Yeni İsim Soyisim</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit" disabled={updating}>
                    {updating ? 'Güncelleniyor...' : 'Güncelle'}
                  </button>
                </form>
              </div>
            </div>

            <div className="dashboard-section full-width">
              <div className="section-header">
                <h3>🔒 Parola Değiştir</h3>
              </div>
              <div className="section-content">
                <form onSubmit={handleChangePassword} className="profile-form">
                  <div className="password-fields">
                    <div className="form-group">
                      <label>Eski Parola</label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Yeni Parola</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label>Yeni Parola (Tekrar)</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={changingPassword}>
                    {changingPassword ? 'Değiştiriliyor...' : 'Parola Değiştir'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
