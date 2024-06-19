import { config } from "dotenv";
config();

export const database = {
  // connectionLimit: 10,
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'app-user',
  password: process.env.DATABASE_PASSWORD || 'app-passwd',
  database: process.env.DATABASE_NAME || 'database',
  port: process.env.DATABASE_PORT || 3306,
};

export const port = process.env.PORT || 80;

export const production = process.env.PRODUCTION || true;

export const SECRET = process.env.SECRET || 'mySecret';
