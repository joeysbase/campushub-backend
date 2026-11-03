/** Values of the booking form's two `datetime-local` inputs ("YYYY-MM-DDTHH:mm", local time). */
export interface BookingFormValues {
  startTime: string;
  endTime: string;
}

export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

/** Client-side checks mirroring the backend's rules, so obvious mistakes never hit the API. */
export const validateBooking = (
  { startTime, endTime }: BookingFormValues,
  now: Date,
): BookingFormErrors => {
  const errors: BookingFormErrors = {};
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!startTime) errors.startTime = 'Choose a start time.';
  else if (Number.isNaN(start.getTime())) errors.startTime = 'Enter a valid start time.';
  else if (start <= now) errors.startTime = 'Start time must be in the future.';

  if (!endTime) errors.endTime = 'Choose an end time.';
  else if (Number.isNaN(end.getTime())) errors.endTime = 'Enter a valid end time.';
  else if (!errors.startTime && end <= start)
    errors.endTime = 'End time must be after the start time.';

  return errors;
};
