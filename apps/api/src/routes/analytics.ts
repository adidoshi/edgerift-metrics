import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { TradeModel } from "../models/Trade";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/overview", async (req: AuthenticatedRequest, res) => {
  const trades = await TradeModel.find({ userId: req.user!.id }).lean();

  const totalTrades = trades.length;
  const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl ?? 0), 0);
  const wins = trades.filter((trade) => (trade.pnl ?? 0) > 0).length;
  const losses = trades.filter((trade) => (trade.pnl ?? 0) < 0).length;
  const winRate =
    totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(2)) : 0;

  const pnlBySymbol = Object.entries(
    trades.reduce<Record<string, number>>((acc, trade) => {
      const key = trade.symbol;
      acc[key] = (acc[key] ?? 0) + (trade.pnl ?? 0);
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
