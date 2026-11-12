import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  MessageSquare,
  ArrowRight,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { Prescription } from "../types";

export const ProfessionalPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchPrescriptions = async () => {
    try {
      const res = await apiClient.get("/prescriptions/");
      const list: Prescription[] = res.data.results || res.data;
      setPrescriptions(list);
      if (list.length > 0 && !selectedRx) {
        setSelectedRx(list[0]);
        setReviewNotes(list[0].doctor_review_notes || "");
      }
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleSelectPrescription = (rx: Prescription) => {
    setSelectedRx(rx);
    setReviewNotes(rx.doctor_review_notes || "");
    setSuccessMsg("");
  };

  const handleSubmitReview = async () => {
    if (!selectedRx) return;
    setSubmitting(true);
    setSuccessMsg("");

    try {
      const res = await apiClient.post(`/prescriptions/${selectedRx.id}/doctor-review/`, {
        doctor_review_notes: reviewNotes,
      });

      setSelectedRx(res.data);
      setSuccessMsg("Clinical review notes recorded and patient notified!");
      fetchPrescriptions();
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const profProfile: any = user?.profile || {};

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-200">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Medical Professional Portal</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">
                {profProfile.is_verified ? "Verified License ✓" : "Pending Verification"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Dr. {user?.full_name || user?.username}
            </h1>
            <p className="mt-1 text-xs text-blue-200 sm:text-sm">
              License: <b className="text-white">{profProfile.medical_license_number || "KMC-49281"}</b> • Specialization: <b className="text-white">{profProfile.specialization || "Internal Medicine"}</b>
            </p>
          </div>

          <div className="rounded-2xl border border-blue-400/20 bg-white/10 p-4 text-xs backdrop-blur-sm">
            <span className="font-bold block text-white mb-0.5">Clinical Responsibility:</span>
            Review prescriptions flagged with uncertain OCR or ambiguous handwriting to protect patient safety.
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Queue of Shared Prescriptions */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Prescription Review Queue ({prescriptions.length})
            </h2>
          </div>

          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                onClick={() => handleSelectPrescription(rx)}
                className={`rounded-2xl border p-4 transition-all cursor-pointer ${
                  selectedRx?.id === rx.id
                    ? "border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{rx.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Patient: <b className="text-slate-700">{rx.patient_name || rx.patient_email}</b>
                    </p>
                    <p className="text-[11px] text-slate-400">Date: {rx.prescription_date || rx.created_at.slice(0, 10)}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      rx.status === "REVIEWED"
                        ? "bg-blue-100 text-blue-800"
                        : rx.has_unclear_handwriting
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {rx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Review Panel */}
        <div className="space-y-6 lg:col-span-7">
          {selectedRx ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {selectedRx.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Patient: {selectedRx.patient_name} ({selectedRx.patient_email})
                  </p>
                </div>

                <Link
                  to={`/prescriptions/${selectedRx.id}`}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  View Full Report →
                </Link>
              </div>

              {/* Extracted medicines list */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Extracted Medicines & Dosage:
                </h4>
                <div className="space-y-2">
                  {selectedRx.medicines?.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{m.medicine_name}</div>
                        <div className="text-slate-500 text-[11px]">{m.generic_name} • {m.strength}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-700">{m.prescribed_dose} ({m.frequency})</span>
                        <div className="text-[10px] text-teal-700">{m.special_instructions}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Review Input Form */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-800">
                  Doctor Clinical Review & Prescription Verification Notes:
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter your clinical remarks, clarify ambiguous medicines, or confirm proper dosing..."
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                />

                {successMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting || !reviewNotes.trim()}
                  onClick={handleSubmitReview}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Submitting..." : "Submit Doctor Review & Notify Patient"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              Select a prescription from the queue to start review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

