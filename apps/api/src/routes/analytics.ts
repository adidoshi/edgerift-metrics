import { Router } from "express";
import {
  mentorReportRequestSchema,
  mentorReportResponseSchema,
  type MentorReportPeriod,
} from "@edgerift/contracts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { AiReportModel } from "../models/AiReport.js";
import { TradeModel } from "../models/Trade.js";
import { UserModel } from "../models/User.js";
import { env } from "../config/env.js";
import { mentorReportService } from "../services/mentor-report.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/overview", async (req: AuthenticatedRequest, res) => {
  const trades = await TradeModel.find({ userId: req.user!.id }).lean();

  const totalTrades = trades.length;
  const totalPnl = trades.reduce((acc, trade) => acc + (trade.netPnL ?? 0), 0);
  const wins = trades.filter((trade) => (trade.netPnL ?? 0) > 0).length;
  const losses = trades.filter((trade) => (trade.netPnL ?? 0) < 0).length;
  const winRate =
    totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(2)) : 0;

  const pnlBySymbol = Object.entries(
    trades.reduce<Record<string, number>>((acc, trade) => {
      const key = trade.pair;
      acc[key] = (acc[key] ?? 0) + (trade.netPnL ?? 0);
      return acc;
    }, {}),
  ).map(([symbol, pnl]) => ({ symbol, pnl }));

  res.json({
    data: {
      totalTrades,
      totalPnl,
      wins,
      losses,
      winRate,
      pnlBySymbol,
    },
  });
});

const resolveLastTradeTimestamp = (
  trades: Array<{
    entryAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }>,
) =>
  new Date(
    Math.max(
      ...trades.map((trade) =>
        (trade.updatedAt ?? trade.createdAt ?? trade.entryAt).getTime(),
      ),
    ),
  );

const isSameDate = (left: Date, right: Date) =>
  left.getTime() === right.getTime();

analyticsRouter.post(
  "/mentor-report",
  async (req: AuthenticatedRequest, res) => {
    const parsed = mentorReportRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ message: "Invalid payload", issues: parsed.error.flatten() });
      return;
    }

    if (!env.openAiApiKey) {
      res.status(503).json({ message: "AI reporting is not configured" });
      return;
    }

    const period = parsed.data.period as MentorReportPeriod;
    const periodRange = mentorReportService.getPeriodRange(period);
    const [user, trades] = await Promise.all([
      UserModel.findById(req.user!.id).select({ startingBalance: 1 }).lean(),
      TradeModel.find({
        userId: req.user!.id,
        entryAt: {
          $gte: periodRange.start,
          $lte: periodRange.end,
        },
      })
        .sort({ entryAt: 1 })
        .lean(),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (trades.length < mentorReportService.limits.minimumTrades) {
      res.status(400).json({
        message: `At least ${mentorReportService.limits.minimumTrades} trades are required to generate a mentor report`,
      });
      return;
    }

    const sourceLastTradeAt = resolveLastTradeTimestamp(trades);
    const cachedReport = await AiReportModel.findOne({
      userId: req.user!.id,
      period,
      periodStart: periodRange.start,
      periodEnd: periodRange.end,
      sourceTradeCount: trades.length,
      sourceLastTradeAt,
    })
      .sort({ createdAt: -1 })
      .lean();

    const reportsGeneratedToday = await AiReportModel.countDocuments({
      userId: req.user!.id,
      createdAt: { $gte: mentorReportService.startOfToday() },
    });

    const usage = {
      reportsGeneratedToday,
      reportsRemainingToday: Math.max(
        mentorReportService.limits.reportsPerDay - reportsGeneratedToday,
        0,
      ),
      minimumTradesRequired: mentorReportService.limits.minimumTrades,
      eligibleTradeCount: trades.length,
    };

    if (cachedReport) {
      res.json({
        data: mentorReportResponseSchema.parse({
          report: cachedReport.report,
          usage,
          generatedAt: cachedReport.createdAt.toISOString(),
          periodStart: cachedReport.periodStart.toISOString(),
          periodEnd: cachedReport.periodEnd.toISOString(),
        }),
      });
      return;
    }

    if (reportsGeneratedToday >= mentorReportService.limits.reportsPerDay) {
      res.status(429).json({
        message: `Daily AI report limit reached. You can generate up to ${mentorReportService.limits.reportsPerDay} reports per day.`,
      });
      return;
    }

    const summary = mentorReportService.buildSummary({
      period,
      startBalance: user.startingBalance ?? 0,
      trades,
    });
    const report = await mentorReportService.createReport(summary);
    const savedReport = await AiReportModel.create({
      userId: req.user!.id,
      period,
      periodStart: periodRange.start,
      periodEnd: periodRange.end,
      report,
      sourceTradeCount: trades.length,
      sourceLastTradeAt,
    });

    const nextUsage = {
      ...usage,
      reportsGeneratedToday: reportsGeneratedToday + 1,
      reportsRemainingToday: Math.max(
        mentorReportService.limits.reportsPerDay - reportsGeneratedToday - 1,
        0,
      ),
    };

    res.json({
      data: mentorReportResponseSchema.parse({
        report,
        usage: nextUsage,
        generatedAt: savedReport.createdAt.toISOString(),
        periodStart: savedReport.periodStart.toISOString(),
        periodEnd: savedReport.periodEnd.toISOString(),
      }),
    });
  },
);
