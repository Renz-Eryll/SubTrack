import type { Subscription, SubscriptionInput, User } from "../types";

const BASE_URL = "/api/v1";
const TOKEN_KEY = "subtrack.token";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Called when the API rejects the stored token, so the app can sign out.
let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(body.error || body.message || "Something went wrong. Try again.", res.status);
  }
  return body.data as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

type AuthResult = { token: string; user: User };

export const api = {
  signIn: (email: string, password: string) =>
    request<AuthResult>("/auth/sign-in", json("POST", { email, password })),
  signUp: (name: string, email: string, password: string) =>
    request<AuthResult>("/auth/sign-up", json("POST", { name, email, password })),

  getUser: (id: string) => request<User>(`/users/${id}`),
  updateUser: (id: string, data: Partial<Pick<User, "name" | "email">> & { password?: string }) =>
    request<User>(`/users/${id}`, json("PUT", data)),
  deleteUser: (id: string) => request<void>(`/users/${id}`, json("DELETE")),

  listSubscriptions: () => request<Subscription[]>("/subscriptions"),
  upcomingRenewals: (days = 14) => request<Subscription[]>(`/subscriptions/upcoming-renewals?days=${days}`),
  createSubscription: (data: SubscriptionInput) =>
    request<{ subscription: Subscription }>("/subscriptions", json("POST", data)).then((r) => r.subscription),
  updateSubscription: (id: string, data: Partial<SubscriptionInput>) =>
    request<Subscription>(`/subscriptions/${id}`, json("PUT", data)),
  cancelSubscription: (id: string) => request<Subscription>(`/subscriptions/${id}/cancel`, json("PUT")),
  deleteSubscription: (id: string) => request<void>(`/subscriptions/${id}`, json("DELETE")),
};
