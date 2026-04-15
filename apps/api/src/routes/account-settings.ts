import { Router } from "express";
import {
  accountSettingsSchema,
  updateAccountSettingsSchema,
} from "@edgerift/contracts";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";

export const accountSettingsRouter = Router();

accountSettingsRouter.use(requireAuth);

accountSettingsRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const user = await UserModel.findById(req.user!.id)
    .select({ startingBalance: 1 })
    .lean();

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    data: accountSettingsSchema.parse({
      startingBalance: user.startingBalance ?? 0,
    }),
  });
});

accountSettingsRouter.put("/", async (req: AuthenticatedRequest, res) => {
  const parsed = updateAccountSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const user = await UserModel.findByIdAndUpdate(
    req.user!.id,
    { startingBalance: parsed.data.startingBalance },
    {
      new: true,
      runValidators: true,
      select: { startingBalance: 1 },
    },
  ).lean();

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    data: accountSettingsSchema.parse({
      startingBalance: user.startingBalance ?? 0,
    }),
  });
});
