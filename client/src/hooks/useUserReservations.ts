import { useCallback } from 'react';
import { fetchUserReservations } from '../api/campushubApi';
import type { Reservation } from '../types/campushub';
import { useApiQuery, type ApiQuery } from './useApiQuery';

const NO_RESERVATIONS: Reservation[] = [];

/** Active (PENDING or CONFIRMED) reservations of `userId`. */
export const useUserReservations = (userId: string): ApiQuery<Reservation[]> => {
  const fetcher = useCallback(
    (): Promise<Reservation[]> => fetchUserReservations(userId),
    [userId],
  );
  return useApiQuery(fetcher, NO_RESERVATIONS);
};
