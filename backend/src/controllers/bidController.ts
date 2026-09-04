import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Bid from "../models/Bid";
import Tender from "../models/Tender";
import VendorProfile from "../models/VendorProfile";
import { toFileUrl } from "../middleware/upload";
import { notify } from "../utils/notify";

// POST /api/bids  (vendor auth) - multipart form. Text fields + JSON "answers" string + optional files["documents"]
export async function submitBid(req: Request, res: Response) {
  const b = req.body;
  const { tenderId } = b;
  if (!tenderId) return res.status(400).json({ message: "tenderId is required" });

  const tender = await Tender.findById(tenderId);
  if (!tender || tender.status !== "open") {
    return res.status(400).json({ message: "This tender is not open for bids" });
  }

  let answers = [];
  try { answers = b.answers ? JSON.parse(b.answers) : []; } catch { answers = []; }

  let selectedProfileDocs: { name: string; fileUrl: string }[] = [];
  try { selectedProfileDocs = b.selectedProfileDocs ? JSON.parse(b.selectedProfileDocs) : []; } catch { selectedProfileDocs = []; }

  const files = (req.files as Express.Multer.File[]) || [];
  const uploadedDocs = files.map((f) => ({ name: f.originalname, fileUrl: toFileUrl(f.filename), source: "uploaded" as const }));
  const profileDocs = selectedProfileDocs.map((d) => ({ name: d.name, fileUrl: d.fileUrl, source: "profile" as const }));

  try {
    const bid = await Bid.create({
      bidId: "BID-" + uuidv4().slice(0, 8).toUpperCase(),
      tender: tenderId,
      vendor: req.user!.id,
      quotedAmount: b.quotedAmount ? Number(b.quotedAmount) : undefined,
      proposedStartDate: b.proposedStartDate,
      completionTime: b.completionTime,
      relevantExperience: b.relevantExperience,
      teamDetails: b.teamDetails,
      equipmentDetails: b.equipmentDetails,
      additionalNotes: b.additionalNotes,
      availableLabourCategory: b.availableLabourCategory,
      availableQuantity: b.availableQuantity ? Number(b.availableQuantity) : undefined,
      proposedWage: b.proposedWage ? Number(b.proposedWage) : undefined,
      shiftAvailability: b.shiftAvailability,
      accommodationCapability: b.accommodationCapability === "true",
      transportCapability: b.transportCapability === "true",
      replacementCapability: b.replacementCapability === "true",
      answers,
      documents: [...profileDocs, ...uploadedDocs]
    });

    await notify(tender.company, `New bid received on "${tender.title}"`, `/tenders/${tender._id}`);
    res.status(201).json(bid);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: "You have already submitted a bid for this tender" });
    res.status(500).json({ message: "Could not submit bid", error: err.message });
  }
}

// GET /api/bids/tender/:id  (company auth, owner only)
export async function listBidsForTender(req: Request, res: Response) {
  const tender = await Tender.findById(req.params.id);
  if (!tender) return res.status(404).json({ message: "Tender not found" });
  if (tender.company.toString() !== req.user!.id) return res.status(403).json({ message: "Not your tender" });

  const bids = await Bid.find({ tender: req.params.id })
    .populate("vendor", "name businessName phone email")
    .sort({ appliedAt: -1 });
  res.json(bids);
}

// GET /api/bids/mine  (vendor auth)
export async function listMyBids(req: Request, res: Response) {
  const bids = await Bid.find({ vendor: req.user!.id }).populate("tender").sort({ appliedAt: -1 });
  res.json(bids);
}

async function changeStatus(req: Request, res: Response, status: string) {
  const bid = await Bid.findById(req.params.id).populate("tender");
  if (!bid) return res.status(404).json({ message: "Bid not found" });
  const tender = bid.tender as any;
  if (tender.company.toString() !== req.user!.id) return res.status(403).json({ message: "Not your tender" });

  bid.status = status as any;
  if (req.body.internalNotes !== undefined) bid.internalNotes = req.body.internalNotes;
  await bid.save();

  if (status === "awarded") {
    await Tender.findByIdAndUpdate(tender._id, { status: "awarded", awardedBid: bid._id });
  }

  const messages: Record<string, string> = {
    shortlisted: `You've been shortlisted for "${tender.title}"`,
    rejected: `Your bid for "${tender.title}" was not selected`,
    awarded: `Congratulations - you were awarded "${tender.title}"`,
    under_review: `Your bid for "${tender.title}" is under review`
  };
  if (messages[status]) await notify(bid.vendor, messages[status], `/bids/${bid._id}`);

  res.json(bid);
}

export const shortlistBid = (req: Request, res: Response) => changeStatus(req, res, "shortlisted");
export const rejectBid = (req: Request, res: Response) => changeStatus(req, res, "rejected");
export const awardBid = (req: Request, res: Response) => changeStatus(req, res, "awarded");
export const reviewBid = (req: Request, res: Response) => changeStatus(req, res, "under_review");

// PATCH /api/bids/:id/withdraw  (vendor auth, owner only)
export async function withdrawBid(req: Request, res: Response) {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ message: "Bid not found" });
  if (bid.vendor.toString() !== req.user!.id) return res.status(403).json({ message: "Not your bid" });
  bid.status = "withdrawn";
  await bid.save();
  res.json(bid);
}
