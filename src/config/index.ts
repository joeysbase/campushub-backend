import { existsSync } from 'node:fs';
import path from 'node:path';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
}

const ENV_FILE = path.resolve(process.cwd(), '.env');

// Load .env with Node's built-in loader (no dotenv dependency). Real environment variables win.
if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Missing required environment variable ${name}. See .env-example.`);
  }
  return value;
};

const parsePort = (value: string | undefined): number => {
  if (value === undefined || value.trim() === '') {
    return 3000;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${value}".`);
  }
  return port;
};

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  mongodbUri: requireEnv('MONGODB_URI'),
};
