import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { Task } from '../../types/Task';
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
      window.location.reload(); // Refresh to get updated user data
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

  if (!user) {
    return <div className="loading">Kullanıcı bilgisi yükleniyor...</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-section">
        <h2>Profil Bilgileri</h2>
        <div className="profile-info">
          <div className="info-item">
            <label>Kullanıcı Adı:</label>
            <span>{user.username}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>
          <div className="info-item">
            <label>İsim Soyisim:</label>
            <span>{user.fullName}</span>
          </div>
          <div className="info-item">
            <label>Rol:</label>
            <span className="role-text">{getRoleLabel(user.roles)}</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h2>İsim Değiştir</h2>
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

      <div className="profile-section">
        <h2>Parola Değiştir</h2>
        <form onSubmit={handleChangePassword} className="profile-form">
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
          <button type="submit" className="btn-submit" disabled={changingPassword}>
            {changingPassword ? 'Değiştiriliyor...' : 'Parola Değiştir'}
          </button>
        </form>
      </div>

      <div className="profile-section">
        <h2>Atanan İşler</h2>
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : tasks.length === 0 ? (
          <p className="no-tasks">Size atanmış iş bulunmamaktadır.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Konu</th>
                <th>Durum</th>
                <th>Başlangıç</th>
                <th>Bitiş</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td>
                    <span className={`status-badge status-${task.status.toLowerCase()}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{task.startDate ? new Date(task.startDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>{task.endDate ? new Date(task.endDate).toLocaleDateString('tr-TR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

