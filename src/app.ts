import express, { type Express } from 'express';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * The Express app, without a database connection or a listening port, so tests
 * can drive it with Supertest. src/server.ts starts it for real.
 */
const app: Express = express();

app.use(express.json());
app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
