import type { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const health = getHealthStatus();
  res.status(200).json(health);
});
