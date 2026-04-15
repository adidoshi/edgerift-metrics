import { Schema, model, Types } from "mongoose";

const tradeSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    entryAt: { type: Date, required: true, index: true },
    exitAt: { type: Date, required: true },
    instrument: {
      type: String,
      enum: ["Forex", "Commodity", "Index"],
      required: true,
    },
    pair: { type: String, required: true, uppercase: true, trim: true },
    direction: { type: String, enum: ["Buy", "Sell"], required: true },
    rMultiple: { type: Number, required: true },
    grossPnL: { type: Number, required: true },
    netPnL: { type: Number, required: true },
    commissions: { type: Number, default: 0 },
    swapCharges: { type: Number, default: 0 },
    session: { type: String, required: true, trim: true },
    strategy: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    tradeIdea: { type: String, default: "" },
    comments: { type: String, default: "" },
    rulesFollowed: { type: [String], default: [] },
    chartImageUrl: { type: String },
  },
  { timestamps: true },
);

tradeSchema.index({ userId: 1, pair: 1, entryAt: -1 });
tradeSchema.index({ userId: 1, entryAt: -1 });

export const TradeModel = model("Trade", tradeSchema);
