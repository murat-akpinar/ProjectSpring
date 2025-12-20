import React, { useEffect, useState } from 'react';
import { systemHealthService } from '../../services/systemHealthService';
import { SystemHealth as SystemHealthType, HealthStatus } from '../../types/SystemHealth';
import './SystemHealth.css';

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for system health check');
          setError('Oturum açmanız gerekiyor.');
          setLoading(false);
          return;
        }
        const data = await systemHealthService.getSystemHealth();
        setHealth(data as SystemHealthType);
        setError(null);
        setError(null);
      } catch (error: any) {
        console.error('Failed to fetch system health:', error);
        const status = error.response?.status;
        if (status === 401) {
          setError('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.');
        } else if (status === 403) {
          setError('Bu bilgiyi görüntüleme yetkiniz yok.');
        } else {
          setError('Sistem sağlığı bilgisi alınamadı.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: HealthStatus): string => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return 'var(--ctp-green)';
      case HealthStatus.UNHEALTHY:
        return 'var(--ctp-red)';
      case HealthStatus.UNKNOWN:
        return 'var(--ctp-yellow)';
      default:
        return 'var(--ctp-overlay0)';
    }
  };

  const getStatusText = (status: HealthStatus): string => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return 'Sağlıklı';
      case HealthStatus.UNHEALTHY:
        return 'Sorunlu';
      case HealthStatus.UNKNOWN:
        return 'Bilinmiyor';
      default:
        return 'Bilinmiyor';
    }
  };

  if (loading) {
    return <div className="system-health loading">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="system-health error">Hata: {error}</div>;
  }

  if (!health) {
    return <div className="system-health error">Sistem sağlığı bilgisi alınamadı</div>;
  }

  return (
    <div className="system-health">
      <h2>Sistem Sağlığı</h2>
      <div className="health-cards">
        <div className="health-card">
          <div className="health-label">Backend</div>
          <div
            className="health-status"
            style={{ color: getStatusColor(health.backendStatus) }}
          >
            {getStatusText(health.backendStatus)}
          </div>
          {health.backendMessage && (
            <div className="health-message">{health.backendMessage}</div>
          )}
        </div>
        <div className="health-card">
          <div className="health-label">Database</div>
          <div
            className="health-status"
            style={{ color: getStatusColor(health.databaseStatus) }}
          >
            {getStatusText(health.databaseStatus)}
          </div>
          {health.databaseMessage && (
            <div className="health-message">{health.databaseMessage}</div>
          )}
        </div>
        <div className="health-card">
          <div className="health-label">Frontend</div>
          <div
            className="health-status"
            style={{ color: getStatusColor(health.frontendStatus) }}
          >
            {getStatusText(health.frontendStatus)}
          </div>
          {health.frontendMessage && (
            <div className="health-message">{health.frontendMessage}</div>
          )}
        </div>
      </div>
      {health.lastChecked && (
        <div className="health-last-checked">
          Son kontrol: {new Date(health.lastChecked).toLocaleString('tr-TR')}
        </div>
      )}
    </div>
  );
};

export default SystemHealth;

