import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import { httpError } from "../utils/http-error.js";

// Users can only read or change their own account.
const assertSelf = (req) => {
  if (req.user.id !== req.params.id) throw httpError(403, "You can only access your own account");
};

export const getUser = async (req, res, next) => {
  try {
    assertSelf(req);
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    assertSelf(req);
    const { name, email, password } = req.body;

    if (name !== undefined) req.user.name = name;
    if (email !== undefined) req.user.email = email;
    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        throw httpError(400, "Password must be at least 8 characters");
      }
      req.user.password = await bcrypt.hash(password, 10);
    }

    await req.user.save();
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    assertSelf(req);
    await Subscription.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ success: true, message: "Account deleted" });
  } catch (error) {
    next(error);
  }
};
