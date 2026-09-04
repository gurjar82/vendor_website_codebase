import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { register, login, me, updateMe } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);
router.patch("/me", verifyToken, updateMe);

export default router;
