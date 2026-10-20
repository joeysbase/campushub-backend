import type { Request, Response } from 'express';
import { listResources } from '../services/resource.service';
import type { Resource, ResourceFilter } from '../types/reservation';
import { asyncHandler } from '../utils/asyncHandler';
import { parseIsAvailableFilter, parseResourceTypeFilter } from '../utils/validation';

export const getResources = asyncHandler(
  async (req: Request, res: Response<Resource[]>): Promise<void> => {
    const type = parseResourceTypeFilter(req.query.type);
    const isAvailable = parseIsAvailableFilter(req.query.isAvailable);
    const filter: ResourceFilter = {
      ...(type !== undefined && { type }),
      ...(isAvailable !== undefined && { isAvailable }),
    };
    const resources = await listResources(filter);
    res.status(200).json(resources);
  },
);
