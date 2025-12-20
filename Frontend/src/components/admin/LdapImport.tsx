import React, { useState, useEffect } from 'react';
import { ldapService } from '../../services/ldapService';
import { adminService } from '../../services/adminService';
import { ldapSettingsService } from '../../services/ldapSettingsService';
import { LdapUser, Role, LdapSettings, UpdateLdapSettingsRequest, LdapTestRequest, LdapTestResponse } from '../../types/Admin';
import './LdapImport.css';

const LdapImport: React.FC = () => {
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<LdapUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<LdapUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  
  // LDAP Settings state
  const [ldapSettings, setLdapSettings] = useState<LdapSettings>({
    urls: '',
    base: '',
    username: '',
    userSearchBase: '',
    userSearchFilter: '(uid={0})',
    isEnabled: false,
  });
  const [ldapPassword, setLdapPassword] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<LdapTestResponse | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchLdapSettings();
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
        alert('Bu işlem için yetkiniz yok. Sadece yöneticiler (ADMIN rolü) erişebilir.');
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

  const fetchLdapSettings = async () => {
    try {
      const settings = await ldapSettingsService.getLdapSettings();
      setLdapSettings(settings);
    } catch (error: any) {
      console.error('Failed to fetch LDAP settings:', error);
    }
  };

  const handleTestConnection = async () => {
    if (!ldapSettings.urls || !ldapSettings.base) {
      alert('LDAP URLs ve Base DN alanları zorunludur');
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const testRequest: LdapTestRequest = {
        urls: ldapSettings.urls,
        base: ldapSettings.base,
        username: ldapSettings.username || undefined,
        password: testPassword || undefined,
        userSearchBase: ldapSettings.userSearchBase || undefined,
        userSearchFilter: ldapSettings.userSearchFilter || undefined,
      };

      const result = await ldapSettingsService.testLdapConnection(testRequest);
      setTestResult(result);
      setConnectionTested(result.success);
      
      if (result.success) {
        alert('LDAP bağlantısı başarılı! Artık kullanıcı import edebilirsiniz.');
      } else {
        alert('LDAP bağlantısı başarısız: ' + result.message);
      }
    } catch (error: any) {
      const errorResponse: LdapTestResponse = {
        success: false,
        message: 'Test başarısız oldu',
        errorDetails: error.response?.data?.error || error.message,
      };
      setTestResult(errorResponse);
      alert('LDAP bağlantı testi başarısız: ' + errorResponse.message);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!ldapSettings.urls || !ldapSettings.base) {
      alert('LDAP URLs ve Base DN alanları zorunludur');
      return;
    }

    setSavingSettings(true);

    try {
      const updateRequest: UpdateLdapSettingsRequest = {
        urls: ldapSettings.urls,
        base: ldapSettings.base,
        username: ldapSettings.username || undefined,
        password: ldapPassword || undefined, // Only send if provided
        userSearchBase: ldapSettings.userSearchBase || undefined,
        userSearchFilter: ldapSettings.userSearchFilter || undefined,
        isEnabled: ldapSettings.isEnabled || false,
      };

      await ldapSettingsService.updateLdapSettings(updateRequest);
      alert('LDAP ayarları başarıyla kaydedildi');
      setLdapPassword(''); // Clear password field after saving
      fetchLdapSettings();
    } catch (error: any) {
      alert('LDAP ayarları kaydedilemedi: ' + (error.response?.data?.error || error.message));
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="ldap-import">
      <h2>LDAP Kullanıcı Import</h2>

      {/* LDAP Settings Form */}
      <div className="ldap-settings-section">
        <h3>LDAP Bağlantı Ayarları</h3>
        <div className="ldap-settings-form">
          <div className="form-group">
            <label>LDAP URLs *</label>
            <input
              type="text"
              value={ldapSettings.urls}
              onChange={(e) => setLdapSettings({ ...ldapSettings, urls: e.target.value })}
              placeholder="ldap://localhost:389"
              required
            />
          </div>

          <div className="form-group">
            <label>Base DN *</label>
            <input
              type="text"
              value={ldapSettings.base}
              onChange={(e) => setLdapSettings({ ...ldapSettings, base: e.target.value })}
              placeholder="dc=example,dc=com"
              required
            />
          </div>

          <div className="form-group">
            <label>Username (Bind DN)</label>
            <input
              type="text"
              value={ldapSettings.username || ''}
              onChange={(e) => setLdapSettings({ ...ldapSettings, username: e.target.value })}
              placeholder="cn=admin,dc=example,dc=com"
            />
          </div>

          <div className="form-group">
            <label>Password (Test için)</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Test bağlantısı için şifre girin"
            />
          </div>

          <div className="form-group">
            <label>Password (Kaydetmek için)</label>
            <input
              type="password"
              value={ldapPassword}
              onChange={(e) => setLdapPassword(e.target.value)}
              placeholder="Ayarları kaydetmek için şifre girin"
            />
            <small className="form-hint">Şifre şifrelenerek saklanacaktır</small>
          </div>

          <div className="form-group">
            <label>User Search Base</label>
            <input
              type="text"
              value={ldapSettings.userSearchBase || ''}
              onChange={(e) => setLdapSettings({ ...ldapSettings, userSearchBase: e.target.value })}
              placeholder="ou=users,dc=example,dc=com"
            />
          </div>

          <div className="form-group">
            <label>User Search Filter</label>
            <input
              type="text"
              value={ldapSettings.userSearchFilter || '(uid={0})'}
              onChange={(e) => setLdapSettings({ ...ldapSettings, userSearchFilter: e.target.value })}
              placeholder="(uid={0})"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ldapSettings.isEnabled || false}
                onChange={(e) => setLdapSettings({ ...ldapSettings, isEnabled: e.target.checked })}
              />
              LDAP'i Aktif Et
            </label>
          </div>

          <div className="ldap-settings-actions">
            <button
              type="button"
              className="btn-test"
              onClick={handleTestConnection}
              disabled={testingConnection || !ldapSettings.urls || !ldapSettings.base}
            >
              {testingConnection ? 'Test Ediliyor...' : 'Test Bağlantı'}
            </button>
            <button
              type="button"
              className="btn-save"
              onClick={handleSaveSettings}
              disabled={savingSettings || !ldapSettings.urls || !ldapSettings.base}
            >
              {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <strong>{testResult.success ? '✓ Başarılı' : '✗ Başarısız'}</strong>
              <p>{testResult.message}</p>
              {testResult.errorDetails && (
                <details>
                  <summary>Detaylar</summary>
                  <pre>{testResult.errorDetails}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LDAP User Search */}
      <div className="ldap-search-section">
        <h3>LDAP Kullanıcı Arama</h3>

        {!connectionTested && (
          <div className="connection-warning">
            <p>⚠️ LDAP bağlantısını test etmeden önce kullanıcı arayamazsınız.</p>
          </div>
        )}

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
                disabled={!connectionTested}
              />
              <button type="submit" disabled={loading || !connectionTested}>
                {loading ? 'Aranıyor...' : 'Ara'}
              </button>
            </div>
          </div>
        </form>
      </div>

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

