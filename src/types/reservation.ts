import type { ReservationStatus } from '../../shared/contract';

/** API contract types (Resource, Reservation, ...) are declared once, in shared/contract.ts. */
export * from '../../shared/contract';

/** Reservation statuses that occupy a resource's time block. */
export const ACTIVE_RESERVATION_STATUSES: readonly ReservationStatus[] = ['PENDING', 'CONFIRMED'];

/** Validated filters of GET /resources (from its `type` and `isAvailable` query parameters). */
export interface ResourceFilter {
  type?: string;
  isAvailable?: boolean;
}

/** Statuses a reservation can be moved to after creation. */
export type ReservationStatusUpdate = Exclude<ReservationStatus, 'PENDING'>;

/** Path parameters of PATCH /reservations/{id}/cancel and /reservations/{id}/confirm */
export interface ReservationIdParams {
  id: string;
}

/** Path parameters of GET /reservations/user/{userId} */
export interface UserReservationsParams {
  userId: string;
}
