import { useState, type FormEvent } from 'react';
import type { Reservation, Resource } from '@shared/contract';
import { useCreateReservation } from '../hooks/useReservations';
import { formatTimeRange } from '../utils/format';
import {
  validateBooking,
  type BookingFormErrors,
  type BookingFormValues,
} from '../utils/validateBooking';
import { ErrorBanner } from './ErrorBanner';
import shared from '../styles/shared.module.css';
import styles from './BookingForm.module.css';

export interface BookingFormProps {
  /** The resource to book; null until one is picked from the resource list. */
  resource: Resource | null;
  userId: string;
  onBooked: (reservation: Reservation) => void;
}

const EMPTY_VALUES: BookingFormValues = { startTime: '', endTime: '' };

export const BookingForm = ({ resource, userId, onBooked }: BookingFormProps) => {
  const [values, setValues] = useState<BookingFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<BookingFormErrors>({});
  const [lastBooking, setLastBooking] = useState<Reservation | null>(null);
  const create = useCreateReservation(onBooked);

  if (!resource) {
    return (
      <section className={styles.section} aria-labelledby="booking-heading">
        <h2 id="booking-heading">Book a Resource</h2>
        <p className={styles.placeholder}>Pick an available resource to book a time slot.</p>
      </section>
    );
  }

  const handleChange = (field: keyof BookingFormValues, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLastBooking(null);

    const errors = validateBooking(values, new Date());
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const reservation = await create.run({
      resourceId: resource.id,
      userId,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    });
    if (reservation) {
      setLastBooking(reservation);
      setValues(EMPTY_VALUES);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="booking-heading">
      <h2 id="booking-heading">Book {resource.name}</h2>
      <p className={styles.placeholder}>{resource.location}</p>

      <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className={styles.field}>
          <label htmlFor="booking-startTime">Start time</label>
          <input
            id="booking-startTime"
            type="datetime-local"
            value={values.startTime}
            onChange={(event) => handleChange('startTime', event.target.value)}
            aria-invalid={Boolean(fieldErrors.startTime)}
            aria-describedby={fieldErrors.startTime ? 'booking-startTime-error' : undefined}
            disabled={create.isPending}
          />
          {fieldErrors.startTime && (
            <span id="booking-startTime-error" className={styles.fieldError}>
              {fieldErrors.startTime}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="booking-endTime">End time</label>
          <input
            id="booking-endTime"
            type="datetime-local"
            value={values.endTime}
            onChange={(event) => handleChange('endTime', event.target.value)}
            aria-invalid={Boolean(fieldErrors.endTime)}
            aria-describedby={fieldErrors.endTime ? 'booking-endTime-error' : undefined}
            disabled={create.isPending}
          />
          {fieldErrors.endTime && (
            <span id="booking-endTime-error" className={styles.fieldError}>
              {fieldErrors.endTime}
            </span>
          )}
        </div>

        {create.error && <ErrorBanner message={create.error} onDismiss={create.clearError} />}
        {lastBooking && (
          <p className={styles.success} role="status">
            Booked {formatTimeRange(lastBooking.startTime, lastBooking.endTime)}. Status:{' '}
            {lastBooking.status}.
          </p>
        )}

        <button type="submit" className={shared.primaryButton} disabled={create.isPending}>
          {create.isPending ? 'Booking…' : 'Request booking'}
        </button>
      </form>
    </section>
  );
};
