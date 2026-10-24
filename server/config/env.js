import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
  PORT,
  NODE_ENV,
  SERVER_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ARCJET_ENV,
  ARCJET_KEY,
  QSTASH_TOKEN,
  QSTASH_URL,
  EMAIL_PASSWORD,
} = process.env;

// The Vercel MongoDB Atlas integration provides MONGODB_URI.
export const DB_URI = process.env.DB_URI || process.env.MONGODB_URI;
