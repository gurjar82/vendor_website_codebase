import { Request, Response } from "express";
import VendorProfile from "../models/VendorProfile";
import User from "../models/User";
import { toFileUrl } from "../middleware/upload";

// GET /api/vendors?category=labour&location=jaipur  (public - Company and Guest views)
export async function listVendors(req: Request, res: Response) {
  const { category, verifiedOnly } = req.query;
  const filter: Record<string, unknown> = {};
  if (verifiedOnly !== "false") filter.verified = true;
  if (category) filter.categories = category;

  const vendors = await VendorProfile.find(filter)
    .populate("user", "name businessName phone email address")
    .sort({ createdAt: -1 });

  res.json(vendors);
}

// GET /api/vendors/latest?limit=6  (public - homepage "recently joined vendors")
export async function latestVendors(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 6;
  const vendors = await VendorProfile.find({ verified: true })
    .populate("user", "name businessName")
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(vendors);
}

// GET /api/vendors/:id  (public)
export async function getVendor(req: Request, res: Response) {
  const vendor = await VendorProfile.findById(req.params.id).populate("user", "name businessName phone email address website");
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json(vendor);
}

// POST /api/vendors/profile  (vendor auth - create/update own profile)
export async function upsertOwnProfile(req: Request, res: Response) {
  const vendorUserId = req.user!.id;
  const { categories, experienceYears, description, achievements, labourDetails } = req.body;

  if (!categories || !Array.isArray(categories) || !categories.length) {
    return res.status(400).json({ message: "At least one category is required" });
  }

  const update: any = {
    user: vendorUserId,
    categories,
    experienceYears: experienceYears || 0,
    description: description || "",
    achievements: achievements || "",
    verified: false // any profile edit goes back to pending verification
  };
  if (categories.includes("labour") && labourDetails) update.labourDetails = labourDetails;

  const profile = await VendorProfile.findOneAndUpdate(
    { user: vendorUserId }, update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(profile);
}

// GET /api/vendors/me/profile  (vendor auth)
export async function getOwnProfile(req: Request, res: Response) {
  const profile = await VendorProfile.findOne({ user: req.user!.id });
  const user = await User.findById(req.user!.id).select("-password");
  res.json({ profile, user });
}

// POST /api/vendors/me/previous-work  (vendor auth) - multipart form with up to 4 photos + 3 docs
export async function addPreviousWork(req: Request, res: Response) {
  const profile = await VendorProfile.findOne({ user: req.user!.id });
  if (!profile) return res.status(400).json({ message: "Create your profile first" });

  const files = (req.files as Record<string, Express.Multer.File[]>) || {};
  const photoUrls = (files["photos"] || []).slice(0, 4).map((f) => toFileUrl(f.filename));
  const workOrderUrl = files["workOrder"]?.[0] ? toFileUrl(files["workOrder"][0].filename) : undefined;
  const completionCertificateUrl = files["completionCertificate"]?.[0] ? toFileUrl(files["completionCertificate"][0].filename) : undefined;
  const contractDocumentUrl = files["contractDocument"]?.[0] ? toFileUrl(files["contractDocument"][0].filename) : undefined;

  const b = req.body;
  if (!b.title || !b.clientName || !b.category) {
    return res.status(400).json({ message: "title, clientName and category are required" });
  }

  profile.previousWork.push({
    title: b.title, clientName: b.clientName, category: b.category, description: b.description,
    location: b.location, startDate: b.startDate, endDate: b.endDate, contractDuration: b.contractDuration,
    contractValue: b.contractValue ? Number(b.contractValue) : undefined,
    manpowerSupplied: b.manpowerSupplied ? Number(b.manpowerSupplied) : undefined,
    workStatus: b.workStatus || "completed",
    workOrderUrl, completionCertificateUrl, contractDocumentUrl, photoUrls, notes: b.notes
  } as any);

  await profile.save();
  res.status(201).json(profile);
}

// DELETE /api/vendors/me/previous-work/:workId  (vendor auth)
export async function deletePreviousWork(req: Request, res: Response) {
  const profile = await VendorProfile.findOne({ user: req.user!.id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  profile.previousWork = profile.previousWork.filter((w: any) => w._id.toString() !== req.params.workId);
  await profile.save();
  res.json(profile);
}

// POST /api/vendors/me/documents  (vendor auth) - multipart, field name "file"
export async function uploadDocument(req: Request, res: Response) {
  const profile = await VendorProfile.findOne({ user: req.user!.id });
  if (!profile) return res.status(400).json({ message: "Create your profile first" });

  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const { name, category, expiryDate } = req.body;
  if (!name || !category) return res.status(400).json({ message: "name and category are required" });

  profile.documents.push({
    name, category, fileUrl: toFileUrl(file.filename),
    uploadedAt: new Date(), expiryDate, verified: false
  } as any);

  await profile.save();
  res.status(201).json(profile);
}

// DELETE /api/vendors/me/documents/:docId  (vendor auth)
export async function deleteDocument(req: Request, res: Response) {
  const profile = await VendorProfile.findOne({ user: req.user!.id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  profile.documents = profile.documents.filter((d: any) => d._id.toString() !== req.params.docId);
  await profile.save();
  res.json(profile);
}
