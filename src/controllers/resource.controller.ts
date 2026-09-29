import type { Request, Response } from 'express';
import { listResources } from '../services/resource.service';
import type { Resource } from '../types/reservation';
import { asyncHandler } from '../utils/asyncHandler';
import { parseResourceTypeFilter } from '../utils/validation';

export const getResources = asyncHandler(
  async (req: Request, res: Response<Resource[]>): Promise<void> => {
    const type = parseResourceTypeFilter(req.query.type);
    const resources = await listResources(type);
    res.status(200).json(resources);
  },
);
