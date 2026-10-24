import mongoose from "mongoose";
import { DB_URI } from "../config/env.js";

if (!DB_URI) {
  throw new Error("Please define the DB_URI environment variable inside .env.<development|production>.local");
}

let connection;

// Cache the connection promise so concurrent requests share one connection.
const connectToDatabase = () => {
  connection ??= mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 }).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
};

export default connectToDatabase;
