import { Router } from "express";
import { latestCompanies, listCompanies } from "../controllers/companyController";

const router = Router();
router.get("/latest", latestCompanies);
router.get("/", listCompanies);
export default router;
