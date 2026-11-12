import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Camera,
  ShieldCheck,
  Languages,
  AlertTriangle,
  FileCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export const LandingPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner: Educational Disclaimer */}
      <div className="bg-amber-500/10 border-b border-amber-200/60 px-4 py-2 text-center text-xs font-medium text-amber-900">
        <span className="font-bold">⚕️ Clinical Information & Educational Assistant:</span> MediSense AI helps patients understand doctor prescriptions. It does not replace medical advice, alter doses, or diagnose conditions.
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.teal.50),white)] opacity-70" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <div className="text-center lg:col-span-7 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Next-Gen Healthcare Intelligence</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden text-teal-600 sm:inline">English & മലയാളം</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Understand your doctor's prescription with{" "}
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  clinical clarity.
                </span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                Upload or photograph any doctor's prescription. MediSense AI extracts medicine names, explains their therapeutic purposes, alerts you to dangerous drug interactions or duplicate ingredients, and generates simplified bilingual reports.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  to="/scan"
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan Prescription Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                >
                  <span>Sign In / Register</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 text-left">
                <div>
                  <div className="text-lg font-bold text-slate-900">CDSCO / WHO</div>
                  <div className="text-xs text-slate-500">Verified Drug Databases</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">Zero Guessing</div>
                  <div className="text-xs text-slate-500">Uncertainty Flagging</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">DPDP Act</div>
                  <div className="text-xs text-slate-500">Private Vault Storage</div>
                </div>
              </div>
            </div>

            {/* Right Visual Demo: Simulated Scanner Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      Sample Analysis: Dr. Thomas Mathew (MD)
                    </span>
                  </div>
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                    Confidence: 96%
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Medicine 1 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Augmentin 625 Duo Tablet
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Amoxicillin 500mg + Clavulanic Acid 125mg
                        </div>
                      </div>
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-800">
                        Twice daily (BD)
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                      <b>Clinical purpose:</b> Broad-spectrum antibiotic for bacterial respiratory/throat infections.
                    </p>
                  </div>

                  {/* Medicine 2 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Pantocid 40 Tablet
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Pantoprazole 40mg (PPI)
                        </div>
                      </div>
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-800">
                        Once daily (OD)
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">
                      <b>Instruction:</b> Take on empty stomach 30 mins before breakfast to prevent acidity.
                    </p>
                  </div>

                  {/* Malayalam Quick Preview Pill */}
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3 text-[11px] text-cyan-950">
                    <div className="font-bold text-cyan-900 mb-0.5">മലയാളം സംഗ്രഹം:</div>
                    ഡോക്ടർ നിർദ്ദേശിച്ച ആന്റിബയോട്ടിക്കും അസിഡിറ്റി വരാതിരിക്കാനുള്ള ഗുളികയും. കൃത്യമായി ഭക്ഷണത്തിന് ശേഷം കഴിക്കുക.
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-center text-xs font-semibold text-emerald-800">
                  ✓ Verified against CDSCO / WHO essential medicines list
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Showcase */}
      <section className="border-t border-slate-200 bg-slate-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600">
              End-to-End Intelligence
            </h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for patient safety and clinical transparency
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-4">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Prescription Scanner & OCR
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Image contrast enhancement, noise reduction, and medical abbreviation recognition (OD, BD, TDS, SOS) with OCR confidence scoring.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Drug Interaction & Duplicate Checker
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Checks combinations for dangerous interactions (e.g. Warfarin + Aspirin) and prevents accidental duplicate paracetamol overdoses.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 mb-4">
                <Languages className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Native Malayalam & English Support
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Full interface, AI explanation engine, and reports available in authentic Malayalam (മലയാളം) without altering scientific drug names.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Medication Reminders & Logging
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Creates dosage schedules based exclusively on confirmed prescription instructions. Log taken doses and track adherence.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Doctor Review Portal
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Medical professionals can review uncertain prescriptions shared by patients, flag ambiguities, and provide verified clinical guidance.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Private Document Vault & Security
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                All patient files are stored with private access control. Fully aligned with Indian Digital Personal Data Protection (DPDP) Act rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <span className="text-base font-bold text-slate-900">MediSense AI</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Educational Healthcare Technology Platform • Designed for Clinical Safety & Transparency
          </p>
          <p className="mt-4 text-[11px] text-slate-400">
            © 2026 MediSense AI. All rights reserved. Do not use for medical emergencies.
          </p>
        </div>
      </footer>
    </div>
  );
};

