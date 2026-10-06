import mongoose from 'mongoose';

export const connectDatabase = async (uri: string): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to MongoDB (${mongoose.connection.name})`);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
