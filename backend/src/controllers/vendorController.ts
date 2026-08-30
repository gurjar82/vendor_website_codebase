import { Request, Response } from "express";
import VendorProfile from "../models/VendorProfile";
import User from "../models/User";

// GET /api/vendors?category=canteen  (public - used by Company and Guest views)
export async function listVendors(req: Request, res: Response) {
  const { category } = req.query;

  const filter: Record<string, unknown> = { verified: true };
  if (category) filter.category = category;

  const vendors = await VendorProfile.find(filter)
    .populate("user", "name phone email")
    .sort({ createdAt: -1 });

  res.json(vendors);
}

// GET /api/vendors/:id  (public)
export async function getVendor(req: Request, res: Response) {
  const vendor = await VendorProfile.findById(req.params.id).populate("user", "name phone email");
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json(vendor);
}

// POST /api/vendors/profile  (vendor auth - creates or updates own profile)
export async function upsertOwnProfile(req: Request, res: Response) {
  const vendorUserId = req.user!.id;
  const { category, experienceYears, description, achievements, documentUrls } = req.body;

  if (!category) {
    return res.status(400).json({ message: "Category is required" });
  }

  const profile = await VendorProfile.findOneAndUpdate(
    { user: vendorUserId },
    {
      user: vendorUserId,
      category,
      experienceYears: experienceYears || 0,
      description: description || "",
      achievements: achievements || "",
      documentUrls: documentUrls || [],
      // any edit puts the profile back to "pending verification" so admin re-checks it
      verified: false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(profile);
}

// GET /api/vendors/me/profile  (vendor auth - fetch own profile, verified or not)
export async function getOwnProfile(req: Request, res: Response) {
  const profile = await VendorProfile.findOne({ user: req.user!.id });
  const user = await User.findById(req.user!.id).select("name email phone");
  res.json({ profile, user });
}
