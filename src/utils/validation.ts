import type { CreateReservationRequest } from '../types/reservation';
import { validationError } from './errors';

/** RFC 3339 / ISO 8601 date-time, as required by OpenAPI `format: date-time`. */
const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/i;

const CREATE_RESERVATION_FIELDS: readonly (keyof CreateReservationRequest)[] = [
  'resourceId',
  'userId',
  'startTime',
  'endTime',
];

/** MongoDB ObjectId: 24 hexadecimal characters. */
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const requireNonEmptyString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError(`${field} is required and must be a non-empty string.`);
  }
  return value;
};

export const isIsoDateTime = (value: string): boolean =>
  ISO_DATE_TIME_PATTERN.test(value) && !Number.isNaN(Date.parse(value));

/** Validates the optional `type` query parameter of GET /resources. */
export const parseResourceTypeFilter = (value: unknown): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError('type must be a non-empty string when provided.');
  }
  return value;
};

/** Validates the `userId` path parameter of GET /reservations/user/{userId}. */
export const parseUserId = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError('userId must be a non-empty string.');
  }
  return value;
};

/** Validates a POST /reservations body against components/schemas/CreateReservationRequest. */
export const parseCreateReservationRequest = (body: unknown): CreateReservationRequest => {
  if (!isRecord(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  const unknownFields = Object.keys(body).filter(
    (key) => !(CREATE_RESERVATION_FIELDS as readonly string[]).includes(key),
  );
  if (unknownFields.length > 0) {
    throw validationError(`Unknown field(s): ${unknownFields.join(', ')}.`);
  }

  const request: CreateReservationRequest = {
    resourceId: requireNonEmptyString(body, 'resourceId'),
    userId: requireNonEmptyString(body, 'userId'),
    startTime: requireNonEmptyString(body, 'startTime'),
    endTime: requireNonEmptyString(body, 'endTime'),
  };

  if (!OBJECT_ID_PATTERN.test(request.resourceId)) {
    throw validationError('resourceId must be a 24-character hexadecimal ObjectId.');
  }
  if (!isIsoDateTime(request.startTime)) {
    throw validationError('startTime must be a valid ISO 8601 date-time string.');
  }
  if (!isIsoDateTime(request.endTime)) {
    throw validationError('endTime must be a valid ISO 8601 date-time string.');
  }
  if (Date.parse(request.endTime) <= Date.parse(request.startTime)) {
    throw validationError('endTime must be after startTime.');
  }

  return request;
};
