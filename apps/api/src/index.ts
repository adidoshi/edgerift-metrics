import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env";
import { authRouter } from "./routes/auth";
import { accountSettingsRouter } from "./routes/account-settings";
import { journalsRouter } from "./routes/journals";
import { tradesRouter } from "./routes/trades";
import { analyticsRouter } from "./routes/analytics";
import { errorHandler } from "./middleware/error";

const app = express();
const port = env.port;
const mongoUri = env.mongoUri;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadsDirectory = path.resolve(currentDirectory, "../uploads");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDirectory));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    service: "edgerift-api",
    status: "ok",
    health: "/api/v1/health",
  });
});

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "api", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account-settings", accountSettingsRouter);
app.use("/api/v1/journals", journalsRouter);
app.use("/api/v1/trades", tradesRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use(errorHandler);

const bootstrap = async () => {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start API", error);
    process.exit(1);
  }
};

void bootstrap();
