# Installation Requirements - Vendor Marketplace POC

Aapka Node.js already v25.2.1 hai — ye kaam karega (project ko sirf v18+ chahiye), koi extra kaam nahi.
Neeche jo bhi chahiye uska poora list hai, kya install karna hai aur kya automatically ho jayega.

---

## Zaroori installs (khud karne honge)

### 1. Node.js — ✅ already installed
Aapke paas v25.2.1 hai, kuch nahi karna. Confirm karne ke liye:
```bash
node -v
npm -v
```

### 2. MongoDB (database) — inme se koi ek chuno

**Option A — Local install (aapke computer par hi chalega)**
- Download: https://www.mongodb.com/try/download/community
- Install karne ke baad MongoDB service/`mongod` background me chalu rehna chahiye
- Check karo: `mongod --version`
- Connection string: `mongodb://127.0.0.1:27017/vendor_marketplace` (already `.env.example` me set hai)

**Option B — Cloud (Atlas) — install ki zaroorat nahi, browser se ho jata hai**
- https://www.mongodb.com/cloud/atlas par free account banao
- Free cluster (M0) create karo
- "Connect" → "Drivers" → connection string copy karo
- Ye string `.env` file ke `MONGO_URI` me paste karna hoga

Recommendation: **agar sirf client ko demo dikhana hai to Option B (Atlas) aasan hai** — koi local install nahi, kahi se bhi access ho jata hai.

### 3. Code editor (optional but recommended)
- VS Code: https://code.visualstudio.com/ — `.env` file edit karne aur code dekhne ke liye

### 4. `npx serve` (optional, frontend ke liye)
- Kuch install nahi karna — `npx` Node ke saath already aata hai, jab command chalega tab khud download ho jayega

---

## Automatically install hone wale (aapko kuch nahi karna, ek command chalani hai)

Backend folder ke andar ye command chalate hi ye sab apne aap install ho jayenge:

```bash
cd backend
npm install
```

Ye packages install honge (already `package.json` me likhe hain):

| Package | Kaam |
|---|---|
| express | web server / API framework |
| mongoose | MongoDB se connect karne ke liye |
| bcryptjs | password ko securely encrypt karna |
| jsonwebtoken | login token (JWT) banana |
| cors | frontend ko backend se baat karne dena |
| dotenv | `.env` file read karna |
| typescript | TypeScript code ko JavaScript me convert karna |
| ts-node-dev | development mode me server chalana (auto-restart) |
| @types/* | TypeScript ko sab packages samjhane ke liye |

Frontend me kuch install nahi karna — wo plain HTML/CSS/JS hai, seedha browser me chalta hai.

---

## Poora setup sequence (order important hai)

1. MongoDB ready karo (local install ya Atlas — upar dekho)
2. Terminal kholo, project folder me jao
3. ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
4. `.env` file kholo, `MONGO_URI` set karo (local ya Atlas string), `ADMIN_EMAIL`/`ADMIN_PASSWORD` apna daal do
5. ```bash
   npm run dev
   ```
6. Terminal me "Server running on http://localhost:5000" dikhna chahiye
7. `frontend/index.html` browser me double-click karke kholo

---

## Quick troubleshooting

- `npm install` me error aaye → internet connection check karo
- Server start na ho, "MongoDB connection error" aaye → MongoDB chalu hai ya nahi check karo (`mongod` local ke liye), ya Atlas connection string sahi hai ya nahi check karo
- Frontend se backend call fail ho (browser console me CORS/network error) → confirm karo backend `localhost:5000` par hi chal raha hai
