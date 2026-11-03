import type { Request, Response } from 'express';
import {
  cancelReservation,
  confirmReservation,
  createReservation,
  listActiveReservationsForUser,
} from '../services/reservation.service';
import type {
  Reservation,
  ReservationIdParams,
  UserReservationsParams,
} from '../types/reservation';
import {
  parseCreateReservationRequest,
  parseReservationId,
  parseUserId,
} from '../utils/validation';

/*
 * No try/catch here: Express 5 forwards errors thrown by (or rejected from) async
 * handlers to middleware/errorHandler.ts, which maps them to HTTP responses.
 */

export const postReservation = async (req: Request, res: Response<Reservation>): Promise<void> => {
  const request = parseCreateReservationRequest(req.body);
  const reservation = await createReservation(request);
  res.status(201).json(reservation);
};

export const getUserReservations = async (
  req: Request<UserReservationsParams>,
  res: Response<Reservation[]>,
): Promise<void> => {
  const userId = parseUserId(req.params.userId);
  const reservations = await listActiveReservationsForUser(userId);
  res.status(200).json(reservations);
};

export const patchCancelReservation = async (
  req: Request<ReservationIdParams>,
  res: Response<Reservation>,
): Promise<void> => {
  const id = parseReservationId(req.params.id);
  const reservation = await cancelReservation(id);
  res.status(200).json(reservation);
};

export const patchConfirmReservation = async (
  req: Request<ReservationIdParams>,
  res: Response<Reservation>,
): Promise<void> => {
  const id = parseReservationId(req.params.id);
  const reservation = await confirmReservation(id);
  res.status(200).json(reservation);
};
