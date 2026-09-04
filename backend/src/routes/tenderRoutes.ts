import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import {
  listTenders, latestTenders, getTender, createTender, listMyTenders, closeTender
} from "../controllers/tenderController";

const router = Router();

router.get("/", listTenders);
router.get("/latest", latestTenders);
router.get("/mine/all", verifyToken, requireRole("company"), listMyTenders);
router.post("/", verifyToken, requireRole("company"), createTender);
router.patch("/:id/close", verifyToken, requireRole("company"), closeTender);
router.get("/:id", getTender);

export default router;
