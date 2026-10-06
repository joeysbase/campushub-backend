import express, { type Express } from 'express';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app: Express = express();

app.use(express.json());
app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async (): Promise<void> => {
  await connectDatabase(config.mongodbUri);

  const server = app.listen(config.port, () => {
    console.log(`CampusHub backend listening on port ${config.port}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      disconnectDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((err: unknown) => {
  console.error('Failed to start CampusHub backend:', err);
  process.exit(1);
});

export default app;
