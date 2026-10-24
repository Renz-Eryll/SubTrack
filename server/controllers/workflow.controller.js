import dayjs from "dayjs";
import Subscription from "../models/subscription.model.js";
import { sendReminderEmail } from "../utils/send-email.js";
// serve() verifies the Upstash signature when QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY are set.
import { serve } from "@upstash/workflow/express";

const REMINDERS = [7, 5, 2, 1];

const fetchSubscription = (context, subscriptionId, label = "get subscription") =>
  // Step results are stored as JSON by Upstash, so return a plain object (lean), not a Mongoose document.
  context.run(label, () => Subscription.findById(subscriptionId).populate("user", "name email").lean());

export const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;
  let subscription = await fetchSubscription(context, subscriptionId);

  if (!subscription || subscription.status !== "active") return;

  const renewalDate = dayjs(subscription.renewalDate);
  if (renewalDate.isBefore(dayjs())) return;

  for (const daysBefore of REMINDERS) {
    const reminderDate = renewalDate.subtract(daysBefore, "day");
    const label = `${daysBefore} days before reminder`;

    if (reminderDate.isAfter(dayjs())) {
      await context.sleepUntil(`Reminder ${daysBefore} days before`, reminderDate.toDate());
    }

    // Re-check after sleeping: the user may have cancelled or deleted it meanwhile.
    subscription = await fetchSubscription(context, subscriptionId, `check before ${label}`);
    if (!subscription || subscription.status !== "active") return;

    if (dayjs().isSame(reminderDate, "day")) {
      await context.run(label, () =>
        sendReminderEmail({ to: subscription.user.email, type: label, subscription }),
      );
    }
  }
});
