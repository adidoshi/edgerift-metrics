import {
  accountSettingsSchema,
  analyticsOverviewSchema,
  createTradeSchema,
  loginSchema,
  mentorReportRequestSchema,
  mentorReportResponseSchema,
  registerSchema,
  updateAccountSettingsSchema,
  type AccountSettings,
  type AnalyticsOverview,
  type CreateTradeInput,
  type LoginInput,
  type MentorReportRequest,
  type MentorReportResponse,
  type RegisterInput,
  type UpdateAccountSettingsInput,
} from "@edgerift/contracts";
import { type Trade } from "../types/trading";
import { authStore } from "./auth";

type ApiErrorPayload = {
  message?: string;
  issues?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type ApiTrade = {
  _id?: string;
  id?: string;
  entryAt: string;
  exitAt: string;
  instrument: Trade["instrument"];
  pair: string;
  direction: Trade["direction"];
  rMultiple: number;
  grossPnL: number;
  netPnL: number;
  commissions?: number;
  swapCharges?: number;
  tags?: string[];
  session: string;
  strategy: string;
  model: string;
  tradeIdea?: string;
  comments?: string;
  rulesFollowed?: string[];
  chartImageUrl?: string;
  createdAt?: string;
};

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

const toMicroseconds = (value: string | undefined) => {
  if (!value) {
    return 0n;
  }

  return BigInt(new Date(value).getTime()) * 1_000_000n;
};

const resolveAssetUrl = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return API_BASE_URL ? `${API_BASE_URL}${value}` : value;
};

const mapTrade = (trade: ApiTrade): Trade => ({
  id: trade.id ?? trade._id ?? crypto.randomUUID(),
  startDateTime: toMicroseconds(trade.entryAt),
  endDateTime: toMicroseconds(trade.exitAt),
  instrument: trade.instrument,
  pair: trade.pair,
  direction: trade.direction,
  rMultiple: trade.rMultiple,
  grossPnL: trade.grossPnL,
  netPnL: trade.netPnL,
  commissions: trade.commissions ?? 0,
  swapCharges: trade.swapCharges ?? 0,
  tags: trade.tags ?? [],
  session: trade.session,
  strategy: trade.strategy,
  model: trade.model,
  tradeIdea: trade.tradeIdea ?? "",
  comments: trade.comments ?? "",
  rulesFollowed: trade.rulesFollowed ?? [],
  chartImageUrl: resolveAssetUrl(trade.chartImageUrl),
  createdAt: toMicroseconds(trade.createdAt ?? trade.entryAt),
});

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = authStore.getToken();
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorPayload = (await response
      .json()
      .catch(() => ({ message: "Request failed" }))) as ApiErrorPayload;
    throw new ApiError(response.status, errorPayload);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  health: () =>
    apiRequest<{ ok: boolean; service: string; timestamp: string }>(
      "/api/v1/health",
    ),

  register: async (payload: RegisterInput) => {
    registerSchema.parse(payload);
    return apiRequest<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: LoginInput) => {
    loginSchema.parse(payload);
    return apiRequest<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createTrade: async (payload: CreateTradeInput | FormData) => {
    if (!(payload instanceof FormData)) {
      createTradeSchema.parse(payload);
    }

    return apiRequest<{ data: unknown }>("/api/v1/trades", {
      method: "POST",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  },

  getTrades: async (): Promise<Trade[]> => {
    const response = await apiRequest<{ data: ApiTrade[] }>("/api/v1/trades");
    return response.data.map(mapTrade);
  },

  deleteTrade: async (tradeId: string) => {
    await apiRequest<void>(`/api/v1/trades/${tradeId}`, {
      method: "DELETE",
    });
  },

  analyticsOverview: async (): Promise<AnalyticsOverview> => {
    const response = await apiRequest<{ data: unknown }>(
      "/api/v1/analytics/overview",
    );
    return analyticsOverviewSchema.parse(response.data);
  },

  getAccountSettings: async (): Promise<AccountSettings> => {
    const response = await apiRequest<{ data: unknown }>(
      "/api/v1/account-settings",
    );
    return accountSettingsSchema.parse(response.data);
  },

  updateAccountSettings: async (
    payload: UpdateAccountSettingsInput,
  ): Promise<AccountSettings> => {
    updateAccountSettingsSchema.parse(payload);
    const response = await apiRequest<{ data: unknown }>(
      "/api/v1/account-settings",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
    return accountSettingsSchema.parse(response.data);
  },

  generateMentorReport: async (
    payload: MentorReportRequest,
  ): Promise<MentorReportResponse> => {
    mentorReportRequestSchema.parse(payload);
    const response = await apiRequest<{ data: unknown }>(
      "/api/v1/analytics/mentor-report",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return mentorReportResponseSchema.parse(response.data);
  },
};
