import React, { useState } from 'react';
import { ldapService } from '../../services/ldapService';
import { adminService } from '../../services/adminService';
import { LdapUser, Role } from '../../types/Admin';
import './LdapImport.css';

const LdapImport: React.FC = () => {
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<LdapUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<LdapUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  React.useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
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
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setLoading(true);
    try {
      const results = await ldapService.searchUsers({ username: searchUsername });
      setSearchResults(results);
    } catch (error: any) {
      alert(error.response?.data?.error || 'LDAP araması başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedUser) return;

    try {
      await ldapService.importUser(selectedUser, selectedRoleIds);
      alert('Kullanıcı başarıyla import edildi');
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRoleIds([]);
      setSearchUsername('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Import başarısız oldu');
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <div className="ldap-import">
      <h2>LDAP Kullanıcı Import</h2>

      <form onSubmit={handleSearch} className="search-form">
        <div className="form-group">
          <label>Kullanıcı Adı Ara</label>
          <div className="search-input-group">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Kullanıcı adı girin"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Aranıyor...' : 'Ara'}
            </button>
          </div>
        </div>
      </form>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Bulunan Kullanıcılar</h3>
          {searchResults.map((user, index) => (
            <div
              key={index}
              className={`result-item ${selectedUser === user ? 'selected' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="result-info">
                <strong>{user.fullName || user.username}</strong>
                <div className="result-details">
                  <span>Kullanıcı: {user.username}</span>
                  {user.email && <span>Email: {user.email}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="import-section">
          <h3>Import Ayarları</h3>
          <div className="selected-user">
            <strong>{selectedUser.fullName || selectedUser.username}</strong>
            <p>Kullanıcı Adı: {selectedUser.username}</p>
            {selectedUser.email && <p>Email: {selectedUser.email}</p>}
          </div>

          <div className="form-group">
            <label>Roller (Varsayılan: YAZILIMCI)</label>
            <div className="checkbox-group">
              {roles.map((role) => (
                <label key={role.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          <button className="btn-import" onClick={handleImport}>
            Import Et
          </button>
        </div>
      )}
    </div>
  );
};

export default LdapImport;

