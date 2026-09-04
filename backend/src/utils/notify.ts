import Notification from "../models/Notification";
import { Types } from "mongoose";

export async function notify(userId: Types.ObjectId | string, message: string, link?: string) {
  await Notification.create({ user: userId, message, link });
}
