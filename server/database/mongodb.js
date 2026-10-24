import mongoose from "mongoose";
import { DB_URI } from "../config/env.js";

let connection;

// Cache the connection promise so concurrent requests share one connection.
// A missing DB_URI fails the request (500 JSON) instead of crashing the function,
// so routes that don't need the database, like /health, still respond.
const connectToDatabase = () => {
  if (!DB_URI) {
    return Promise.reject(new Error("DB_URI (or MONGODB_URI) is not configured"));
  }
  connection ??= mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 }).catch((error) => {
    connection = undefined;
    throw error;
  });
  return connection;
};

export default connectToDatabase;
