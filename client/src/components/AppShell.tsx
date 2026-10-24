import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive ? "bg-sunken text-ink" : "text-muted hover:text-ink"
  }`;

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" className="mr-3">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Overview
            </NavLink>
            <NavLink to="/account" className={navClass}>
              Account
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent"
              title={user?.email}
            >
              {initials}
            </span>
            <button type="button" onClick={signOut} className="btn-ghost hidden sm:inline-flex">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
