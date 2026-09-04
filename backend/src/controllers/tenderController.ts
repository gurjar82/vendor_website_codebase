import { Request, Response } from "express";
import Tender from "../models/Tender";
import VendorProfile from "../models/VendorProfile";
import { CATEGORY_TENDER_FIELDS } from "../config/categories";
import { notify } from "../utils/notify";

function generateReferenceNumber() {
  const y = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TND-${y}-${rand}`;
}

// GET /api/tenders?category=labour&location=jaipur&minBudget=&maxBudget=&status=open  (public)
export async function listTenders(req: Request, res: Response) {
  const { category, location, status, q } = req.query;
  const filter: Record<string, unknown> = { status: status || "open" };
  if (category) filter.category = category;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (q) filter.title = { $regex: q, $options: "i" };

  const tenders = await Tender.find(filter)
    .populate("company", "name companyName")
    .sort({ createdAt: -1 });
  res.json(tenders);
}

// GET /api/tenders/latest?limit=6  (public - homepage)
export async function latestTenders(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 6;
  const tenders = await Tender.find({ status: "open" })
    .populate("company", "name companyName")
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(tenders);
}

// GET /api/tenders/:id  (public)
export async function getTender(req: Request, res: Response) {
  const tender = await Tender.findById(req.params.id).populate("company", "name companyName phone email");
  if (!tender) return res.status(404).json({ message: "Tender not found" });
  res.json(tender);
}

// POST /api/tenders  (company auth) - fields/requiredDocuments come from the tender-builder UI
export async function createTender(req: Request, res: Response) {
  const b = req.body;
  if (!b.category || !b.title) return res.status(400).json({ message: "Category and title are required" });

  // merge category template fields (as a starting suggestion) with any custom fields the company added
  const templateFields = CATEGORY_TENDER_FIELDS[b.category] || [];
  const customFields = Array.isArray(b.customFields) ? b.customFields : [];
  const fields = [...templateFields, ...customFields];

  const tender = await Tender.create({
    company: req.user!.id,
    category: b.category,
    title: b.title,
    description: b.description || "",
    scopeOfWork: b.scopeOfWork,
    location: b.location || "",
    referenceNumber: b.referenceNumber || generateReferenceNumber(),
    estimatedBudget: b.estimatedBudget,
    expectedStartDate: b.expectedStartDate,
    expectedEndDate: b.expectedEndDate,
    submissionDeadline: b.submissionDeadline,
    termsAndConditions: b.termsAndConditions,
    fields,
    requiredDocuments: b.requiredDocuments || []
  });

  res.status(201).json(tender);
}

// GET /api/tenders/mine/all  (company auth)
export async function listMyTenders(req: Request, res: Response) {
  const tenders = await Tender.find({ company: req.user!.id }).sort({ createdAt: -1 });
  res.json(tenders);
}

// PATCH /api/tenders/:id/close  (company auth, owner only)
export async function closeTender(req: Request, res: Response) {
  const tender = await Tender.findById(req.params.id);
  if (!tender) return res.status(404).json({ message: "Tender not found" });
  if (tender.company.toString() !== req.user!.id) return res.status(403).json({ message: "Not your tender" });
  tender.status = "closed";
  await tender.save();
  res.json(tender);
}
