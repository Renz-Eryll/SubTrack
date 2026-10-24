import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "./Modal";
import { api } from "../lib/api";
import { todayInput, toDateInput } from "../lib/format";
import {
  CATEGORIES,
  CURRENCIES,
  FREQUENCIES,
  type Currency,
  type Frequency,
  type Category,
  type Subscription,
  type SubscriptionInput,
} from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  // When set, the dialog edits this subscription instead of creating one.
  subscription?: Subscription | null;
};

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

const emptyForm = (): SubscriptionInput => ({
  name: "",
  price: 0,
  currency: "USD",
  frequency: "monthly",
  category: "entertainment",
  paymentMethod: "",
  startDate: todayInput(),
});

export default function SubscriptionDialog({ open, onClose, subscription }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={subscription ? "Edit subscription" : "New subscription"}>
      {/* Keyed so the form resets each time it opens for a different subscription. */}
      <SubscriptionForm key={subscription?._id ?? "new"} subscription={subscription} onDone={onClose} />
    </Modal>
  );
}

function SubscriptionForm({ subscription, onDone }: { subscription?: Subscription | null; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SubscriptionInput>(() =>
    subscription
      ? {
          name: subscription.name,
          price: subscription.price,
          currency: subscription.currency,
          frequency: subscription.frequency,
          category: subscription.category,
          paymentMethod: subscription.paymentMethod,
          startDate: toDateInput(subscription.startDate),
        }
      : emptyForm(),
  );
  const [price, setPrice] = useState(subscription ? String(subscription.price) : "");

  const mutation = useMutation({
    mutationFn: (data: SubscriptionInput) =>
      subscription ? api.updateSubscription(subscription._id, data) : api.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onDone();
    },
  });

  const set = <K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, price: Number(price) });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="sub-name">
          Name
        </label>
        <input
          id="sub-name"
          className="field"
          required
          minLength={2}
          maxLength={100}
          autoFocus
          placeholder="Netflix"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <div>
          <label className="label" htmlFor="sub-price">
            Price
          </label>
          <input
            id="sub-price"
            className="field num"
            required
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="sub-currency">
            Currency
          </label>
          <select
            id="sub-currency"
            className="field"
            value={form.currency}
            onChange={(e) => set("currency", e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Billed</legend>
        <div className="grid grid-cols-4 gap-1 rounded-md bg-sunken p-1">
          {FREQUENCIES.map((f) => (
            <label
              key={f}
              className="cursor-pointer rounded px-2 py-1.5 text-center text-sm text-muted transition-colors has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="frequency"
                value={f}
                checked={form.frequency === f}
                onChange={() => set("frequency", f as Frequency)}
                className="sr-only"
              />
              {capitalize(f)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="sub-category">
            Category
          </label>
          <select
            id="sub-category"
            className="field"
            value={form.category}
            onChange={(e) => set("category", e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sub-start">
            Started
          </label>
          <input
            id="sub-start"
            className="field"
            required
            type="date"
            max={todayInput()}
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="sub-payment">
          Paid with
        </label>
        <input
          id="sub-payment"
          className="field"
          required
          placeholder="Visa •• 4242"
          value={form.paymentMethod}
          onChange={(e) => set("paymentMethod", e.target.value)}
        />
      </div>

      {mutation.error && <p className="text-sm text-danger">{mutation.error.message}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? "Saving…" : subscription ? "Save changes" : "Add subscription"}
        </button>
      </div>
    </form>
  );
}
