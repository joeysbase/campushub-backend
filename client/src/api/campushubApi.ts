import axios, { type AxiosInstance } from 'axios';
import type {
  CreateReservationDTO,
  ErrorResponse,
  Reservation,
  Resource,
} from '../types/campushub';

/**
 * Typed client for the CampusHub API (docs/openapi.yaml). Requests go to
 * /api/v1 on the same origin; in development Vite proxies them to the backend.
 */
const http: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

/** GET /resources — optionally filtered by resource type. */
export const fetchResources = async (type?: string): Promise<Resource[]> => {
  const params: Record<string, string> = type ? { type } : {};
  const { data } = await http.get<Resource[]>('/resources', { params });
  return data;
};

/** POST /reservations — 409 if the time window overlaps an active reservation. */
export const createReservation = async (payload: CreateReservationDTO): Promise<Reservation> => {
  const { data } = await http.post<Reservation>('/reservations', payload);
  return data;
};

/** GET /reservations/user/{userId} — active (PENDING or CONFIRMED) reservations only. */
export const fetchUserReservations = async (userId: string): Promise<Reservation[]> => {
  const { data } = await http.get<Reservation[]>(
    `/reservations/user/${encodeURIComponent(userId)}`,
  );
  return data;
};

/** PATCH /reservations/{id}/cancel — frees the time slot immediately. */
export const cancelReservation = async (reservationId: string): Promise<Reservation> => {
  const { data } = await http.patch<Reservation>(
    `/reservations/${encodeURIComponent(reservationId)}/cancel`,
  );
  return data;
};

/** User-facing wording for the error codes the backend can return. */
const MESSAGES_BY_CODE: Record<string, string> = {
  DOUBLE_BOOKING: 'This resource is already reserved for the selected time window.',
  RESOURCE_UNAVAILABLE: 'This resource is not currently available for booking.',
  RESOURCE_NOT_FOUND: 'This resource no longer exists.',
  RESERVATION_NOT_FOUND: 'This reservation no longer exists.',
  INVALID_STATUS_TRANSITION: 'This reservation has already been cancelled.',
};

const UNREACHABLE_STATUSES: ReadonlySet<number> = new Set([502, 503, 504]);

const isErrorResponse = (value: unknown): value is ErrorResponse =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>).code === 'string' &&
  typeof (value as Record<string, unknown>).message === 'string';

/** Turns any error thrown by this module into a message that can be shown to the user. */
export const getApiErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const body: unknown = err.response?.data;
    if (isErrorResponse(body)) {
      return MESSAGES_BY_CODE[body.code] ?? body.message;
    }
    // No response at all, or a gateway (e.g. the Vite dev proxy) that couldn't reach the backend.
    if (!err.response || UNREACHABLE_STATUSES.has(err.response.status)) {
      return 'Cannot reach the CampusHub server. Check that the backend is running.';
    }
    return `Request failed with status ${err.response.status}.`;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
};
