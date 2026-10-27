import { useState, type FormEvent } from 'react';
import { createReservation, getApiErrorMessage } from '../api/campushubApi';
import type { Reservation, Resource } from '../types/campushub';
import { formatTimeRange } from '../utils/format';
import { ErrorBanner } from './ErrorBanner';
import shared from '../styles/shared.module.css';
import styles from './BookingForm.module.css';

export interface BookingFormProps {
  /** The resource to book; null until one is picked from the resource list. */
  resource: Resource | null;
  userId: string;
  onBooked: (reservation: Reservation) => void;
}

/** Values of the two `datetime-local` inputs ("YYYY-MM-DDTHH:mm", local time). */
interface BookingFormValues {
  startTime: string;
  endTime: string;
}

type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

const EMPTY_VALUES: BookingFormValues = { startTime: '', endTime: '' };

/** Client-side checks mirroring the backend's rules, so obvious mistakes never hit the API. */
const validate = ({ startTime, endTime }: BookingFormValues, now: Date): BookingFormErrors => {
  const errors: BookingFormErrors = {};
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!startTime) errors.startTime = 'Choose a start time.';
  else if (Number.isNaN(start.getTime())) errors.startTime = 'Enter a valid start time.';
  else if (start <= now) errors.startTime = 'Start time must be in the future.';

  if (!endTime) errors.endTime = 'Choose an end time.';
  else if (Number.isNaN(end.getTime())) errors.endTime = 'Enter a valid end time.';
  else if (!errors.startTime && end <= start) errors.endTime = 'End time must be after the start time.';

  return errors;
};

export const BookingForm = ({ resource, userId, onBooked }: BookingFormProps) => {
  const [values, setValues] = useState<BookingFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<BookingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastBooking, setLastBooking] = useState<Reservation | null>(null);

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
    setSubmitError(null);
    setLastBooking(null);

    const errors = validate(values, new Date());
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const reservation = await createReservation({
        resourceId: resource.id,
        userId,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
      });
      setLastBooking(reservation);
      setValues(EMPTY_VALUES);
      onBooked(reservation);
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
          {fieldErrors.endTime && (
            <span id="booking-endTime-error" className={styles.fieldError}>
              {fieldErrors.endTime}
            </span>
          )}
        </div>

        {submitError && (
          <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
        )}
        {lastBooking && (
          <p className={styles.success} role="status">
            Booked {formatTimeRange(lastBooking.startTime, lastBooking.endTime)}. Status:{' '}
            {lastBooking.status}.
          </p>
        )}

        <button type="submit" className={shared.primaryButton} disabled={isSubmitting}>
          {isSubmitting ? 'Booking…' : 'Request booking'}
        </button>
      </form>
    </section>
  );
};
