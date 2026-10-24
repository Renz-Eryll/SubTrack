import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import {
  cancelSubscription,
  createSubscription,
  deleteSubscription,
  getSubscription,
  getSubscriptions,
  getUpcomingRenewals,
  getUserSubscriptions,
  updateSubscription,
} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.use(authorize);

subscriptionRouter.get("/", getSubscriptions);
subscriptionRouter.post("/", createSubscription);
// Static paths must come before "/:id".
subscriptionRouter.get("/upcoming-renewals", getUpcomingRenewals);
subscriptionRouter.get("/user/:id", getUserSubscriptions);
subscriptionRouter.get("/:id", getSubscription);
subscriptionRouter.put("/:id", updateSubscription);
subscriptionRouter.put("/:id/cancel", cancelSubscription);
subscriptionRouter.delete("/:id", deleteSubscription);

export default subscriptionRouter;
