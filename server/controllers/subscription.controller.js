import dayjs from "dayjs";
import Subscription from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";
import { httpError } from "../utils/http-error.js";

const EDITABLE_FIELDS = [
  "name",
  "price",
  "currency",
  "frequency",
  "category",
  "paymentMethod",
  "startDate",
  "renewalDate",
];

// Only copy fields a client may set (never `user` or `status`).
const pickEditable = (body = {}) =>
  Object.fromEntries(EDITABLE_FIELDS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

const findOwnSubscription = async (req) => {
  const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!subscription) throw httpError(404, "Subscription not found");
  return subscription;
};

const scheduleReminders = async (subscription) => {
  try {
    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: { subscriptionId: subscription.id },
      headers: { "content-type": "application/json" },
      retries: 0,
    });
    return workflowRunId;
  } catch (error) {
    // The subscription is saved either way; reminders are best-effort.
    console.error("Failed to schedule reminders:", error.message);
    return null;
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id }).sort({ renewalDate: 1 });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (req.user.id !== req.params.id) throw httpError(403, "You are not the owner of this account");

    const subscriptions = await Subscription.find({ user: req.params.id }).sort({ renewalDate: 1 });
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const subscriptions = await Subscription.find({
      user: req.user._id,
      status: "active",
      renewalDate: { $gte: new Date(), $lte: dayjs().add(days, "day").toDate() },
    }).sort({ renewalDate: 1 });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await findOwnSubscription(req) });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({ ...pickEditable(req.body), user: req.user._id });
    const workflowRunId = await scheduleReminders(subscription);

    res.status(201).json({ success: true, data: { subscription, workflowRunId } });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await findOwnSubscription(req);
    subscription.set(pickEditable(req.body));
    await subscription.save();

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await findOwnSubscription(req);
    if (subscription.status === "cancelled") throw httpError(400, "Subscription is already cancelled");

    subscription.status = "cancelled";
    await subscription.save();

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await findOwnSubscription(req);
    await subscription.deleteOne();

    res.status(200).json({ success: true, message: "Subscription deleted" });
  } catch (error) {
    next(error);
  }
};
