import type { Currency, Frequency, Subscription } from "../types";

const DAY = 86_400_000;

// Average periods per month, used to compare plans with different billing cycles.
const PER_MONTH: Record<Frequency, number> = {
  daily: 365.25 / 12,
  weekly: 52.18 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export const FREQUENCY_SHORT: Record<Frequency, string> = {
  daily: "/day",
  weekly: "/wk",
  monthly: "/mo",
  yearly: "/yr",
};

export const monthlyCost = (s: Pick<Subscription, "price" | "frequency">) => s.price * PER_MONTH[s.frequency];

export const money = (amount: number, currency: Currency, compact = false) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: compact && amount >= 1000 ? 0 : 2,
  }).format(amount);

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const daysUntil = (iso: string) => Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / DAY);

export const relativeDays = (days: number) => {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${-days}d ago`;
  return `in ${days}d`;
};

// Totals grouped per currency (no FX conversion). The currency used by the most
// subscriptions comes first, since amounts in different currencies can't be compared.
export const totalsByCurrency = (subs: Subscription[], toAmount: (s: Subscription) => number) => {
  const totals = new Map<Currency, { amount: number; count: number }>();
  for (const s of subs) {
    const t = totals.get(s.currency) ?? { amount: 0, count: 0 };
    totals.set(s.currency, { amount: t.amount + toAmount(s), count: t.count + 1 });
  }
  return [...totals.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].amount - a[1].amount)
    .map(([currency, t]) => [currency, t.amount] as const);
};

export const toDateInput = (iso: string) => iso.slice(0, 10);
export const todayInput = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
