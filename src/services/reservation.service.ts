import { Types } from 'mongoose';
import { ReservationModel, type ReservationDocument } from '../models/Reservation.model';
import {
  ACTIVE_RESERVATION_STATUSES,
  type CreateReservationRequest,
  type Reservation,
} from '../types/reservation';
import { conflictError, notFoundError } from '../utils/errors';
import { findResourceById } from './resource.service';

const toReservation = (doc: ReservationDocument): Reservation => ({
  id: doc._id.toString(),
  resourceId: doc.resourceId.toString(),
  userId: doc.userId,
  startTime: doc.startTime.toISOString(),
  endTime: doc.endTime.toISOString(),
  status: doc.status,
});

/**
 * Half-open intervals [start, end) overlap when each starts before the other ends.
 * Note: this check-then-insert is not atomic; concurrent requests could both pass it.
 */
const hasOverlappingReservation = async (
  resourceId: Types.ObjectId,
  startTime: Date,
  endTime: Date,
): Promise<boolean> => {
  const existing = await ReservationModel.exists({
    resourceId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).exec();
  return existing !== null;
};

export const createReservation = async (
  request: CreateReservationRequest,
): Promise<Reservation> => {
  const resource = await findResourceById(request.resourceId);
  if (resource === null) {
    throw notFoundError('RESOURCE_NOT_FOUND', `Resource ${request.resourceId} does not exist.`);
  }
  if (!resource.isAvailable) {
    throw conflictError(
      'RESOURCE_UNAVAILABLE',
      `Resource ${resource.id} is not available for booking.`,
    );
  }

  const resourceId = new Types.ObjectId(resource.id);
  const startTime = new Date(request.startTime);
  const endTime = new Date(request.endTime);

  if (await hasOverlappingReservation(resourceId, startTime, endTime)) {
    throw conflictError('DOUBLE_BOOKING', 'Resource is already reserved for this time slot.');
  }

  const doc = await ReservationModel.create({
    resourceId,
    userId: request.userId,
    startTime,
    endTime,
    status: 'PENDING',
  });
  return toReservation(doc);
};

export const listActiveReservationsForUser = async (userId: string): Promise<Reservation[]> => {
  const docs = await ReservationModel.find({
    userId,
    status: { $in: ACTIVE_RESERVATION_STATUSES },
  })
    .sort({ startTime: 1 })
    .exec();
  return docs.map(toReservation);
};
