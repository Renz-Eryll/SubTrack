import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  FREQUENCY_SHORT,
  daysUntil,
  longDate,
  money,
  monthlyCost,
  relativeDays,
  shortDate,
  totalsByCurrency,
} from "../lib/format";
import SubscriptionDialog from "../components/SubscriptionDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Status, Subscription } from "../types";

type Filter = Status | "all";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

const SOON_DAYS = 14;

export default function Overview() {
  const queryClient = useQueryClient();
  const { data: subs = [], isPending, error, refetch } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: api.listSubscriptions,
  });

  const [filter, setFilter] = useState<Filter>("active");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ type: "cancel" | "delete"; sub: Subscription } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  const cancelMutation = useMutation({ mutationFn: api.cancelSubscription, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: api.deleteSubscription, onSuccess: invalidate });
  const confirmMutation = confirm?.type === "delete" ? deleteMutation : cancelMutation;

  const active = useMemo(() => subs.filter((s) => s.status === "active"), [subs]);
  const monthly = useMemo(() => totalsByCurrency(active, monthlyCost), [active]);
  const upcoming = useMemo(
    () =>
      active
        .map((s) => ({ sub: s, days: daysUntil(s.renewalDate) }))
        .filter(({ days }) => days >= 0 && days <= SOON_DAYS)
        .sort((a, b) => a.days - b.days),
    [active],
  );
  const visible = filter === "all" ? subs : subs.filter((s) => s.status === filter);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: subs.length, active: 0, cancelled: 0, expired: 0 };
    subs.forEach((s) => c[s.status]++);
    return c;
  }, [subs]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (sub: Subscription) => {
    setEditing(sub);
    setFormOpen(true);
  };
  const runConfirm = () => {
    if (!confirm) return;
    confirmMutation.mutate(confirm.sub._id, { onSuccess: () => setConfirm(null) });
  };
  const closeConfirm = () => {
    setConfirm(null);
    cancelMutation.reset();
    deleteMutation.reset();
  };

  if (isPending) return <OverviewSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <p className="text-sm text-muted">{error.message}</p>
        <button type="button" onClick={() => refetch()} className="btn-outline mt-4">
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Monthly spend</p>
          {monthly.length === 0 ? (
            <p className="num mt-1 text-4xl font-semibold">—</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="num text-4xl font-semibold">{money(monthly[0][1], monthly[0][0])}</p>
              {monthly.slice(1).map(([currency, amount]) => (
                <p key={currency} className="num text-lg text-muted">
                  + {money(amount, currency)}
                </p>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={openNew} className="btn-primary">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
          Add subscription
        </button>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <Stat label="Per year" value={monthly.length ? money(monthly[0][1] * 12, monthly[0][0], true) : "—"} />
        <Stat label="Active" value={String(active.length)} />
        <Stat label={`Renewing in ${SOON_DAYS}d`} value={String(upcoming.length)} />
        <Stat
          label="Next charge"
          value={upcoming[0] ? upcoming[0].sub.name : "—"}
          hint={upcoming[0] ? relativeDays(upcoming[0].days) : undefined}
          text
        />
      </dl>

      {upcoming.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold">Coming up</h2>
          <ol className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {upcoming.map(({ sub, days }) => (
              <li
                key={sub._id}
                className={`min-w-44 flex-1 rounded-lg border p-4 ${
                  days <= 3 ? "border-warn/40 bg-warn-soft" : "border-line bg-surface"
                }`}
              >
                <p className={`text-xs font-medium ${days <= 3 ? "text-warn" : "text-muted"}`}>
                  {relativeDays(days)} · {shortDate(sub.renewalDate)}
                </p>
                <p className="mt-2 truncate text-sm font-medium">{sub.name}</p>
                <p className="num mt-0.5 text-sm text-muted">{money(sub.price, sub.currency)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Subscriptions</h2>
          <div role="tablist" className="flex gap-1 rounded-md bg-sunken p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  filter === f.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {f.label} <span className="num text-faint">{counts[f.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState hasAny={subs.length > 0} onAdd={openNew} />
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-visible rounded-xl border border-line bg-surface">
            {visible.map((sub) => (
              <SubscriptionRow
                key={sub._id}
                sub={sub}
                onEdit={() => openEdit(sub)}
                onCancel={() => setConfirm({ type: "cancel", sub })}
                onDelete={() => setConfirm({ type: "delete", sub })}
              />
            ))}
          </ul>
        )}
      </section>

      <SubscriptionDialog open={formOpen} onClose={() => setFormOpen(false)} subscription={editing} />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === "delete" ? `Delete ${confirm.sub.name}?` : `Cancel ${confirm?.sub.name}?`}
        confirmLabel={confirm?.type === "delete" ? "Delete" : "Mark as cancelled"}
        pending={confirmMutation.isPending}
        error={confirmMutation.error?.message}
        onConfirm={runConfirm}
        onClose={closeConfirm}
      >
        {confirm?.type === "delete"
          ? "This removes it and its history from SubTrack. It doesn't cancel the service itself."
          : "Reminders stop and it no longer counts toward your spend. Remember to cancel with the provider too."}
      </ConfirmDialog>
    </>
  );
}

function Stat({ label, value, hint, text }: { label: string; value: string; hint?: string; text?: boolean }) {
  return (
    <div className="min-w-0 bg-surface p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1.5 flex items-baseline gap-2">
        <span className={`truncate text-lg font-semibold ${text ? "tracking-tight" : "num"}`}>{value}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </dd>
    </div>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  active: "",
  cancelled: "bg-sunken text-muted",
  expired: "bg-danger-soft text-danger",
};

function SubscriptionRow({
  sub,
  onEdit,
  onCancel,
  onDelete,
}: {
  sub: Subscription;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const days = daysUntil(sub.renewalDate);
  const isActive = sub.status === "active";

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:gap-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-sm font-semibold text-muted">
        {sub.name[0]?.toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isActive ? "" : "text-muted"}`}>{sub.name}</p>
        <p className="truncate text-xs text-faint">
          {/* On small screens the renewal column is hidden, so show the date here. */}
          <span className={`sm:hidden ${isActive && days <= 3 ? "text-warn" : ""}`}>
            {isActive ? `${shortDate(sub.renewalDate)} · ` : <span className="capitalize">{sub.status} · </span>}
          </span>
          <span className="capitalize">{sub.category}</span> · {sub.paymentMethod}
        </p>
      </div>
      <div className="hidden w-36 text-right sm:block">
        {isActive ? (
          <>
            <p className="text-sm">{longDate(sub.renewalDate)}</p>
            <p className={`text-xs ${days <= 3 ? "text-warn" : "text-faint"}`}>{relativeDays(days)}</p>
          </>
        ) : (
          <span className={`rounded px-1.5 py-0.5 text-xs capitalize ${STATUS_STYLE[sub.status]}`}>{sub.status}</span>
        )}
      </div>
      <p className={`num w-28 text-right text-sm ${isActive ? "" : "text-faint line-through"}`}>
        {money(sub.price, sub.currency)}
        <span className="text-xs text-faint">{FREQUENCY_SHORT[sub.frequency]}</span>
      </p>
      <RowMenu isActive={isActive} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} />
    </li>
  );
}

function RowMenu({
  isActive,
  onEdit,
  onCancel,
  onDelete,
}: {
  isActive: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = (label: string, action: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        action();
      }}
      className={`block w-full rounded px-3 py-1.5 text-left text-sm hover:bg-sunken ${danger ? "text-danger" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1.5 text-faint hover:bg-sunken hover:text-ink"
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <circle cx="8" cy="3.5" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="8" cy="12.5" r="1.3" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-line bg-surface p-1 shadow-lg">
          {item("Edit", onEdit)}
          {isActive && item("Mark as cancelled", onCancel)}
          {item("Delete", onDelete, true)}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasAny, onAdd }: { hasAny: boolean; onAdd: () => void }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <p className="text-sm font-medium">{hasAny ? "Nothing here" : "No subscriptions yet"}</p>
      <p className="mt-1 text-sm text-muted">
        {hasAny ? "Try another filter." : "Add one to see your monthly spend and renewals."}
      </p>
      {!hasAny && (
        <button type="button" onClick={onAdd} className="btn-outline mt-5">
          Add your first subscription
        </button>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading">
      <div className="h-4 w-28 rounded bg-sunken" />
      <div className="mt-3 h-9 w-48 rounded bg-sunken" />
      <div className="mt-8 h-20 rounded-xl bg-sunken" />
      <div className="mt-10 h-64 rounded-xl bg-sunken" />
    </div>
  );
}
