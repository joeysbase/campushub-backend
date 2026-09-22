export interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
}

export const getHealthStatus = (): HealthStatus => {
  return {
    status: 'ok',
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  };
};
