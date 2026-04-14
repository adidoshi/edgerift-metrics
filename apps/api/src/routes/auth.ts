import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "@edgerift/contracts";
import { UserModel } from "../models/User";
import { env } from "../config/env";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const existing = await UserModel.findOne({ email: parsed.data.email }).lean();
  if (existing) {
    res.status(409).json({ message: "Email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await UserModel.create({
    email: parsed.data.email,
    passwordHash,
  });

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.jwtSecret,
    {
      expiresIn: "12h",
    },
  );

  res
    .status(201)
    .json({ token, user: { id: user._id.toString(), email: user.email } });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const user = await UserModel.findOne({ email: parsed.data.email });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.jwtSecret,
    {
      expiresIn: "12h",
    },
  );

  res.json({ token, user: { id: user._id.toString(), email: user.email } });
});
