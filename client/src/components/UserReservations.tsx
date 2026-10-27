import { useState } from 'react';
import { cancelReservation, getApiErrorMessage } from '../api/campushubApi';
import type { ApiQuery } from '../hooks/useApiQuery';
import type { Reservation } from '../types/campushub';
import { formatTimeRange } from '../utils/format';
import { ErrorBanner } from './ErrorBanner';
import shared from '../styles/shared.module.css';
import styles from './UserReservations.module.css';

export interface UserReservationsProps {
  /**
   * The student's reservations (from useUserReservations). Owned by the parent
   * so it can also reload the list after a booking is made in BookingForm.
   */
  reservationsQuery: ApiQuery<Reservation[]>;
  /** Resource id → name, so rows can show a name instead of an id. */
  resourceNames: Record<string, string>;
}

export const UserReservations = ({ reservationsQuery, resourceNames }: UserReservationsProps) => {
  const { data: reservations, isLoading, error, reload } = reservationsQuery;
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async (reservationId: string): Promise<void> => {
    setCancellingId(reservationId);
    setCancelError(null);
    try {
      await cancelReservation(reservationId);
    } catch (err: unknown) {
      setCancelError(getApiErrorMessage(err));
    } finally {
      setCancellingId(null);
      // Refresh either way: on failure the list may be stale (e.g. cancelled in another tab).
      reload();
    }
  };

  return (
    <section className={styles.section} aria-labelledby="my-bookings-heading">
      <h2 id="my-bookings-heading">My Bookings</h2>

      {error && <ErrorBanner message={error} onRetry={reload} />}
      {cancelError && <ErrorBanner message={cancelError} onDismiss={() => setCancelError(null)} />}
      {isLoading && reservations.length === 0 && (
        <p className={styles.status}>Loading your bookings…</p>
      )}
      {!isLoading && !error && reservations.length === 0 && (
        <p className={styles.status}>You have no active bookings.</p>
      )}

      {reservations.length > 0 && (
        <ul className={styles.list} aria-busy={isLoading}>
          {reservations.map((reservation) => (
            <li key={reservation.id} className={styles.row}>
              <div className={styles.details}>
                <span className={styles.name}>
                  {resourceNames[reservation.resourceId] ?? reservation.resourceId}
                </span>
                <span className={styles.time}>
                  {formatTimeRange(reservation.startTime, reservation.endTime)}
                </span>
              </div>
              <span className={styles.statusBadge} data-status={reservation.status}>
                {reservation.status}
              </span>
              <button
                type="button"
                className={shared.secondaryButton}
                disabled={cancellingId !== null}
                onClick={() => void handleCancel(reservation.id)}
              >
                {cancellingId === reservation.id ? 'Cancelling…' : 'Cancel'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
