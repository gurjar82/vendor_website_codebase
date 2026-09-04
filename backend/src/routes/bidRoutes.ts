import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
  submitBid, listBidsForTender, listMyBids, shortlistBid, rejectBid, awardBid, reviewBid, withdrawBid
} from "../controllers/bidController";

const router = Router();

router.post("/", verifyToken, requireRole("vendor"), upload.array("documents", 5), submitBid);
router.get("/mine", verifyToken, requireRole("vendor"), listMyBids);
router.patch("/:id/withdraw", verifyToken, requireRole("vendor"), withdrawBid);

router.get("/tender/:id", verifyToken, requireRole("company"), listBidsForTender);
router.patch("/:id/shortlist", verifyToken, requireRole("company"), shortlistBid);
router.patch("/:id/reject", verifyToken, requireRole("company"), rejectBid);
router.patch("/:id/award", verifyToken, requireRole("company"), awardBid);
router.patch("/:id/review", verifyToken, requireRole("company"), reviewBid);

export default router;
