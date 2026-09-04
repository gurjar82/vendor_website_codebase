import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "company" | "vendor" | "admin";
export type AccountStatus = "active" | "suspended";

export interface IAddress {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  status: AccountStatus;

  // Company-specific (role === "company")
  companyName?: string;
  companyType?: string;
  registrationNumber?: string;
  dateOfIncorporation?: Date;
  industry?: string;
  businessDescription?: string;
  website?: string;
  logoUrl?: string;

  // Vendor-specific (role === "vendor") - business identity fields.
  // Service/labour-specific fields live on VendorProfile, not here.
  businessName?: string;
  businessType?: string;
  ownerName?: string;
  businessStartDate?: Date;
  gstNumber?: string;

  address?: IAddress;

  createdAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  line1: String, city: String, state: String, country: String, pinCode: String
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["company", "vendor", "admin"], required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ["active", "suspended"], default: "active" },

  companyName: String,
  companyType: String,
  registrationNumber: String,
  dateOfIncorporation: Date,
  industry: String,
  businessDescription: String,
  website: String,
  logoUrl: String,

  businessName: String,
  businessType: String,
  ownerName: String,
  businessStartDate: Date,
  gstNumber: String,

  address: AddressSchema,

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", UserSchema);
