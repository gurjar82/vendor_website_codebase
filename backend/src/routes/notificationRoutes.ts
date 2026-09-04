import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { myNotifications, markRead, markAllRead } from "../controllers/notificationController";

const router = Router();
router.use(verifyToken);
router.get("/mine", myNotifications);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);
export default router;
