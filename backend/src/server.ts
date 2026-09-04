import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { seedAdmin } from "./scripts/seedAdmin";

import authRoutes from "./routes/authRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import tenderRoutes from "./routes/tenderRoutes";
import bidRoutes from "./routes/bidRoutes";
import adminRoutes from "./routes/adminRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import companyRoutes from "./routes/companyRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/tenders", tenderRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/companies", companyRoutes);

// multer / generic error handler - keeps file-upload errors as clean JSON instead of a stack trace
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedAdmin();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
