import mongoose, { Schema, Document, Types } from "mongoose";

export type BidStatus = "submitted" | "under_review" | "shortlisted" | "rejected" | "awarded" | "withdrawn";

export interface IBidAnswer {
  fieldId: string;
  label: string;
  value: string;
}

export interface IBidDocument {
  name: string;
  fileUrl: string;
  source: "profile" | "uploaded"; // reused from vendor profile, or freshly uploaded for this bid
}

export interface IBid extends Document {
  bidId: string;
  tender: Types.ObjectId;
  vendor: Types.ObjectId;

  quotedAmount?: number;
  proposedStartDate?: Date;
  completionTime?: string;
  relevantExperience?: string;
  teamDetails?: string;
  equipmentDetails?: string;
  additionalNotes?: string;

  // labour-specific bid fields (only relevant when tender.category === "labour")
  availableLabourCategory?: string;
  availableQuantity?: number;
  proposedWage?: number;
  shiftAvailability?: string;
  accommodationCapability?: boolean;
  transportCapability?: boolean;
  replacementCapability?: boolean;

  answers: IBidAnswer[]; // answers to the tender's dynamic/custom fields
  documents: IBidDocument[];

  status: BidStatus;
  internalNotes?: string; // company-only notes about this bid
  appliedAt: Date;
}

const BidAnswerSchema = new Schema<IBidAnswer>({
  fieldId: String, label: String, value: String
}, { _id: false });

const BidDocumentSchema = new Schema<IBidDocument>({
  name: String, fileUrl: String, source: { type: String, enum: ["profile", "uploaded"] }
}, { _id: false });

const BidSchema = new Schema<IBid>({
  bidId: { type: String, required: true, unique: true },
  tender: { type: Schema.Types.ObjectId, ref: "Tender", required: true },
  vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },

  quotedAmount: Number,
  proposedStartDate: Date,
  completionTime: String,
  relevantExperience: String,
  teamDetails: String,
  equipmentDetails: String,
  additionalNotes: String,

  availableLabourCategory: String,
  availableQuantity: Number,
  proposedWage: Number,
  shiftAvailability: String,
  accommodationCapability: Boolean,
  transportCapability: Boolean,
  replacementCapability: Boolean,

  answers: { type: [BidAnswerSchema], default: [] },
  documents: { type: [BidDocumentSchema], default: [] },

  status: { type: String, enum: ["submitted", "under_review", "shortlisted", "rejected", "awarded", "withdrawn"], default: "submitted" },
  internalNotes: String,
  appliedAt: { type: Date, default: Date.now }
});

BidSchema.index({ tender: 1, vendor: 1 }, { unique: true });

export default mongoose.model<IBid>("Bid", BidSchema);
