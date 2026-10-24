import { NODE_ENV } from "../config/env.js";

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = `${Object.keys(err.keyValue || {}).join(", ") || "Value"} already exists`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON body";
  }

  if (statusCode >= 500) {
    console.error(err);
    // Don't leak internals (stack traces, connection strings) in production.
    if (NODE_ENV === "production") message = "Server Error";
  }

  res.status(statusCode).json({ success: false, error: message || "Server Error" });
};

export default errorMiddleware;
