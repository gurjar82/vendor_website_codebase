import { Router } from "express";
import { verifyToken, requireRole } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
  listVendors, latestVendors, getVendor, upsertOwnProfile, getOwnProfile,
  addPreviousWork, deletePreviousWork, uploadDocument, deleteDocument
} from "../controllers/vendorController";

const router = Router();

router.get("/", listVendors);
router.get("/latest", latestVendors);

router.get("/me/profile", verifyToken, requireRole("vendor"), getOwnProfile);
router.post("/profile", verifyToken, requireRole("vendor"), upsertOwnProfile);

router.post(
  "/me/previous-work", verifyToken, requireRole("vendor"),
  upload.fields([
    { name: "photos", maxCount: 4 },
    { name: "workOrder", maxCount: 1 },
    { name: "completionCertificate", maxCount: 1 },
    { name: "contractDocument", maxCount: 1 }
  ]),
  addPreviousWork
);
router.delete("/me/previous-work/:workId", verifyToken, requireRole("vendor"), deletePreviousWork);

router.post("/me/documents", verifyToken, requireRole("vendor"), upload.single("file"), uploadDocument);
router.delete("/me/documents/:docId", verifyToken, requireRole("vendor"), deleteDocument);

router.get("/:id", getVendor);

export default router;
