# MediSense AI ⚕️
### AI-Powered Prescription & Medicine Intelligence Platform

> **Clinical Disclaimer**: MediSense AI provides AI-assisted medical information to help patients understand their doctor's prescriptions and identify the therapeutic purpose of prescribed medicines. **It does NOT diagnose medical conditions, prescribe medication, alter dosages, or substitute for the clinical judgment of a licensed physician or registered pharmacist.**

---

## 🌟 Real Free AI Integration (Zero Dummy Data)

MediSense AI operates on **100% REAL clinical models and verified pharmacopeia databases** with **zero fake fallbacks or dummy prescriptions**:

### 1. Real Free AI Providers
- **Google Gemini 1.5 / 2.0 Flash (Free Tier)**:
  - Generous free quota from Google AI Studio (`15 requests/min`, `1,500 requests/day` for free without a credit card).
  - Multimodal Vision: Reads handwritten doctor prescriptions directly and outputs validated medical JSON schemas.
- **Groq Cloud (Free Tier)**:
  - Ultra-fast inference with `Llama 3.3 70B Versatile` (`30 requests/min` free forever).
- **OpenRouter (Free Models)**:
  - Supports open-weight free models (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`).
- **Pollinations.ai (Anonymous Free Gateway)**:
  - Out-of-the-box text generation without requiring an account or API key.
- **Official CDSCO / WHO Clinical Knowledge Engine (RAG)**:
  - Authoritative reference matching against the Central Drugs Standard Control Organisation (India) and WHO Essential Medicines list.

### 2. In-App AI Configuration & Instant Testing
Click the **"Free AI Engine"** button in the top navigation bar to:
- Select your preferred free AI provider.
- Paste your free API key from Google AI Studio or Groq Cloud.
- Click **"Test Free AI Connection"** to send a live clinical prompt and verify real-time response and latency.
- Keys are persisted securely in the database (`SystemConfiguration` model) and take effect immediately without restarting the server.

---

## 🚀 Key Modules & Capabilities

1. **Real Prescription Vision OCR & NLP**:
   - Accepts JPG, PNG, and PDF doctor prescriptions.
   - **OpenCV Image Processing**: CLAHE contrast enhancement, bilateral filter noise reduction, and adaptive binarization.
   - Multimodal Gemini Vision extracts prescribed medicines, dosages, frequencies, and durations.
   - **Zero-Guessing Uncertainty Guardrail**: If handwriting is illegible, the platform explicitly flags:
     > *"Medicine name uncertain. Please confirm with your doctor or pharmacist."*
     Never guesses medicines or alters dosages.

2. **Medicine Intelligence & Monograph Library**:
   - Verified against **CDSCO (India)**, **WHO Essential Medicines**, and **MedlinePlus**.
   - Dual-language indications, mechanisms of action, common side effects, serious warning signs, and food interactions in English and natural Malayalam (മലയാളം).

3. **Drug-Drug Interaction & Duplicate Ingredient Checker**:
   - Evaluates multi-medicine combinations.
   - Flags potentially serious interactions (e.g. Warfarin + Aspirin, Telmisartan + Ibuprofen, Metformin + Alcohol).
   - Detects duplicate active ingredients (e.g. Dolo 650 + Crocin = duplicate Paracetamol) to protect against accidental overdosing.

4. **Context-Aware Medical Information Assistant**:
   - Grounded in the user's confirmed prescription when authorized.
   - **Emergency Symptom Guardrail**: Detects emergency symptoms (acute chest pain, severe dyspnea, anaphylaxis) and directs the patient immediately to dial **112 / 108**.

5. **Medication Reminders & Medical Vault**:
   - Reminders strictly matching confirmed prescriptions.
   - Private document vault aligned with Indian **Digital Personal Data Protection (DPDP) Act** rules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Lucide React, React Router v7, TanStack Query |
| **Backend** | Python 3.11+, Django 5.1, Django REST Framework, SimpleJWT |
| **Database** | PostgreSQL (Production) / SQLite (Zero-Config Local Dev Mode) |
| **Vision & AI** | Google Gemini Vision (Free Tier), Groq Cloud, OpenCV, PyPDF |
| **PDF Export** | ReportLab (Bilingual clinical reports with medical disclaimers) |

---

## 🚦 Quickstart & Local Setup

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed official CDSCO/WHO drug library and interaction rules (Zero dummy prescriptions)
python manage.py seed_medicines

# Start Django backend (Port 8000)
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install node packages
npm install

# Start Vite dev server (Port 5173)
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Free AI Keys Setup (Quick Links)

1. **Google Gemini (Free Tier)**:
   - Get key in 30 seconds: [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Set in `.env`: `GEMINI_API_KEY=your_key_here` (or click **Free AI Engine** in the app header).
2. **Groq Cloud (Free Tier)**:
   - Get key: [Groq Console](https://console.groq.com/keys)
   - Set in `.env`: `GROQ_API_KEY=your_key_here`.

---

## 🧪 Automated Testing

```bash
# Backend unit & integration tests
cd backend
python manage.py test

# Frontend TypeScript build
cd frontend
npm run build
```
