import { Router } from "express";
import multer from "multer";
import { createTradeSchema } from "@edgerift/contracts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { TradeModel } from "../models/Trade.js";
import { uploadTradeChart } from "../services/cloudinary.js";

export const tradesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("Only PNG, JPG, and JPEG images are allowed"));
      return;
    }

    callback(null, true);
  },
});

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmedValue) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall back to treating the value as a single item.
  }

  return [trimmedValue];
};

const normalizeDateTime = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return undefined;
    }

    if (/^\d+$/.test(trimmedValue)) {
      const numericValue = BigInt(trimmedValue);
      const milliseconds =
        trimmedValue.length > 13
          ? Number(numericValue / 1_000_000n)
          : Number(numericValue);
      return new Date(milliseconds).toISOString();
    }

    return new Date(trimmedValue).toISOString();
  }

  if (typeof value === "number") {
    return new Date(
      value > 10_000_000_000_000 ? value / 1_000_000 : value,
    ).toISOString();
  }

  if (typeof value === "bigint") {
    return new Date(Number(value / 1_000_000n)).toISOString();
  }

  return undefined;
};

const normalizeDirection = (value: unknown): "Buy" | "Sell" | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim().toUpperCase();
  if (normalizedValue === "BUY" || normalizedValue === "LONG") {
    return "Buy";
  }

  if (normalizedValue === "SELL" || normalizedValue === "SHORT") {
    return "Sell";
  }

  return undefined;
};

const normalizeTradePayload = (
  req: AuthenticatedRequest,
  chartImageUrl?: string,
) => ({
  entryAt: normalizeDateTime(req.body.entryAt ?? req.body.startDateTime),
  exitAt: normalizeDateTime(req.body.exitAt ?? req.body.endDateTime),
  instrument: req.body.instrument ?? req.body.assetClass,
  pair:
    typeof req.body.pair === "string"
      ? req.body.pair.trim().toUpperCase()
      : req.body.pair,
  direction: normalizeDirection(req.body.direction),
  rMultiple: Number(req.body.rMultiple ?? 0),
  grossPnL: Number(req.body.grossPnL ?? 0),
  netPnL: Number(req.body.netPnL ?? 0),
  commissions: Number(req.body.commissions ?? 0),
  swapCharges: Number(req.body.swapCharges ?? 0),
  session:
    typeof req.body.session === "string"
      ? req.body.session.trim()
      : req.body.session,
  strategy:
    typeof req.body.strategy === "string"
      ? req.body.strategy.trim()
      : req.body.strategy,
  model:
    typeof req.body.model === "string" ? req.body.model.trim() : req.body.model,
  tags: parseStringArray(req.body.tags),
  tradeIdea:
    typeof req.body.tradeIdea === "string" ? req.body.tradeIdea.trim() : "",
  comments:
    typeof req.body.comments === "string" ? req.body.comments.trim() : "",
  rulesFollowed: parseStringArray(req.body.rulesFollowed),
  chartImageUrl:
    chartImageUrl ??
    (typeof req.body.chartImageUrl === "string" && req.body.chartImageUrl.trim()
      ? req.body.chartImageUrl.trim()
      : undefined),
});

tradesRouter.use(requireAuth);

tradesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const pair = (req.query.pair as string | undefined)?.toUpperCase();
  const instrument = req.query.instrument as string | undefined;
  const limit = Number(req.query.limit ?? 100);
  const query = {
    userId: req.user!.id,
    ...(pair ? { pair } : {}),
    ...(instrument ? { instrument } : {}),
  };

  const trades = await TradeModel.find(query)
    .sort({ entryAt: -1 })
    .limit(Number.isNaN(limit) ? 100 : Math.min(limit, 200))
    .lean();

  res.json({ data: trades });
});

tradesRouter.post("/", upload.any(), async (req: AuthenticatedRequest, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const uploadedImageUrl = files[0]
    ? await uploadTradeChart(files[0])
    : undefined;
  const parsed = createTradeSchema.safeParse(
    normalizeTradePayload(req, uploadedImageUrl),
  );
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const trade = await TradeModel.create({
    userId: req.user!.id,
    entryAt: parsed.data.entryAt,
    exitAt: parsed.data.exitAt,
    instrument: parsed.data.instrument,
    pair: parsed.data.pair,
    direction: parsed.data.direction,
    rMultiple: parsed.data.rMultiple,
    grossPnL: parsed.data.grossPnL,
    netPnL: parsed.data.netPnL,
    commissions: parsed.data.commissions,
    swapCharges: parsed.data.swapCharges,
    session: parsed.data.session,
    strategy: parsed.data.strategy,
    model: parsed.data.model,
    tags: parsed.data.tags,
    tradeIdea: parsed.data.tradeIdea,
    comments: parsed.data.comments,
    rulesFollowed: parsed.data.rulesFollowed,
    chartImageUrl: parsed.data.chartImageUrl,
  });

  res.status(201).json({ data: trade });
});

tradesRouter.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const trade = await TradeModel.findOne({
    _id: req.params.id,
    userId: req.user!.id,
  });

  if (!trade) {
    res.status(404).json({ message: "Trade not found" });
    return;
  }

  await trade.deleteOne();

  res.status(204).send();
});
