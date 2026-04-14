import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = loginSchema;

export const createJournalSchema = z.object({
  title: z.string().min(1).max(120),
  notes: z.string().max(5000).optional(),
});

export const createTradeSchema = z.object({
  symbol: z.string().min(1).max(20),
  side: z.enum(["LONG", "SHORT"]),
  quantity: z.number().positive(),
  entryPrice: z.number().positive(),
  exitPrice: z.number().nonnegative().optional(),
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
  journalId: z.string().optional(),
});

export const analyticsOverviewSchema = z.object({
  totalTrades: z.number(),
  totalPnl: z.number(),
  wins: z.number(),
  losses: z.number(),
  winRate: z.number(),
  pnlBySymbol: z.array(
    z.object({
      symbol: z.string(),
      pnl: z.number(),
    }),
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
