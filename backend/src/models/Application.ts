import mongoose, { Schema, Document, Types } from "mongoose";

export interface IApplication extends Document {
  requirement: Types.ObjectId;
  vendor: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  appliedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
  requirement: { type: Schema.Types.ObjectId, ref: "Requirement", required: true },
  vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  appliedAt: { type: Date, default: Date.now }
});

// a vendor can only apply once to the same requirement
ApplicationSchema.index({ requirement: 1, vendor: 1 }, { unique: true });

export default mongoose.model<IApplication>("Application", ApplicationSchema);
