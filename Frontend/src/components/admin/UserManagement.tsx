import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User } from '../../types/User';
import UserModal from './UserModal';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }
      
      const data = await adminService.getAllUsers();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      const status = error.response?.status;
      if (status === 401) {
        // Token invalid or expired
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Oturum açmanız gerekiyor. Lütfen giriş yapın.');
        } else {
          alert('Oturumunuz sona ermiş veya geçersiz. Lütfen tekrar giriş yapın.');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        alert('Bu işlem için yetkiniz yok. Sadece yöneticiler (DAIRE_BASKANI rolü) erişebilir.');
      } else {
        alert('Kullanıcılar yüklenemedi: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      try {
        await adminService.deleteUser(id);
        fetchUsers();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Kullanıcı silinemedi');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUser(null);
    fetchUsers();
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>Kullanıcı Yönetimi</h2>
        <button className="btn-create" onClick={handleCreate}>
          Yeni Kullanıcı
        </button>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>Henüz kullanıcı bulunmamaktadır.</p>
        </div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Kullanıcı Adı</th>
              <th>İsim</th>
              <th>Email</th>
              <th>Roller</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.roles.join(', ')}</td>
              <td>
                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </td>
              <td>
                <button className="btn-edit" onClick={() => handleEdit(user)}>
                  Düzenle
                </button>
                <button className="btn-delete" onClick={() => handleDelete(user.id)}>
                  Sil
                </button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default UserManagement;

