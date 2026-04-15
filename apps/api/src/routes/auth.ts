import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "@edgerift/contracts";
import { UserModel } from "../models/User.js";
import { env } from "../config/env.js";

export const authRouter = Router();

const createAuthToken = (user: {
  _id: { toString(): string };
  email: string;
}) =>
  jwt.sign({ sub: user._id.toString(), email: user.email }, env.jwtSecret, {
    expiresIn: "12h",
  });

const toAuthUser = (user: {
  _id: { toString(): string };
  firstName: string;
  lastName: string;
  email: string;
}) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    res.status(409).json({ message: "Email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await UserModel.create({
    firstName: parsed.data.firstName.trim(),
    lastName: parsed.data.lastName.trim(),
    email,
    passwordHash,
  });

  const token = createAuthToken(user);

  res.status(201).json({ token, user: toAuthUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.flatten() });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = createAuthToken(user);

  res.json({ token, user: toAuthUser(user) });
});
