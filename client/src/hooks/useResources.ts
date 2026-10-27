import { useCallback } from 'react';
import { fetchResources } from '../api/campushubApi';
import type { Resource, ResourceType } from '../types/campushub';
import { useApiQuery, type ApiQuery } from './useApiQuery';

const NO_RESOURCES: Resource[] = [];

/** Resources of the given type, or all resources when `type` is undefined. */
export const useResources = (type?: ResourceType): ApiQuery<Resource[]> => {
  const fetcher = useCallback((): Promise<Resource[]> => fetchResources(type), [type]);
  return useApiQuery(fetcher, NO_RESOURCES);
};
