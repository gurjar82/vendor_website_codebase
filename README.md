# Vendor Marketplace - Tender Management Platform (v2)

Manufacturing company ke liye vendor/tender matching platform.
Backend: Node.js + TypeScript + Express + MongoDB (Mongoose) + Multer (file uploads).
Frontend: plain HTML/CSS/JS (no build step), extreme redesign with animations.

Roles: Company, Vendor, Guest (read-only), Admin (seeded account).
Plus a new **Home** tab with hero banner and latest vendors/tenders showcase.

---

## What's new in v2 (upgrade from the original POC)

- **Dynamic tender builder**: company picks a category, gets suggested fields (e.g. Labour
  category gets shift/wage/accommodation fields), can add fully custom fields and required
  documents - stored per-tender in MongoDB (`Tender.fields`, `Tender.requiredDocuments`).
- **Labour / Manpower Supply** is a first-class category with its own vendor profile fields
  (`VendorProfile.labourDetails`) and its own bid fields (`Bid.availableLabourCategory`, etc).
- **Real file uploads** via Multer - documents and previous-work photos are saved to
  `backend/uploads/` and served at `/uploads/<filename>`. No cloud account needed for the POC.
- **Previous work / experience** - vendors can add unlimited past tenders with photos and
  documents (`VendorProfile.previousWork[]`).
- **Document management** - named, categorized documents with expiry date and verification
  status, not just plain URLs.
- **Bids** replace the old "applications" - dynamic answers matching the tender's fields,
  selectable profile documents + new uploads, a generated Bid ID, and a full status lifecycle
  (submitted -> under_review -> shortlisted / rejected -> awarded, or withdrawn).
- **Notifications** - simple in-app notifications on new bid / shortlist / reject / award.
- **Admin** can now verify vendors, suspend/reactivate any company or vendor account, and
  remove listings.
- **Frontend** - full visual redesign: gradient hero, scroll animations, sidebar dashboards for
  Company/Vendor, multi-step registration wizards, dynamic field rendering, toasts, modals.

## What's intentionally still simple (roadmap, as discussed)

- No in-app chat yet (Phase 1 is still direct phone contact) - Phase 2 item.
- No payments/subscriptions - Phase 3 item.
- File storage is local disk, fine for a POC/demo; production would move this to S3/Cloudinary.
- No email/SMS - notifications are in-app only.
- Company custom-field "table" field type is defined but not yet rendered in the bid form.

---

## 1. Prerequisites

1. **Node.js** v18+ (your v25.2.1 works fine)
2. **MongoDB** - local install or a free MongoDB Atlas cluster

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`: set `MONGO_URI`, a random `JWT_SECRET`, and your `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

```bash
npm run dev
```

You should see `MongoDB connected`, `Admin account created`, and `Server running on http://localhost:5000`.

## 3. Frontend

Just open `frontend/index.html` in a browser, or serve it:
```bash
cd frontend
npx serve .
```
Backend must be running on `http://localhost:5000` (see `frontend/js/api.js` -> `API_BASE`).

## 4. Demo flow

1. **Home** - see the hero and (once data exists) latest vendors/tenders.
2. **Vendor tab** -> Register (3-step wizard: account -> business info -> services). If you pick
   "Labour / Manpower Supply", extra manpower fields appear automatically.
3. In the vendor dashboard: add **Previous work** (with photo/document uploads) and
   **Documents**, to raise your profile completion %.
4. **Admin tab** -> log in with your `.env` credentials -> verify the new vendor.
5. **Company tab** -> Register (3-step wizard) -> **Publish tender** (4-step wizard: basic info ->
   category-suggested + custom fields -> required documents -> review) -> publish.
6. **Vendor tab** -> **Open tenders** -> find the tender -> fill the dynamic bid form (fields
   match exactly what the company asked for) -> select/upload documents -> submit.
7. **Company tab** -> **My tenders** -> View bids -> Shortlist -> Award.
8. **Guest tab** -> anyone can browse tenders and the vendor directory without logging in.

## 5. Project structure

```
backend/src/
  config/categories.ts     category list + dynamic field templates (incl. labour)
  config/db.ts              MongoDB connection
  models/                   User, VendorProfile, Tender, Bid, Notification
  middleware/auth.ts        JWT verification + role guard
  middleware/upload.ts      Multer local file upload config
  controllers/               business logic per feature
  routes/                    API endpoints
  utils/notify.ts            in-app notification helper
  scripts/seedAdmin.ts       auto-creates the admin account
  server.ts                  entry point, serves /uploads statically

frontend/
  index.html
  css/style.css              full visual redesign + animations
  js/
    api.js, utils.js, state.js       shared helpers
    auth-forms.js                     multi-step register/login + dynamic field renderer
    home.js, guest.js, company.js, vendor.js, admin.js   one file per tab
    app.js                            router / init
```
