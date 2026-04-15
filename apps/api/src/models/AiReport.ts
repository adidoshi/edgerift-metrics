import { Schema, Types, model } from "mongoose";

const aiReportSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, enum: ["week", "month"], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    report: { type: Schema.Types.Mixed, required: true },
    sourceTradeCount: { type: Number, required: true, min: 0 },
    sourceLastTradeAt: { type: Date, required: true },
  },
  { timestamps: true },
);

aiReportSchema.index({ userId: 1, createdAt: -1 });
aiReportSchema.index({ userId: 1, period: 1, periodStart: 1, periodEnd: 1 });
aiReportSchema.index({
  userId: 1,
  period: 1,
  sourceTradeCount: 1,
  sourceLastTradeAt: 1,
});

export const AiReportModel = model("AiReport", aiReportSchema);
