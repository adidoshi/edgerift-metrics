import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    startingBalance: { type: Number, required: true, default: 0, min: 0 },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const UserModel = model("User", userSchema);
