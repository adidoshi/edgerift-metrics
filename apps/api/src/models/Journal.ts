import { Schema, model, Types } from "mongoose";

const journalSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

journalSchema.index({ userId: 1, createdAt: -1 });

export const JournalModel = model("Journal", journalSchema);
