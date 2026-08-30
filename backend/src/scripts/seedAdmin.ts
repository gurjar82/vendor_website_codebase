import bcrypt from "bcryptjs";
import User from "../models/User";

// Runs once on server start. If no admin exists yet, creates one from .env values.
// This is how "admin role mai website create kar raha hu to mai hi rahunga" is handled -
// there is no public admin signup form, only this seeded account.
export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin seed");
    return;
  }

  const existing = await User.findOne({ role: "admin" });
  if (existing) return;

  const hashed = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: "admin",
    phone: "0000000000"
  });

  console.log(`Admin account created: ${email} (change the password after first login in a real deployment)`);
}
