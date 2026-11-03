import type { UserReservationsState } from '../hooks/useReservations';
import { formatTimeRange } from '../utils/format';
import { ErrorBanner } from './ErrorBanner';
import shared from '../styles/shared.module.css';
import styles from './UserReservations.module.css';

export interface UserReservationsProps {
  /**
   * From useUserReservations. Owned by the parent so it can also reload the
   * list after a booking is made in BookingForm.
   */
  reservations: UserReservationsState;
  /** Resource id → name, so rows can show a name instead of an id. */
  resourceNames: Record<string, string>;
}

export const UserReservations = ({ reservations: state, resourceNames }: UserReservationsProps) => {
  const { data: reservations, isLoading, error, reload, cancel } = state;

  return (
    <section className={styles.section} aria-labelledby="my-bookings-heading">
      <h2 id="my-bookings-heading">My Bookings</h2>

      {error && <ErrorBanner message={error} onRetry={reload} />}
      {cancel.error && <ErrorBanner message={cancel.error} onDismiss={cancel.clearError} />}
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
                disabled={cancel.isPending}
                onClick={() => void cancel.run(reservation.id)}
              >
                {cancel.pendingInput === reservation.id ? 'Cancelling…' : 'Cancel'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
