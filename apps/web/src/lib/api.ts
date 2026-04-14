import {
  analyticsOverviewSchema,
  createTradeSchema,
  loginSchema,
  registerSchema,
  type AnalyticsOverview,
  type CreateTradeInput,
  type LoginInput,
} from "@edgerift/contracts";
import { authStore } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = authStore.getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(errorPayload.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
};

export const api = {
  health: () =>
    apiRequest<{ ok: boolean; service: string; timestamp: string }>(
      "/api/v1/health",
    ),

  register: async (payload: LoginInput) => {
    registerSchema.parse(payload);
    return apiRequest<{ token: string; user: { id: string; email: string } }>(
      "/api/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  login: async (payload: LoginInput) => {
    loginSchema.parse(payload);
    return apiRequest<{ token: string; user: { id: string; email: string } }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  createTrade: async (payload: CreateTradeInput) => {
    createTradeSchema.parse(payload);
    return apiRequest<{ data: unknown }>("/api/v1/trades", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  analyticsOverview: async (): Promise<AnalyticsOverview> => {
    const response = await apiRequest<{ data: unknown }>(
      "/api/v1/analytics/overview",
    );
    return analyticsOverviewSchema.parse(response.data);
  },
};
