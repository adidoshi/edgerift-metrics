import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(currentDirectory, "../..");

for (const envPath of [path.join(apiDirectory, ".env.local")]) {
  dotenv.config({ path: envPath, override: false });
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  mongoUri:
    process.env.MONGODB_URI ??
    "mongodb+srv://adidoshi_db_user:N2uJ7OsvmjZsPfQn@edgerift-metrics-cluste.sdme5mv.mongodb.net/",
  jwtSecret: process.env.JWT_SECRET ?? "replace-me",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
};
