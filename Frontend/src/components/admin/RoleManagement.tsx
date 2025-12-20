import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Role, CreateRoleRequest } from '../../types/Admin';
import './RoleManagement.css';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }
      const data = await adminService.getAllRoles();
      setRoles(data);
    } catch (error: any) {
      console.error('Failed to fetch roles:', error);
      const status = error.response?.status;
      if (status === 401) {
        alert('Oturumunuz sona ermiş veya geçersiz. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        alert('Bu işlem için yetkiniz yok. Sadece yöneticiler (DAIRE_BASKANI rolü) erişebilir.');
      } else {
        alert('Roller yüklenemedi: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu rolü silmek istediğinizden emin misiniz?')) {
      try {
        await adminService.deleteRole(id);
        fetchRoles();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Rol silinemedi');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const request: CreateRoleRequest = {
        name: formData.name,
        description: formData.description,
      };
      if (editingRole) {
        await adminService.updateRole(editingRole.id, request);
      } else {
        await adminService.createRole(request);
      }
      setShowModal(false);
      fetchRoles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'İşlem başarısız oldu');
    }
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  return (
    <div className="role-management">
      <div className="role-management-header">
        <h2>Rol Yönetimi</h2>
        <button className="btn-create" onClick={handleCreate}>
          Yeni Rol
        </button>
      </div>

      <table className="roles-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Rol Adı</th>
            <th>Açıklama</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <td>{role.id}</td>
              <td>{role.name}</td>
              <td>{role.description || '-'}</td>
              <td>
                <button className="btn-edit" onClick={() => handleEdit(role)}>
                  Düzenle
                </button>
                <button className="btn-delete" onClick={() => handleDelete(role.id)}>
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? 'Rol Düzenle' : 'Yeni Rol'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="role-form">
              <div className="form-group">
                <label>Rol Adı *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  İptal
                </button>
                <button type="submit" className="btn-submit">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

