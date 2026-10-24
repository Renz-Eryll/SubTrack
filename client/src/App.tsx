import type { ReactNode } from "react";
import { Link, Navigate, Route, Routes } from "react-router";
import { useAuth } from "./lib/auth";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import Overview from "./pages/Overview";
import Account from "./pages/Account";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <AppShell>{children}</AppShell> : <Navigate to="/sign-in" replace />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RequireAuth><Overview /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
      <Route path="/sign-in" element={<GuestOnly><AuthPage mode="sign-in" /></GuestOnly>} />
      <Route path="/sign-up" element={<GuestOnly><AuthPage mode="sign-up" /></GuestOnly>} />
      <Route
        path="*"
        element={
          <main className="grid min-h-dvh place-items-center p-6 text-center">
            <div>
              <p className="num text-sm text-faint">404</p>
              <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
              <Link to="/" className="btn-outline mt-6">
                Back to overview
              </Link>
            </div>
          </main>
        }
      />
    </Routes>
  );
}
