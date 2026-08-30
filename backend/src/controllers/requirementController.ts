import { Request, Response } from "express";
import Requirement from "../models/Requirement";

// GET /api/requirements?category=transport  (public - Vendor and Guest views)
export async function listRequirements(req: Request, res: Response) {
  const { category, status } = req.query;

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  filter.status = status || "open";

  const requirements = await Requirement.find(filter)
    .populate("company", "name companyName")
    .sort({ createdAt: -1 });

  res.json(requirements);
}

// GET /api/requirements/:id  (public)
export async function getRequirement(req: Request, res: Response) {
  const requirement = await Requirement.findById(req.params.id).populate("company", "name companyName");
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });
  res.json(requirement);
}

// POST /api/requirements  (company auth)
export async function createRequirement(req: Request, res: Response) {
  const { category, title, description, location } = req.body;

  if (!category || !title) {
    return res.status(400).json({ message: "Category and title are required" });
  }

  const requirement = await Requirement.create({
    company: req.user!.id,
    category,
    title,
    description: description || "",
    location: location || ""
  });

  res.status(201).json(requirement);
}

// GET /api/requirements/mine/all  (company auth - own posted requirements)
export async function listMyRequirements(req: Request, res: Response) {
  const requirements = await Requirement.find({ company: req.user!.id }).sort({ createdAt: -1 });
  res.json(requirements);
}

// PATCH /api/requirements/:id/close  (company auth - owner only)
export async function closeRequirement(req: Request, res: Response) {
  const requirement = await Requirement.findById(req.params.id);
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });

  if (requirement.company.toString() !== req.user!.id) {
    return res.status(403).json({ message: "You can only close your own requirement" });
  }

  requirement.status = "closed";
  await requirement.save();
  res.json(requirement);
}
