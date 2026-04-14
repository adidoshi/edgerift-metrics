import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  mongoUri:
    process.env.MONGODB_URI ??
    "mongodb+srv://adidoshi_db_user:N2uJ7OsvmjZsPfQn@edgerift-metrics-cluste.sdme5mv.mongodb.net/",
  jwtSecret: process.env.JWT_SECRET ?? "replace-me",
};
