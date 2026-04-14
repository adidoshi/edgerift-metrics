import { Router } from "express";
import { createJournalSchema } from "@edgerift/contracts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { JournalModel } from "../models/Journal";

export const journalsRouter = Router();

journalsRouter.use(requireAuth);

journalsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const limit = Number(req.query.limit ?? 20);
  const journals = await JournalModel.find({ userId: req.user!.id })
    .sort({ createdAt: -1 })
    .limit(Number.isNaN(limit) ? 20 : limit)
    .lean();

  res.json({ data: journals });
});

journalsRouter.post("/", async (req: AuthenticatedRequest, res) => {
  const parsed = createJournalSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const journal = await JournalModel.create({
    userId: req.user!.id,
    title: parsed.data.title,
    notes: parsed.data.notes ?? "",
  });

  res.status(201).json({ data: journal });
});
