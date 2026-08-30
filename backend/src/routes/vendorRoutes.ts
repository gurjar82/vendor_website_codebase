import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import { listVendors, getVendor, upsertOwnProfile, getOwnProfile } from "../controllers/vendorController";

const router = Router();

// public - Company panel and Guest view both use this
router.get("/", listVendors);

// vendor-only routes must come before "/:id" so they aren't swallowed by it
router.get("/me/profile", verifyToken, requireRole("vendor"), getOwnProfile);
router.post("/profile", verifyToken, requireRole("vendor"), upsertOwnProfile);

router.get("/:id", getVendor);

export default router;
