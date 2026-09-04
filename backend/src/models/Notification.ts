import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  link: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>("Notification", NotificationSchema);
