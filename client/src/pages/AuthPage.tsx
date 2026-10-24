import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../lib/auth";
import Logo from "../components/Logo";

type Mode = "sign-in" | "sign-up";

// Decorative preview of the product for the side panel.
const PREVIEW = [
  { name: "Spotify", meta: "Renews in 2d", price: "$11.99", soon: true },
  { name: "Figma", meta: "Renews Nov 12", price: "$15.00" },
  { name: "iCloud+", meta: "Renews Nov 18", price: "$2.99" },
  { name: "Notion", meta: "Renews Dec 1", price: "$10.00" },
];

export default function AuthPage({ mode }: { mode: Mode }) {
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      if (isSignUp) await signUp(name, email, password);
      else await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="self-start">
          <Logo />
        </Link>

        <div className="m-auto w-full max-w-sm py-12">
          <h1 className="text-2xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {isSignUp ? "Track every renewal before it charges you." : "Sign in to see what renews next."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isSignUp && (
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="field"
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="field"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="field"
                required
                type="password"
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignUp && <p className="mt-1.5 text-xs text-faint">At least 8 characters</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn-primary h-10 w-full">
              {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isSignUp ? "Already have an account? " : "New to SubTrack? "}
            <Link to={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-ink underline-offset-4 hover:underline">
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </main>

      <aside className="relative hidden overflow-hidden border-l border-line bg-sunken lg:flex lg:items-center lg:justify-center">
        <div className="w-80 -rotate-2 rounded-xl border border-line bg-surface p-5 shadow-xl">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted">This month</span>
            <span className="num text-xs text-faint">4 active</span>
          </div>
          <p className="num mt-1 text-3xl font-semibold">$39.98</p>
          <ul className="mt-5 divide-y divide-line">
            {PREVIEW.map((item) => (
              <li key={item.name} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 place-items-center rounded-md bg-sunken text-xs font-semibold text-muted">
                  {item.name[0]}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className={`block text-xs ${item.soon ? "text-warn" : "text-faint"}`}>{item.meta}</span>
                </span>
                <span className="num text-sm">{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
