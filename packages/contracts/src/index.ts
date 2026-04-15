import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(80);
const shortSentenceSchema = z.string().trim().min(1).max(280);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: z.string().trim().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const createJournalSchema = z.object({
  title: z.string().min(1).max(120),
  notes: z.string().max(5000).optional(),
});

export const tradeInstrumentSchema = z.enum(["Forex", "Commodity", "Index"]);

export const tradeDirectionSchema = z.enum(["Buy", "Sell"]);

export const createTradeSchema = z
  .object({
    entryAt: z.string().datetime(),
    exitAt: z.string().datetime(),
    instrument: tradeInstrumentSchema,
    pair: z.string().trim().min(1).max(40),
    direction: tradeDirectionSchema,
    rMultiple: z.number(),
    grossPnL: z.number(),
    netPnL: z.number(),
    commissions: z.number().default(0),
    swapCharges: z.number().default(0),
    session: z.string().trim().min(1).max(80),
    strategy: z.string().trim().min(1).max(120),
    model: z.string().trim().min(1).max(120),
    tags: z.array(z.string().trim().min(1).max(50)).default([]),
    tradeIdea: z.string().trim().max(5000).default(""),
    comments: z.string().trim().max(5000).default(""),
    rulesFollowed: z.array(z.string().trim().min(1).max(120)).default([]),
    chartImageUrl: z.string().trim().min(1).max(500).optional(),
  })
  .superRefine((value, context) => {
    if (new Date(value.exitAt).getTime() < new Date(value.entryAt).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["exitAt"],
        message: "Exit date/time must be after entry date/time",
      });
    }
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

export const accountSettingsSchema = z.object({
  startingBalance: z.number().min(0),
});

export const updateAccountSettingsSchema = accountSettingsSchema;

export const mentorReportPeriodSchema = z.enum(["week", "month"]);

export const mentorReportRequestSchema = z.object({
  period: mentorReportPeriodSchema,
});

export const mentorReportSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(4000),
  performanceStatus: z.enum(["profitable", "losing", "breakeven", "mixed"]),
  keyDrivers: z.array(shortSentenceSchema).min(1).max(6),
  whatWentWell: z.array(shortSentenceSchema).min(1).max(6),
  whatWentWrong: z.array(shortSentenceSchema).min(1).max(6),
  behaviorSignals: z.array(shortSentenceSchema).min(1).max(6),
  recommendations: z.array(shortSentenceSchema).min(1).max(8),
  nextSteps: z.array(shortSentenceSchema).min(1).max(6),
  shouldTakeBreak: z.boolean(),
  shouldPaperTrade: z.boolean(),
  confidenceNote: z.string().trim().min(1).max(800),
});

export const mentorReportUsageSchema = z.object({
  reportsGeneratedToday: z.number().int().min(0),
  reportsRemainingToday: z.number().int().min(0),
  minimumTradesRequired: z.number().int().min(1),
  eligibleTradeCount: z.number().int().min(0),
});

export const mentorReportResponseSchema = z.object({
  report: mentorReportSchema,
  usage: mentorReportUsageSchema,
  generatedAt: z.string().datetime(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type CreateTradeInput = z.infer<typeof createTradeSchema>;
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;
export type AccountSettings = z.infer<typeof accountSettingsSchema>;
export type UpdateAccountSettingsInput = z.infer<
  typeof updateAccountSettingsSchema
>;
export type MentorReportPeriod = z.infer<typeof mentorReportPeriodSchema>;
export type MentorReportRequest = z.infer<typeof mentorReportRequestSchema>;
export type MentorReport = z.infer<typeof mentorReportSchema>;
export type MentorReportUsage = z.infer<typeof mentorReportUsageSchema>;
export type MentorReportResponse = z.infer<typeof mentorReportResponseSchema>;
