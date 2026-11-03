import { useCallback } from 'react';
import type { CreateReservationRequest, Reservation } from '@shared/contract';
import { cancelReservation, createReservation, fetchUserReservations } from '../api/campushubApi';
import { useApiMutation, type ApiMutation } from './useApiMutation';
import { useApiQuery, type ApiQuery } from './useApiQuery';

const NO_RESERVATIONS: Reservation[] = [];

export interface UserReservationsState extends ApiQuery<Reservation[]> {
  /** Cancels a reservation by id, then reloads the list. */
  cancel: ApiMutation<string, Reservation>;
}

/** A student's active (PENDING or CONFIRMED) reservations, plus cancelling them. */
export const useUserReservations = (userId: string): UserReservationsState => {
  const fetcher = useCallback(
    (): Promise<Reservation[]> => fetchUserReservations(userId),
    [userId],
  );
  const query = useApiQuery(fetcher, NO_RESERVATIONS);
  // Reload even when cancelling fails: the list may be stale (e.g. cancelled in another tab).
  const cancel = useApiMutation(cancelReservation, { onSettled: query.reload });
  return { ...query, cancel };
};

/** Creating a reservation; `onCreated` runs after the API accepts it (e.g. to refresh a list). */
export const useCreateReservation = (
  onCreated: (reservation: Reservation) => void,
): ApiMutation<CreateReservationRequest, Reservation> =>
  useApiMutation(createReservation, { onSuccess: onCreated });
