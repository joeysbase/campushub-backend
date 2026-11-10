import { afterAll, afterEach, beforeAll } from '@jest/globals';
import os from 'node:os';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ReservationModel } from '../models/Reservation.model';
import { ResourceModel } from '../models/Resource.model';

/**
 * Runs before every test file (jest.config.ts `setupFilesAfterEnv`): each file
 * gets its own throwaway in-memory MongoDB, and every test starts with empty
 * collections. The real database in .env is never touched.
 */
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  mongoose.set('strictQuery', true); // same as config/database.ts
  // The driver loads `os` with a dynamic import(), which Jest's CommonJS sandbox doesn't
  // support. It fails silently, the handshake goes out without client metadata, and
  // MongoDB rejects it ("Missing required sub-document 'driver'"). Hand it `os` directly.
  await mongoose.connect(mongod.getUri(), { runtimeAdapters: { os } });
  // Build the indexes the app relies on, as `npm run seed` does for the real DB.
  await Promise.all([ResourceModel.syncIndexes(), ReservationModel.syncIndexes()]);
});

afterEach(async () => {
  await Promise.all([ReservationModel.deleteMany({}).exec(), ResourceModel.deleteMany({}).exec()]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
