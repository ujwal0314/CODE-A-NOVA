# Inventory Management System

Full-stack inventory management project for shop owners. It includes public pages for Home, About, Our Services, Our Products, Contact, Login, and a shop-owner Dashboard for product stock, suppliers, sales, purchases, low-stock alerts, and reports.

## Tech Stack

- Frontend: React + Vite
- Backend: Express + MongoDB/Mongoose
- Backend hosting target: Vercel
- Frontend hosting target: Netlify

## Local Setup

### Backend

```bash
npm install
copy .env.example .env
npm run dev
```

Set `MONGO_URI` in `.env` before starting the backend. The API runs at `http://localhost:5000/api` by default.

### Frontend

```bash
cd frontend/vite-project
npm install
copy .env.example .env
npm run dev
```

For local backend testing, set this in `frontend/vite-project/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

## Deploy Backend to Vercel

1. Import the repository in Vercel.
2. Use the project root as the backend root.
3. Add the environment variable `MONGO_URI` in Vercel.
4. Deploy. The included `vercel.json` routes `/api/*` to `api/index.js`.
5. After deploy, test `https://your-backend.vercel.app/api/health`.

## Deploy Frontend to Netlify

1. Import the repository in Netlify.
2. Set base directory to `frontend/vite-project`.
3. Build command: `npm run build`.
4. Publish directory: `frontend/vite-project/dist` if deploying from repo root, or `dist` if the Netlify base directory is `frontend/vite-project`.
5. Add `VITE_API_BASE_URL=https://your-backend.vercel.app/api`.
6. Deploy.

## Completed Features

- Product create, read, update, and delete
- Supplier create, read, update, and delete API
- Purchase records that increase product stock
- Sale records that reduce product stock and prevent overselling
- Dashboard metrics for stock value, low stock, units sold, units purchased, and sales value
- Low-stock alert report
- Public product listing
- Netlify SPA redirect configuration
- Vercel serverless backend configuration
# CODE-A-NOVA
