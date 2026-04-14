import { Router } from "express";
import { createTradeSchema } from "@edgerift/contracts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { TradeModel } from "../models/Trade";

export const tradesRouter = Router();

tradesRouter.use(requireAuth);

tradesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const symbol = (req.query.symbol as string | undefined)?.toUpperCase();
  const query = symbol
    ? { userId: req.user!.id, symbol }
    : { userId: req.user!.id };

  const trades = await TradeModel.find(query)
    .sort({ openedAt: -1 })
    .limit(100)
    .lean();
  res.json({ data: trades });
});

tradesRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const parsed = createTradeSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const { entryPrice, exitPrice, quantity } = parsed.data;
  const pnl =
    typeof exitPrice === "number" ? (exitPrice - entryPrice) * quantity : 0;

  const trade = await TradeModel.create({
    userId: req.user!.id,
    symbol: parsed.data.symbol,
    side: parsed.data.side,
    quantity: parsed.data.quantity,
    entryPrice: parsed.data.entryPrice,
    exitPrice: parsed.data.exitPrice,
    openedAt: parsed.data.openedAt,
    closedAt: parsed.data.closedAt,
    journalId: parsed.data.journalId,
    pnl,
  });

  res.status(201).json({ data: trade });
});
