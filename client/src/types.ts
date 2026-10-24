export const CURRENCIES = ["USD", "EUR", "GBP", "PHP"] as const;
export const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;
export const CATEGORIES = [
  "entertainment",
  "technology",
  "lifestyle",
  "finance",
  "news",
  "sports",
  "politics",
  "other",
] as const;

export type Currency = (typeof CURRENCIES)[number];
export type Frequency = (typeof FREQUENCIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = "active" | "cancelled" | "expired";

export type User = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Subscription = {
  _id: string;
  name: string;
  price: number;
  currency: Currency;
  frequency: Frequency;
  category: Category;
  paymentMethod: string;
  status: Status;
  startDate: string;
  renewalDate: string;
  createdAt: string;
};

export type SubscriptionInput = Pick<
  Subscription,
  "name" | "price" | "currency" | "frequency" | "category" | "paymentMethod" | "startDate"
>;
