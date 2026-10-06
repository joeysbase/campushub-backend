import { Types } from 'mongoose';
import { config } from '../config';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ReservationModel } from '../models/Reservation.model';
import { ResourceModel, type IResource } from '../models/Resource.model';

interface SeedResource extends IResource {
  _id: Types.ObjectId;
}

/** Fixed ObjectIds so manual curl tests can reference stable resource IDs. */
const SEED_RESOURCES: SeedResource[] = [
  {
    _id: new Types.ObjectId('000000000000000000000101'),
    name: 'Study Room 302',
    type: 'ROOM',
    location: 'Snell Library, Floor 3',
    isAvailable: true,
  },
  {
    _id: new Types.ObjectId('000000000000000000000102'),
    name: '3D Printer A',
    type: 'EQUIPMENT',
    location: 'EXP Makerspace',
    isAvailable: true,
  },
  {
    _id: new Types.ObjectId('000000000000000000000103'),
    name: 'Chemistry Lab B',
    type: 'LAB',
    location: 'Hurtig Hall, Room 110',
    isAvailable: true,
  },
  {
    _id: new Types.ObjectId('000000000000000000000104'),
    name: 'Study Room 105',
    type: 'ROOM',
    location: 'Snell Library, Floor 1',
    isAvailable: false,
  },
];

/** Resets the database to a known state: seeded resources and no reservations. */
const seed = async (): Promise<void> => {
  await connectDatabase(config.mongodbUri);
  try {
    await ReservationModel.deleteMany({}).exec();
    await ResourceModel.deleteMany({}).exec();
    await ResourceModel.insertMany(SEED_RESOURCES);
    await Promise.all([ResourceModel.syncIndexes(), ReservationModel.syncIndexes()]);
    console.log(`Seeded ${SEED_RESOURCES.length} resources and cleared reservations.`);
  } finally {
    await disconnectDatabase();
  }
};

seed().catch((err: unknown) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
