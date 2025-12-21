import React, { useState, useEffect } from 'react';
import { logService } from '../../services/logService';
import { SystemLog, SystemLogFilter, PageResponse } from '../../types/Log';
import './SystemLogs.css';

const SystemLogs: React.FC = () => {
  const [activeSource, setActiveSource] = useState<'BACKEND' | 'FRONTEND'>('BACKEND');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SystemLogFilter>({
    source: 'BACKEND',
    page: 0,
    size: 50
  });
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [activeSource, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const updatedFilter: SystemLogFilter = {
        ...filter,
        source: activeSource
      };
      
      let response: PageResponse<SystemLog>;
      if (activeSource === 'BACKEND') {
        response = await logService.getBackendLogs(updatedFilter);
      } else {
        response = await logService.getFrontendLogs(updatedFilter);
      }
      
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

  const handleLevelChange = (level: string) => {
    setFilter(prev => ({
      ...prev,
      level: level === 'ALL' ? undefined : level as any,
      page: 0
    }));
    setCurrentPage(0);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilter(prev => ({
      ...prev,
      [field]: value || undefined,
      page: 0
    }));
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
    setCurrentPage(page);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'var(--ctp-red)';
      case 'WARN': return 'var(--ctp-yellow)';
      case 'INFO': return 'var(--ctp-blue)';
      case 'DEBUG': return 'var(--ctp-subtext1)';
      default: return 'var(--ctp-text)';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  return (
    <div className="system-logs">
      <div className="system-logs-header">
        <h2>Sistem Logları</h2>
      </div>

      <div className="system-logs-tabs">
        <button
          className={activeSource === 'BACKEND' ? 'active' : ''}
          onClick={() => setActiveSource('BACKEND')}
        >
          Backend
        </button>
        <button
          className={activeSource === 'FRONTEND' ? 'active' : ''}
          onClick={() => setActiveSource('FRONTEND')}
        >
          Frontend
        </button>
      </div>

      <div className="system-logs-filters">
        <div className="filter-group">
          <label>Seviye:</label>
          <select
            value={filter.level || 'ALL'}
            onChange={(e) => handleLevelChange(e.target.value)}
          >
            <option value="ALL">Tümü</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Başlangıç Tarihi:</label>
          <input
            type="datetime-local"
            value={filter.startDate || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Bitiş Tarihi:</label>
          <input
            type="datetime-local"
            value={filter.endDate || ''}
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
                  <th>Seviye</th>
                  <th>Mesaj</th>
                  <th>Kullanıcı</th>
                  <th>IP</th>
                  <th>Endpoint</th>
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
                      <td>
                        <span
                          className="level-badge"
                          style={{ backgroundColor: getLevelColor(log.level) }}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="message-cell" title={log.message}>
                        {log.message.length > 100
                          ? log.message.substring(0, 100) + '...'
                          : log.message}
                      </td>
                      <td>{log.fullName || log.username || '-'}</td>
                      <td>{log.ipAddress || '-'}</td>
                      <td className="endpoint-cell" title={log.endpoint || ''}>
                        {log.endpoint ? (log.endpoint.length > 30 ? log.endpoint.substring(0, 30) + '...' : log.endpoint) : '-'}
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

export default SystemLogs;

