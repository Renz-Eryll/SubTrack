import mongoose from "mongoose";
import dayjs from "dayjs";

const PERIOD_UNITS = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };

// First renewal on or after today, counting whole periods from the start date.
export const nextRenewalDate = (startDate, frequency) => {
  const unit = PERIOD_UNITS[frequency];
  const start = dayjs(startDate);
  const periods = Math.max(1, Math.ceil(dayjs().startOf("day").diff(start, unit, true)));
  return start.add(periods, unit).toDate();
};

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: [0, "Price must be greater than 0"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "PHP"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: [true, "Billing frequency is required"],
    },
    category: {
      type: String,
      enum: [
        "sports",
        "news",
        "entertainment",
        "lifestyle",
        "technology",
        "finance",
        "politics",
        "other",
      ],
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Start date can't be in the future",
      },
    },
    renewalDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after the start date",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Fill in (or recompute) the next renewal date when the billing schedule changes.
subscriptionSchema.pre("validate", function (next) {
  const scheduleChanged = this.isModified("startDate") || this.isModified("frequency");
  if (this.startDate && this.frequency && (!this.renewalDate || (scheduleChanged && !this.isModified("renewalDate")))) {
    this.renewalDate = nextRenewalDate(this.startDate, this.frequency);
  }
  next();
});

// A renewal date explicitly set in the past means the subscription has lapsed.
subscriptionSchema.pre("save", function (next) {
  if (this.status === "active" && this.renewalDate < dayjs().startOf("day").toDate()) {
    this.status = "expired";
  }
  next();
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
