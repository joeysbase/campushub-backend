import type { Request, Response } from 'express';
import { createReservation, listActiveReservationsForUser } from '../services/reservation.service';
import type { Reservation, UserReservationsParams } from '../types/reservation';
import { asyncHandler } from '../utils/asyncHandler';
import { parseCreateReservationRequest, parseUserId } from '../utils/validation';

export const postReservation = asyncHandler(
  async (req: Request, res: Response<Reservation>): Promise<void> => {
    const request = parseCreateReservationRequest(req.body);
    const reservation = await createReservation(request);
    res.status(201).json(reservation);
  },
);

export const getUserReservations = asyncHandler(
  async (req: Request<UserReservationsParams>, res: Response<Reservation[]>): Promise<void> => {
    const userId = parseUserId(req.params.userId);
    const reservations = await listActiveReservationsForUser(userId);
    res.status(200).json(reservations);
  },
);
