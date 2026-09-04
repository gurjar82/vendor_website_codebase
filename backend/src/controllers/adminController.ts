import { Request, Response } from "express";
import VendorProfile from "../models/VendorProfile";
import Tender from "../models/Tender";
import Bid from "../models/Bid";
import User from "../models/User";

export async function listPendingVendors(req: Request, res: Response) {
  const vendors = await VendorProfile.find({ verified: false })
    .populate("user", "name businessName email phone")
    .sort({ createdAt: -1 });
  res.json(vendors);
}

export async function listAllVendorsAdmin(req: Request, res: Response) {
  const vendors = await VendorProfile.find().populate("user", "name businessName email phone status").sort({ createdAt: -1 });
  res.json(vendors);
}

export async function listAllCompaniesAdmin(req: Request, res: Response) {
  const companies = await User.find({ role: "company" }).select("-password").sort({ createdAt: -1 });
  res.json(companies);
}

export async function verifyVendor(req: Request, res: Response) {
  const vendor = await VendorProfile.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
  if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
  res.json(vendor);
}

export async function deleteVendor(req: Request, res: Response) {
  const vendor = await VendorProfile.findByIdAndDelete(req.params.id);
  if (!vendor) return res.status(404).json({ message: "Vendor profile not found" });
  res.json({ message: "Vendor profile removed" });
}

export async function deleteTender(req: Request, res: Response) {
  const tender = await Tender.findByIdAndDelete(req.params.id);
  if (!tender) return res.status(404).json({ message: "Tender not found" });
  res.json({ message: "Tender removed" });
}

// PATCH /api/admin/users/:id/suspend  { suspend: true/false }
export async function suspendUser(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.suspend ? "suspended" : "active" },
    { new: true }
  ).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

export async function adminOverview(req: Request, res: Response) {
  const [companies, vendors, pendingVendors, openTenders, totalBids] = await Promise.all([
    User.countDocuments({ role: "company" }),
    User.countDocuments({ role: "vendor" }),
    VendorProfile.countDocuments({ verified: false }),
    Tender.countDocuments({ status: "open" }),
    Bid.countDocuments({})
  ]);
  res.json({ companies, vendors, pendingVendors, openTenders, totalBids });
}
