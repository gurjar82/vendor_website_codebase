import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRequirement extends Document {
  company: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  location: string;
  status: "open" | "closed";
  createdAt: Date;
}

const RequirementSchema = new Schema<IRequirement>({
  company: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, default: "" },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRequirement>("Requirement", RequirementSchema);
