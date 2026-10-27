import type { IsoDateTimeString, ResourceType } from '../types/campushub';

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  ROOM: 'Study Room',
  EQUIPMENT: 'Equipment',
  LAB: 'Lab',
};

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** "Mon, Oct 26, 10:00 AM – 11:00 AM" (end date repeated only if it differs). */
export const formatTimeRange = (start: IsoDateTimeString, end: IsoDateTimeString): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  const endText = sameDay ? timeFormat.format(endDate) : dateTimeFormat.format(endDate);
  return `${dateTimeFormat.format(startDate)} – ${endText}`;
};
