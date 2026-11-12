# MediSense AI - Production Deployment Guide (Vercel & Render)

This application is divided into:
1. **Frontend**: React + Vite + TypeScript + Tailwind CSS (Optimized for **Vercel**)
2. **Backend**: Django REST Framework + PostgreSQL / SQLite + RapidOCR ONNX AI (Optimized for **Render**, **Railway**, or **AWS**)

---

## 🚀 Part 1: Deploy Frontend on Vercel (Takes 2 Minutes)

### Option A: Import Whole Git Repository directly to Vercel
1. Push your project to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your MediSense repository.
4. **Vercel automatically detects Vite!**
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (or click Edit and select `frontend`)
   - **Build Command**: `cd frontend && npm install && npm run build` (or `npm run build` if root is `frontend`)
   - **Output Directory**: `frontend/dist` (or `dist` if root is `frontend`)
5. In **Environment Variables**, add:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://medisense-backend.onrender.com/api`)
6. Click **"Deploy"**.

> [!NOTE]
> `vercel.json` is already pre-configured with client-side SPA routing (`rewrites: [ { "source": "/(.*)", "destination": "/index.html" } ]`), ensuring page refreshes on subpaths (e.g. `/scan`, `/medicines`, `/reminders`) work without 404 errors.

---

## 🐍 Part 2: Deploy Backend on Render (Free Tier Supported)

### Step 1: Create a PostgreSQL Database on Render
1. On [Render Dashboard](https://dashboard.render.com), click **New +** -> **PostgreSQL**.
2. Name it `medisense-db`.
3. Copy the **Internal Database URL** or **External Database URL**.

### Step 2: Create a Web Service for Backend
1. On Render, click **New +** -> **Web Service**.
2. Select your MediSense repository.
3. Configure the service:
   - **Name**: `medisense-api`
   - **Region**: Singapore or nearest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py seed_large_medicine_dataset`)
   - **Start Command**: `gunicorn medisense.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 180`
4. Add **Environment Variables**:
   - `DJANGO_SECRET_KEY`: *(Generate a random 50+ character string)*
   - `DJANGO_DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*`
   - `DATABASE_URL`: *(Paste your Render PostgreSQL URL from Step 1)*
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: *(Optional free Google AI Studio key; RapidOCR works on-device even if blank)*
5. Click **"Create Web Service"**.

---

## 🔗 Part 3: Link Vercel to Backend
Once your Render backend is live (e.g., `https://medisense-api.onrender.com`):
1. Go to your **Vercel Project Settings** -> **Environment Variables**.
2. Set:
   ```
   VITE_API_URL = https://medisense-api.onrender.com/api
   ```
3. Trigger a redeploy on Vercel.

Your production healthcare platform is now fully live and accessible worldwide!

