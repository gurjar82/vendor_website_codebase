import { Request, Response } from "express";
import User from "../models/User";

// GET /api/companies/latest?limit=6  (public - homepage "recently joined companies")
export async function latestCompanies(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 6;
  const companies = await User.find({ role: "company", status: "active" })
    .select("name companyName industry businessDescription website logoUrl address createdAt")
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(companies);
}

// GET /api/companies  (public - full directory)
export async function listCompanies(req: Request, res: Response) {
  const companies = await User.find({ role: "company", status: "active" })
    .select("name companyName industry businessDescription website logoUrl address createdAt")
    .sort({ createdAt: -1 });
  res.json(companies);
}
