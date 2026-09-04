import mongoose, { Schema, Document, Types } from "mongoose";

export type FieldType = "text" | "number" | "date" | "dropdown" | "multiselect" | "checkbox" | "textarea" | "file" | "table";

export interface ITenderField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

export interface IRequiredDocument {
  name: string;
  required: boolean;
  description?: string;
}

export interface ITender extends Document {
  company: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  scopeOfWork?: string;
  location: string;
  referenceNumber: string;
  estimatedBudget?: number;
  expectedStartDate?: Date;
  expectedEndDate?: Date;
  submissionDeadline?: Date;
  termsAndConditions?: string;
  fields: ITenderField[];          // category template fields + company custom fields, merged
  requiredDocuments: IRequiredDocument[];
  status: "open" | "closed" | "awarded";
  awardedBid?: Types.ObjectId;
  createdAt: Date;
}

const TenderFieldSchema = new Schema<ITenderField>({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  options: [String],
  required: { type: Boolean, default: false }
}, { _id: false });

const RequiredDocumentSchema = new Schema<IRequiredDocument>({
  name: { type: String, required: true },
  required: { type: Boolean, default: true },
  description: String
}, { _id: false });

const TenderSchema = new Schema<ITender>({
  company: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  scopeOfWork: String,
  location: { type: String, default: "" },
  referenceNumber: { type: String, required: true },
  estimatedBudget: Number,
  expectedStartDate: Date,
  expectedEndDate: Date,
  submissionDeadline: Date,
  termsAndConditions: String,
  fields: { type: [TenderFieldSchema], default: [] },
  requiredDocuments: { type: [RequiredDocumentSchema], default: [] },
  status: { type: String, enum: ["open", "closed", "awarded"], default: "open" },
  awardedBid: { type: Schema.Types.ObjectId, ref: "Bid" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITender>("Tender", TenderSchema);
