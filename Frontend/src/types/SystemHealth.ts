export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY',
  UNKNOWN = 'UNKNOWN'
}

export interface SystemHealth {
  backendStatus: HealthStatus;
  databaseStatus: HealthStatus;
  frontendStatus: HealthStatus;
  lastChecked: string;
  backendMessage?: string;
  databaseMessage?: string;
  frontendMessage?: string;
}

