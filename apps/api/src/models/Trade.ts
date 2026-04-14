import { Schema, model, Types } from "mongoose";

const tradeSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    side: { type: String, enum: ["LONG", "SHORT"], required: true },
    quantity: { type: Number, required: true, min: 0 },
    entryPrice: { type: Number, required: true, min: 0 },
    exitPrice: { type: Number, required: false, min: 0 },
    pnl: { type: Number, default: 0 },
    journalId: { type: Types.ObjectId, ref: "Journal" },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date },
  },
  { timestamps: true },
);

tradeSchema.index({ userId: 1, symbol: 1, openedAt: -1 });
tradeSchema.index({ userId: 1, openedAt: -1 });

export const TradeModel = model("Trade", tradeSchema);
