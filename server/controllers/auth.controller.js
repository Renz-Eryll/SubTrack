import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import { httpError } from "../utils/http-error.js";

const MIN_PASSWORD_LENGTH = 8;

const signToken = (user) =>
  jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || "1d" });

export const signUp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      throw httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    // The unique index on email rejects duplicates (handled as 409 by the error middleware).
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { token: signToken(user), user },
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      throw httpError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    const isPasswordValid = user && (await bcrypt.compare(password, user.password));

    // Same message for both cases so the API doesn't reveal which emails are registered.
    if (!isPasswordValid) throw httpError(401, "Invalid email or password");

    res.status(200).json({
      success: true,
      message: "User signed in successfully",
      data: { token: signToken(user), user },
    });
  } catch (error) {
    next(error);
  }
};

// JWTs are stateless: the client signs out by discarding its token.
export const signOut = (req, res) => {
  res.status(200).json({ success: true, message: "Signed out" });
};
