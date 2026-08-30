import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVendorProfile extends Document {
  user: Types.ObjectId;
  category: string; // e.g. "canteen", "water_supply", "transport", "labour", "security", "housekeeping"
  experienceYears: number;
  description: string;
  achievements: string;
  documentUrls: string[]; // photo/document links - stored as URLs for this POC
  verified: boolean;
  createdAt: Date;
}

const VendorProfileSchema = new Schema<IVendorProfile>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  category: { type: String, required: true },
  experienceYears: { type: Number, required: true, default: 0 },
  description: { type: String, default: "" },
  achievements: { type: String, default: "" },
  documentUrls: { type: [String], default: [] },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IVendorProfile>("VendorProfile", VendorProfileSchema);
