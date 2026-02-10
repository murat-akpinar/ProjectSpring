import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logService } from '../../services/logService';
import { adminService } from '../../services/adminService';
import { taskService } from '../../services/taskService';
import { TaskLog, TaskLogFilter, PageResponse } from '../../types/Log';
import { User } from '../../types/User';
import './TaskLogs.css';

const TaskLogs: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskLogFilter>({
    page: 0,
    size: 50
  });
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchUsername, setSearchUsername] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response: PageResponse<TaskLog> = await logService.getTaskLogs(filter);
      setLogs(response.content);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
      alert('Loglar yüklenemedi: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = (value: string) => {
    setSearchUsername(value);
    setShowUserDropdown(value.length > 0);
    if (value.length === 0) {
      setSelectedUserId(undefined);
      setFilter(prev => ({ ...prev, userId: undefined, page: 0 }));
      setCurrentPage(0);
    }
  };

  const handleUserSelect = (user: User) => {
    setSearchUsername(user.fullName || user.username);
    setSelectedUserId(user.id);
    setShowUserDropdown(false);
    setFilter(prev => ({ ...prev, userId: user.id, page: 0 }));
    setCurrentPage(0);
  };

  const handleActionChange = (action: string) => {
    setFilter(prev => ({
      ...prev,
      action: action === 'ALL' ? undefined : action as any,
      page: 0
    }));
    setCurrentPage(0);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    let isoValue: string | undefined = undefined;
    if (value) {
      // date input formatı: "YYYY-MM-DD"
      // Backend ISO format bekliyor: "YYYY-MM-DDTHH:MM:SS"
      if (field === 'startDate') {
        isoValue = value + 'T00:00:00';
      } else {
        isoValue = value + 'T23:59:59';
      }
    }
    setFilter(prev => ({
      ...prev,
      [field]: isoValue,
      page: 0
    }));
    setCurrentPage(0);
  };

  // Filter'daki ISO tarihten sadece tarih kısmını al (input value için)
  const getDateValue = (isoDate?: string): string => {
    if (!isoDate) return '';
    return isoDate.substring(0, 10); // "YYYY-MM-DD" kısmını al
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
    setCurrentPage(page);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'var(--ctp-green)';
      case 'UPDATED': return 'var(--ctp-blue)';
      case 'DELETED': return 'var(--ctp-red)';
      case 'STATUS_CHANGED': return 'var(--ctp-yellow)';
      case 'ASSIGNEE_ADDED': return 'var(--ctp-mauve)';
      case 'ASSIGNEE_REMOVED': return 'var(--ctp-peach)';
      default: return 'var(--ctp-text)';
    }
  };

  const handleTaskClick = async (taskId: number) => {
    try {
      const task = await taskService.getTaskById(taskId);
      if (task.projectId) {
        navigate(`/projects/${task.projectId}`);
      } else {
        // Task modal aç veya alert göster
        alert(`İş: ${task.title}\nProje bilgisi bulunamadı.`);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      alert('İş yüklenemedi.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const filteredUsers = users.filter(user =>
    (user.fullName?.toLowerCase().includes(searchUsername.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchUsername.toLowerCase())) &&
    searchUsername.length > 0
  ).slice(0, 10);

  return (
    <div className="task-logs">
      <div className="task-logs-header">
        <h2>İş Logları</h2>
      </div>

      <div className="task-logs-filters">
        <div className="filter-group user-search-group">
          <label>Kullanıcı Ara:</label>
          <div className="user-search-container">
            <input
              type="text"
              placeholder="Kullanıcı adı veya tam adı..."
              value={searchUsername}
              onChange={(e) => handleUserSearch(e.target.value)}
              onFocus={() => setShowUserDropdown(searchUsername.length > 0)}
            />
            {showUserDropdown && filteredUsers.length > 0 && (
              <div className="user-dropdown">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-dropdown-item"
                    onClick={() => handleUserSelect(user)}
                  >
                    {user.fullName || user.username}
                  </div>
                ))}
              </div>
            )}
            {selectedUserId && (
              <button
                className="btn-clear-user"
                onClick={() => {
                  setSearchUsername('');
                  setSelectedUserId(undefined);
                  setFilter(prev => ({ ...prev, userId: undefined, page: 0 }));
                  setCurrentPage(0);
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="filter-group">
          <label>İşlem:</label>
          <select
            value={filter.action || 'ALL'}
            onChange={(e) => handleActionChange(e.target.value)}
          >
            <option value="ALL">Tümü</option>
            <option value="CREATED">Oluşturuldu</option>
            <option value="UPDATED">Güncellendi</option>
            <option value="DELETED">Silindi</option>
            <option value="STATUS_CHANGED">Durum Değişti</option>
            <option value="ASSIGNEE_ADDED">Atanan Eklendi</option>
            <option value="ASSIGNEE_REMOVED">Atanan Kaldırıldı</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Başlangıç Tarihi:</label>
          <input
            type="date"
            value={getDateValue(filter.startDate)}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Bitiş Tarihi:</label>
          <input
            type="date"
            value={getDateValue(filter.endDate)}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
          />
        </div>
        <button className="btn-refresh" onClick={fetchLogs}>
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : (
        <>
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Kullanıcı</th>
                  <th>İşlem</th>
                  <th>İş</th>
                  <th>Neden</th>
                  <th>Detay</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Log bulunamadı
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.createdAt)}</td>
                      <td>{log.changedByFullName || log.changedByUsername}</td>
                      <td>
                        <span
                          className="action-badge"
                          style={{ backgroundColor: getActionColor(log.action) }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span
                          className="task-link"
                          title={`İş #${log.taskId}`}
                          onClick={() => handleTaskClick(log.taskId)}
                        >
                          {log.taskTitle}
                        </span>
                      </td>
                      <td className="reason-cell" title={log.changeReason || ''}>
                        {log.changeReason ? (log.changeReason.length > 30 ? log.changeReason.substring(0, 30) + '...' : log.changeReason) : '-'}
                      </td>
                      <td>
                        {(log.oldValue || log.newValue) && (
                          <button
                            className="btn-view-detail"
                            onClick={() => {
                              const detail = `Eski: ${log.oldValue || 'N/A'}\nYeni: ${log.newValue || 'N/A'}`;
                              alert(detail);
                            }}
                          >
                            Detay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Önceki
              </button>
              <span>
                Sayfa {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskLogs;

