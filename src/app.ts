import express, { type Express } from 'express';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app: Express = express();

app.use(express.json());
app.use('/api/v1', apiRouter);

app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`CampusHub backend listening on port ${PORT}`);
});

export default app;
