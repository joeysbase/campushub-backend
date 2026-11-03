import type { Request, Response } from 'express';
import { getHealthStatus, type HealthStatus } from '../services/health.service';

export const getHealth = (_req: Request, res: Response<HealthStatus>): void => {
  res.status(200).json(getHealthStatus());
};
