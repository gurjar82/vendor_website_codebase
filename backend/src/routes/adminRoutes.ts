import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import {
  listPendingVendors, listAllVendorsAdmin, listAllCompaniesAdmin, verifyVendor,
  deleteVendor, deleteTender, suspendUser, adminOverview
} from "../controllers/adminController";

const router = Router();
router.use(verifyToken, requireRole("admin"));

router.get("/overview", adminOverview);
router.get("/vendors/pending", listPendingVendors);
router.get("/vendors", listAllVendorsAdmin);
router.get("/companies", listAllCompaniesAdmin);
router.patch("/vendors/:id/verify", verifyVendor);
router.delete("/vendors/:id", deleteVendor);
router.delete("/tenders/:id", deleteTender);
router.patch("/users/:id/suspend", suspendUser);

export default router;
