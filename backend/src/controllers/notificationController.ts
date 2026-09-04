import { Request, Response } from "express";
import Notification from "../models/Notification";

// GET /api/notifications/mine  (any logged-in role)
export async function myNotifications(req: Request, res: Response) {
  const notifications = await Notification.find({ user: req.user!.id }).sort({ createdAt: -1 }).limit(30);
  res.json(notifications);
}

// PATCH /api/notifications/:id/read
export async function markRead(req: Request, res: Response) {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user!.id }, { read: true }, { new: true });
  if (!n) return res.status(404).json({ message: "Notification not found" });
  res.json(n);
}

// PATCH /api/notifications/read-all
export async function markAllRead(req: Request, res: Response) {
  await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
}
