import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import {
  applyToRequirement,
  listApplicationsForRequirement,
  listMyApplications,
  approveApplication,
  rejectApplication
} from "../controllers/applicationController";

const router = Router();

router.post("/", verifyToken, requireRole("vendor"), applyToRequirement);
router.get("/mine", verifyToken, requireRole("vendor"), listMyApplications);
router.get("/requirement/:id", verifyToken, requireRole("company"), listApplicationsForRequirement);
router.patch("/:id/approve", verifyToken, requireRole("company"), approveApplication);
router.patch("/:id/reject", verifyToken, requireRole("company"), rejectApplication);

export default router;
