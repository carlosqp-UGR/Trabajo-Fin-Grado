import { config } from "dotenv";
config();

export const database = {
  // connectionLimit: 10,
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'app',
  password: process.env.DATABASE_PASSWORD || 'D9q$Zr7vXk',
  database: process.env.DATABASE_NAME || 'db_app_aqh',
  // port: process.env.DATABASE_PORT || 3306,
};

export const port = process.env.PORT || 80;

export const production = process.env.production || true;

export const SECRET = process.env.SECRET || 'some secret key';