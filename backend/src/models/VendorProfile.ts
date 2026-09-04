import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDocument {
  _id?: Types.ObjectId;
  name: string;
  category: string;
  fileUrl: string;
  uploadedAt: Date;
  expiryDate?: Date;
  verified: boolean;
}

export interface IPreviousWork {
  _id?: Types.ObjectId;
  title: string;
  clientName: string;
  category: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  contractDuration?: string;
  contractValue?: number;
  manpowerSupplied?: number;
  workStatus: "ongoing" | "completed";
  workOrderUrl?: string;
  completionCertificateUrl?: string;
  contractDocumentUrl?: string;
  photoUrls: string[];
  notes?: string;
}

export interface ILabourDetails {
  labourSupplyTypes: string[];
  totalManpower?: number;
  maxCapacity?: number;
  serviceLocations?: string;
  accommodation: boolean;
  transportation: boolean;
  payrollCapability: boolean;
}

export interface IVendorProfile extends Document {
  user: Types.ObjectId;
  categories: string[]; // a vendor can offer more than one service
  experienceYears: number;
  description: string;
  achievements: string;
  labourDetails?: ILabourDetails;
  previousWork: IPreviousWork[];
  documents: IDocument[];
  verified: boolean;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  expiryDate: Date,
  verified: { type: Boolean, default: false }
});

const PreviousWorkSchema = new Schema<IPreviousWork>({
  title: { type: String, required: true },
  clientName: { type: String, required: true },
  category: { type: String, required: true },
  description: String,
  location: String,
  startDate: Date,
  endDate: Date,
  contractDuration: String,
  contractValue: Number,
  manpowerSupplied: Number,
  workStatus: { type: String, enum: ["ongoing", "completed"], default: "completed" },
  workOrderUrl: String,
  completionCertificateUrl: String,
  contractDocumentUrl: String,
  photoUrls: { type: [String], default: [] },
  notes: String
});

const LabourDetailsSchema = new Schema<ILabourDetails>({
  labourSupplyTypes: { type: [String], default: [] },
  totalManpower: Number,
  maxCapacity: Number,
  serviceLocations: String,
  accommodation: { type: Boolean, default: false },
  transportation: { type: Boolean, default: false },
  payrollCapability: { type: Boolean, default: false }
}, { _id: false });

const VendorProfileSchema = new Schema<IVendorProfile>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  categories: { type: [String], required: true, default: [] },
  experienceYears: { type: Number, required: true, default: 0 },
  description: { type: String, default: "" },
  achievements: { type: String, default: "" },
  labourDetails: LabourDetailsSchema,
  previousWork: { type: [PreviousWorkSchema], default: [] },
  documents: { type: [DocumentSchema], default: [] },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IVendorProfile>("VendorProfile", VendorProfileSchema);
