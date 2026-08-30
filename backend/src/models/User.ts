import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "company" | "vendor" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  companyName?: string; // only relevant when role === "company"
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["company", "vendor", "admin"], required: true },
  phone: { type: String, required: true },
  companyName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", UserSchema);
