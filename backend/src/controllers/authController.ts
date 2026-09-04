import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

function signToken(id: string, role: string) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any
  });
}

function publicUser(user: any) {
  return {
    id: user._id, name: user.name, email: user.email, role: user.role,
    companyName: user.companyName, businessName: user.businessName, status: user.status
  };
}

// POST /api/auth/register  (role must be "company" or "vendor")
export async function register(req: Request, res: Response) {
  try {
    const body = req.body;
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (role !== "company" && role !== "vendor") {
      return res.status(400).json({ message: "Role must be company or vendor" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const userData: any = { name, email: email.toLowerCase(), password: hashed, role, phone };

    if (role === "company") {
      Object.assign(userData, {
        companyName: body.companyName,
        companyType: body.companyType,
        registrationNumber: body.registrationNumber,
        dateOfIncorporation: body.dateOfIncorporation,
        industry: body.industry,
        businessDescription: body.businessDescription,
        website: body.website,
        address: body.address
      });
    } else {
      Object.assign(userData, {
        businessName: body.businessName,
        businessType: body.businessType,
        registrationNumber: body.registrationNumber,
        businessStartDate: body.businessStartDate,
        ownerName: body.ownerName,
        gstNumber: body.gstNumber,
        website: body.website,
        address: body.address
      });
    }

    const user = await User.create(userData);
    const token = signToken(user._id.toString(), user.role);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: (err as Error).message });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (user.status === "suspended") {
      return res.status(403).json({ message: "This account has been suspended. Contact the platform admin." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user._id.toString(), user.role);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: (err as Error).message });
  }
}

// GET /api/auth/me  (any logged-in role)
export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(publicUser(user));
}

// PATCH /api/auth/me  (update own company/vendor business info)
export async function updateMe(req: Request, res: Response) {
  const allowed = [
    "name", "phone", "companyName", "companyType", "registrationNumber", "dateOfIncorporation",
    "industry", "businessDescription", "website", "logoUrl", "businessName", "businessType",
    "ownerName", "businessStartDate", "gstNumber", "address"
  ];
  const update: any = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];

  const user = await User.findByIdAndUpdate(req.user!.id, update, { new: true });
  res.json(publicUser(user));
}
