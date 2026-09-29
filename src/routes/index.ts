import { Router } from 'express';
import healthRouter from './health.routes';
import reservationRouter from './reservation.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/', reservationRouter);

export default apiRouter;
