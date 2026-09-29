import {
  ACTIVE_RESERVATION_STATUSES,
  type CreateReservationRequest,
  type Reservation,
} from '../types/reservation';
import { createHttpError } from '../utils/httpError';
import { findResourceById } from './resource.service';

/**
 * In-memory reservation store for local development and testing.
 * Swap for ReservationModel (src/models/reservation.model.ts) once MongoDB is wired up.
 */
const reservations: Reservation[] = [];
let nextReservationNumber = 1;

const isActive = (reservation: Reservation): boolean =>
  ACTIVE_RESERVATION_STATUSES.includes(reservation.status);

/** Half-open intervals [start, end) overlap when each starts before the other ends. */
const overlaps = (reservation: Reservation, startMs: number, endMs: number): boolean =>
  Date.parse(reservation.startTime) < endMs && startMs < Date.parse(reservation.endTime);

export const createReservation = async (
  request: CreateReservationRequest,
): Promise<Reservation> => {
  const resource = await findResourceById(request.resourceId);
  if (resource === undefined) {
    throw createHttpError(
      404,
      'RESOURCE_NOT_FOUND',
      `Resource ${request.resourceId} does not exist.`,
    );
  }
  if (!resource.isAvailable) {
    throw createHttpError(
      409,
      'RESOURCE_UNAVAILABLE',
      `Resource ${resource.id} is not available for booking.`,
    );
  }

  const startMs = Date.parse(request.startTime);
  const endMs = Date.parse(request.endTime);
  const hasConflict = reservations.some(
    (existing) =>
      existing.resourceId === request.resourceId &&
      isActive(existing) &&
      overlaps(existing, startMs, endMs),
  );
  if (hasConflict) {
    throw createHttpError(
      409,
      'DOUBLE_BOOKING',
      'Resource is already reserved for this time slot.',
    );
  }

  const reservation: Reservation = {
    id: `rsv-${nextReservationNumber++}`,
    resourceId: request.resourceId,
    userId: request.userId,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    status: 'PENDING',
  };
  reservations.push(reservation);
  return reservation;
};

export const listActiveReservationsForUser = async (userId: string): Promise<Reservation[]> => {
  return reservations.filter(
    (reservation) => reservation.userId === userId && isActive(reservation),
  );
};
