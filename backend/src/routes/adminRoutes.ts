import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import {
  listPendingVendors,
  listAllVendorsAdmin,
  verifyVendor,
  deleteVendor,
  deleteRequirement,
  adminOverview
} from "../controllers/adminController";

const router = Router();

router.use(verifyToken, requireRole("admin"));

router.get("/overview", adminOverview);
router.get("/vendors/pending", listPendingVendors);
router.get("/vendors", listAllVendorsAdmin);
router.patch("/vendors/:id/verify", verifyVendor);
router.delete("/vendors/:id", deleteVendor);
router.delete("/requirements/:id", deleteRequirement);

export default router;
