# Vendor Marketplace - POC

Manufacturing company ke liye vendor-matching platform ka proof of concept.
Backend: Node.js + TypeScript + Express + MongoDB (Mongoose).
Frontend: plain HTML/CSS/JS (koi build step nahi, seedha browser me chalta hai).

Roles: Company, Vendor, Guest (read-only, no login), Admin (aap khud, seeded account).

---

## 1. Prerequisites (ek baar install karna hai)

1. **Node.js** (v18 ya usse upar) — https://nodejs.org se download karo
2. **MongoDB** — do options hain:
   - **Local**: MongoDB Community Server install karo (https://www.mongodb.com/try/download/community) aur `mongod` service chalu rakho
   - **Cloud (aasan)**: MongoDB Atlas par free account banao (https://www.mongodb.com/cloud/atlas), free cluster banao, "Connect > Drivers" se connection string copy karo

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

`.env` file kholo aur ye set karo:
- `MONGO_URI` — agar local MongoDB hai to default value (`mongodb://127.0.0.1:27017/vendor_marketplace`) chalega. Agar Atlas use kar rahe ho to wahan ka connection string paste karo.
- `JWT_SECRET` — koi bhi random long string daal do
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — aapka admin login (server pehli baar start hote hi ye account apne aap ban jayega)

Ab server chalao:

```bash
npm run dev
```

Agar sab sahi hai to terminal me dikhega:
```
MongoDB connected: vendor_marketplace
Admin account created: admin@yourcompany.com
Server running on http://localhost:5000
```

## 3. Frontend chalana

Frontend sirf static files hain, koi build ki zaroorat nahi. Do tarike hain:

**Option A — seedha double-click:**
`frontend/index.html` file ko double-click karke browser me kholo.

**Option B — local server se (recommended, kuch browsers file:// pe CORS issue dete hain):**
```bash
cd frontend
npx serve .
```
Fir terminal me jo link dikhega (jaise `http://localhost:3000`) wo browser me kholo.

> Backend hamesha `http://localhost:5000` par hi chalna chahiye — frontend usi address ko call karta hai (`frontend/js/api.js` me `API_BASE`).

## 4. Client ko demo kaise dikhayen

1. Browser me site kholo — top par 4 tabs dikhenge: Company, Vendor, Guest, Admin
2. **Company tab** → Register karo (naya company account) → requirement post karo (e.g. "Canteen vendor chahiye")
3. **Vendor tab** → naye tab/window me ya same browser me → Register karo (vendor account) → profile banao (category select karo)
4. **Admin tab** → `.env` me diya email/password se login karo → "Vendors pending verification" me naya vendor dikhega → Verify dabao
5. Ab **Company tab** wapas jao → "Browse verified vendors" me wo vendor dikhega
6. **Vendor tab** me wapas jao → "Open requirements" me company ki requirement dikhegi → Apply karo
7. **Company tab** me → apni requirement ke "View applicants" me vendor dikhega → Approve dabao → phone number reveal ho jayega (Phase 1 contact flow)
8. **Guest tab** → bina login kisi ne bhi vendors aur open requirements dekh sakte hain, koi action button nahi

## 5. Ye POC me kya hai, kya nahi (client ko batane ke liye)

**Included:**
- 4 roles ka poora flow: register/login, post requirement, vendor profile, apply, approve, admin verify
- Phase 1 contact: approve hone par phone number reveal hota hai
- Category-wise filtering
- Admin ke through fake/spam vendor ya requirement remove karna

**Abhi included nahi (agle phases me add hoga, jaisa humne discuss kiya):**
- Phase 2: platform ke andar chat (abhi sirf phone number)
- Phase 3: subscription/payment system
- Photo/document upload (abhi sirf text description — real upload ke liye cloud storage jaise AWS S3/Cloudinary integrate karna hoga)
- Email/SMS notifications
- Mobile app (abhi responsive website hai)

## 6. Project structure

```
vendor-marketplace-poc/
├── backend/
│   ├── src/
│   │   ├── config/db.ts          MongoDB connection
│   │   ├── models/                User, VendorProfile, Requirement, Application
│   │   ├── middleware/auth.ts     JWT verification + role guard
│   │   ├── controllers/           business logic
│   │   ├── routes/                API endpoints
│   │   ├── scripts/seedAdmin.ts   auto-creates admin account
│   │   └── server.ts              entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js                 fetch wrapper
        └── app.js                 all 4 tabs' logic
```
