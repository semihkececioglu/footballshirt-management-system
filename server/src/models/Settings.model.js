import mongoose from "mongoose";

const contactLinkSchema = new mongoose.Schema(
  {
    platform: { type: String },
    label: { type: String },
    link: { type: String },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    storeTitle: { type: String, default: "ildivincodino" },
    contactLinks: [contactLinkSchema],
    language: { type: String, default: "en", enum: ["tr", "en"] },
    currency: {
      type: String,
      default: "USD",
      enum: ["TRY", "EUR", "USD", "GBP"],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Settings", settingsSchema);
