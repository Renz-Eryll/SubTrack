import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Account() {
  const { user, setUser, signOut } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const profile = useMutation({
    mutationFn: () => api.updateUser(user!._id, { name, email }),
    onSuccess: setUser,
  });
  const passwordChange = useMutation({
    mutationFn: () => api.updateUser(user!._id, { password }),
    onSuccess: () => setPassword(""),
  });
  const removal = useMutation({
    mutationFn: () => api.deleteUser(user!._id),
    onSuccess: signOut,
  });

  const profileDirty = name !== user?.name || email !== user?.email;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Account</h1>

      <Section title="Profile">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            profile.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="acc-name">
                Name
              </label>
              <input id="acc-name" className="field" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="acc-email">
                Email
              </label>
              <input id="acc-email" className="field" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Footer
            pending={profile.isPending}
            disabled={!profileDirty}
            error={profile.error?.message}
            success={profile.isSuccess && !profileDirty ? "Saved" : undefined}
          />
        </form>
      </Section>

      <Section title="Password">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            passwordChange.mutate();
          }}
          className="space-y-4"
        >
          <div className="sm:w-1/2 sm:pr-2">
            <label className="label" htmlFor="acc-password">
              New password
            </label>
            <input
              id="acc-password"
              className="field"
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Footer
            pending={passwordChange.isPending}
            disabled={!password}
            error={passwordChange.error?.message}
            success={passwordChange.isSuccess ? "Password updated" : undefined}
            label="Update password"
          />
        </form>
      </Section>

      <Section title="Session">
        <button type="button" onClick={signOut} className="btn-outline">
          Sign out
        </button>
      </Section>

      <Section title="Delete account" danger>
        <p className="text-sm text-muted">Removes your account and every subscription you've added.</p>
        <button type="button" onClick={() => setConfirmDelete(true)} className="btn-outline mt-4 text-danger">
          Delete account
        </button>
      </Section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        confirmLabel="Delete account"
        pending={removal.isPending}
        error={removal.error?.message}
        onConfirm={() => removal.mutate()}
        onClose={() => setConfirmDelete(false)}
      >
        This can't be undone.
      </ConfirmDialog>
    </div>
  );
}

function Section({ title, danger, children }: { title: string; danger?: boolean; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className={`mb-4 text-sm font-semibold ${danger ? "text-danger" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}

function Footer({
  pending,
  disabled,
  error,
  success,
  label = "Save",
}: {
  pending: boolean;
  disabled?: boolean;
  error?: string;
  success?: string;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button type="submit" disabled={pending || disabled} className="btn-primary">
        {pending ? "Saving…" : label}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
      {!error && success && <span className="text-sm text-accent">{success}</span>}
    </div>
  );
}
