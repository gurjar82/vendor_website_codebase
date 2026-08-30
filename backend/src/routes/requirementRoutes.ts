import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import {
  listRequirements,
  getRequirement,
  createRequirement,
  listMyRequirements,
  closeRequirement
} from "../controllers/requirementController";

const router = Router();

// public - Vendor panel and Guest view both use this
router.get("/", listRequirements);

router.get("/mine/all", verifyToken, requireRole("company"), listMyRequirements);
router.post("/", verifyToken, requireRole("company"), createRequirement);
router.patch("/:id/close", verifyToken, requireRole("company"), closeRequirement);

router.get("/:id", getRequirement);

export default router;
