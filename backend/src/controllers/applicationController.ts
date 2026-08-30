import { Request, Response } from "express";
import Application from "../models/Application";
import Requirement from "../models/Requirement";

// POST /api/applications  (vendor auth) body: { requirementId }
export async function applyToRequirement(req: Request, res: Response) {
  const { requirementId } = req.body;

  if (!requirementId) {
    return res.status(400).json({ message: "requirementId is required" });
  }

  const requirement = await Requirement.findById(requirementId);
  if (!requirement || requirement.status !== "open") {
    return res.status(400).json({ message: "This requirement is not open for applications" });
  }

  try {
    const application = await Application.create({
      requirement: requirementId,
      vendor: req.user!.id
    });
    res.status(201).json(application);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already applied to this requirement" });
    }
    res.status(500).json({ message: "Could not apply", error: err.message });
  }
}

// GET /api/applications/requirement/:id  (company auth - owner only, sees applicant contact info)
export async function listApplicationsForRequirement(req: Request, res: Response) {
  const requirement = await Requirement.findById(req.params.id);
  if (!requirement) return res.status(404).json({ message: "Requirement not found" });

  if (requirement.company.toString() !== req.user!.id) {
    return res.status(403).json({ message: "You can only view applicants for your own requirement" });
  }

  const applications = await Application.find({ requirement: req.params.id })
    .populate("vendor", "name phone email")
    .sort({ appliedAt: -1 });

  res.json(applications);
}

// GET /api/applications/mine  (vendor auth - own applications, with status)
export async function listMyApplications(req: Request, res: Response) {
  const applications = await Application.find({ vendor: req.user!.id })
    .populate("requirement")
    .sort({ appliedAt: -1 });
  res.json(applications);
}

// PATCH /api/applications/:id/approve  (company auth)
// Phase 1: approving simply reveals contact info (phone) on the frontend - no in-app chat yet
export async function approveApplication(req: Request, res: Response) {
  const application = await Application.findById(req.params.id).populate("requirement");
  if (!application) return res.status(404).json({ message: "Application not found" });

  const requirement = application.requirement as any;
  if (requirement.company.toString() !== req.user!.id) {
    return res.status(403).json({ message: "You can only approve applicants for your own requirement" });
  }

  application.status = "approved";
  await application.save();
  res.json(application);
}

// PATCH /api/applications/:id/reject  (company auth)
export async function rejectApplication(req: Request, res: Response) {
  const application = await Application.findById(req.params.id).populate("requirement");
  if (!application) return res.status(404).json({ message: "Application not found" });

  const requirement = application.requirement as any;
  if (requirement.company.toString() !== req.user!.id) {
    return res.status(403).json({ message: "You can only reject applicants for your own requirement" });
  }

  application.status = "rejected";
  await application.save();
  res.json(application);
}
