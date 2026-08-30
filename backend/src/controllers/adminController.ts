import { Request, Response } from "express";
import VendorProfile from "../models/VendorProfile";
import Requirement from "../models/Requirement";
import User from "../models/User";

// GET /api/admin/vendors/pending  (admin auth)
export async function listPendingVendors(req: Request, res: Response) {
  const vendors = await VendorProfile.find({ verified: false })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });
  res.json(vendors);
}

// GET /api/admin/vendors  (admin auth - all vendors, verified or not)
export async function listAllVendorsAdmin(req: Request, res: Response) {
  const vendors = await VendorProfile.find().populate("user", "name email phone").sort({ createdAt: -1 });
  res.json(vendors);
}

// PATCH /api/admin/vendors/:id/verify  (admin auth)
export async function verifyVendor(req: Request, res: Response) {
  const vendor = await VendorProfile.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
  if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
  res.json(vendor);
}

// DELETE /api/admin/vendors/:id  (admin auth - remove a fake/bad vendor profile)
export async function deleteVendor(req: Request, res: Response) {
  const vendor = await VendorProfile.findByIdAndDelete(req.params.id);
  if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
  res.json({ message: "Vendor profile removed" });
}

// DELETE /api/admin/requirements/:id  (admin auth - remove a bad/spam requirement)
export async function deleteRequirement(req: Request, res: Response) {
  const requirement = await Requirement.findByIdAndDelete(req.params.id);
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });
  res.json({ message: "Requirement removed" });
}

// GET /api/admin/overview  (admin auth - simple dashboard counts)
export async function adminOverview(req: Request, res: Response) {
  const [companies, vendors, pendingVendors, requirements] = await Promise.all([
    User.countDocuments({ role: "company" }),
    User.countDocuments({ role: "vendor" }),
    VendorProfile.countDocuments({ verified: false }),
    Requirement.countDocuments({ status: "open" })
  ]);

  res.json({ companies, vendors, pendingVendors, openRequirements: requirements });
}
