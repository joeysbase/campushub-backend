import { Router } from 'express';
import { getUserReservations, postReservation } from '../controllers/reservation.controller';
import { getResources } from '../controllers/resource.controller';

/**
 * Routes bound to the endpoints in docs/openapi.yaml (mounted under /api/v1).
 */
const reservationRouter = Router();

reservationRouter.get('/resources', getResources);
reservationRouter.post('/reservations', postReservation);
reservationRouter.get('/reservations/user/:userId', getUserReservations);

export default reservationRouter;
