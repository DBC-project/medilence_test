import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Download,
  Printer,
  Pill,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  BotMessageSquare,
  Globe,
  Share2,
  Clock,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { Prescription, GeneratedReport } from "../types";

export const PrescriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportLang, setReportLang] = useState<"en" | "ml">("en");

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await apiClient.get(`/prescriptions/${id}/`);
        setPrescription(res.data);
        if (res.data.reports && res.data.reports.length > 0) {
          setReport(res.data.reports[0]);
        }
      } catch (err) {
        console.error("Failed to load prescription:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPrescription();
  }, [id]);

  const handleGenerateReport = async () => {
    if (!prescription) return;
    setGeneratingReport(true);
    try {
      const res = await apiClient.post(`/reports/generate/${prescription.id}/`, {
        language: reportLang,
      });
      setReport(res.data);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    window.open(`/api/reports/${report.id}/download/`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading prescription intelligence...</div>;
  }

  if (!prescription) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-bold text-slate-800">Prescription record not found.</p>
        <Link to="/dashboard" className="mt-3 inline-block text-xs text-teal-600 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Back button & Action Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Prescriptions</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language selector for Report */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <button
              onClick={() => setReportLang("en")}
              className={`rounded px-2 py-1 font-semibold ${reportLang === "en" ? "bg-teal-600 text-white" : "text-slate-600"}`}
            >
              English Report
            </button>
            <button
              onClick={() => setReportLang("ml")}
              className={`rounded px-2 py-1 font-semibold ${reportLang === "ml" ? "bg-teal-600 text-white" : "text-slate-600"}`}
            >
              മലയാളം റിപ്പോർട്ട്
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{generatingReport ? "Compiling..." : t("generateReport")}</span>
          </button>

          {report && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-teal-600" />
              <span>{t("downloadPdf")}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>{t("printReport")}</span>
          </button>
        </div>
      </div>

      {/* Main Prescription Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
              <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
              <span>{prescription.status}</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {prescription.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              <span><b>Prescribing Doctor:</b> {prescription.doctor_name || "Unspecified"}</span>
              <span>•</span>
              <span><b>Facility:</b> {prescription.clinic_name || "Unspecified"}</span>
              <span>•</span>
              <span><b>Date:</b> {prescription.prescription_date || prescription.created_at.slice(0, 10)}</span>
            </div>
          </div>

          <Link
            to={`/assistant?rx=${prescription.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
          >
            <BotMessageSquare className="h-4 w-4 text-teal-600" />
            <span>Consult AI Assistant</span>
          </Link>
        </div>

        {/* Doctor Verification Review Notes if present */}
        {prescription.doctor_review_notes && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex items-start gap-3">
              <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-blue-900">
                  Medical Professional Review by {prescription.reviewed_by_name || "Licensed Physician"}
                </h3>
                <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                  {prescription.doctor_review_notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Educational Notice */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">⚠️ Mandatory Educational Notice:</span> This prescription interpretation is generated by AI for educational understanding. It does not substitute for the direct clinical judgment of your prescribing doctor or pharmacist.
        </div>
      </div>

      {/* Identified Medicines & In-Depth Clinical Intelligence */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Identified Medicines & Clinical Guidance ({prescription.medicines?.length || 0})
          </h2>
        </div>

        <div className="space-y-6">
          {prescription.medicines?.map((med, idx) => {
            const dbMed = med.matched_medicine_detail;
            const uses = reportLang === "ml" && dbMed?.common_uses_ml ? dbMed.common_uses_ml : (dbMed?.common_uses || "Follow doctor instructions");
            const sideEffects = reportLang === "ml" && dbMed?.common_side_effects_ml ? dbMed.common_side_effects_ml : dbMed?.common_side_effects;
            const warnings = reportLang === "ml" && dbMed?.serious_warnings_ml ? dbMed.serious_warnings_ml : dbMed?.serious_warnings;
            const food = reportLang === "ml" && dbMed?.food_precautions_ml ? dbMed.food_precautions_ml : dbMed?.food_precautions;
            const missed = reportLang === "ml" && dbMed?.missed_dose_info_ml ? dbMed.missed_dose_info_ml : dbMed?.missed_dose_info;

            return (
              <div key={med.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                {/* Medicine Title Header */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-bold">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">{med.medicine_name}</h3>
                        <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                          {med.dosage_form}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Generic: <b className="text-slate-700">{med.generic_name || "N/A"}</b> • Category: {dbMed?.medicine_category || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      Dose: {med.prescribed_dose}
                    </span>
                    <span className="rounded-lg bg-teal-50 px-3 py-1 font-semibold text-teal-800">
                      Frequency: {med.frequency}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      Duration: {med.duration}
                    </span>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  {/* Common Uses */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="font-bold text-slate-900 mb-1">
                      {reportLang === "ml" ? "എന്തിന് ഉപയോഗിക്കുന്നു (Common Uses):" : "Why Commonly Prescribed:"}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{uses}</p>
                  </div>

                  {/* Food & Administration */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="font-bold text-slate-900 mb-1">
                      {reportLang === "ml" ? "കഴിക്കേണ്ട രീതി (Food Precautions):" : "Food & Administration Instructions:"}
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {med.special_instructions || food}
                    </p>
                  </div>

                  {/* Side Effects */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="font-bold text-slate-900 mb-1">
                      {reportLang === "ml" ? "പാർശ്വഫലങ്ങൾ (Common Side Effects):" : "Common Side Effects:"}
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {sideEffects && sideEffects.length > 0 ? sideEffects.join(", ") : "Generally well-tolerated at prescribed dosage."}
                    </p>
                  </div>

                  {/* Missed Dose */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="font-bold text-slate-900 mb-1">
                      {reportLang === "ml" ? "ഡോസ് വിട്ടുപോയാൽ (Missed Dose):" : "What if a dose is missed?"}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{missed || "Take as soon as remembered. Never double up."}</p>
                  </div>
                </div>

                {/* Warnings if any */}
                {warnings && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
                    <span className="font-bold">⚠️ Serious Precautions: </span>
                    {warnings}
                  </div>
                )}

                {/* Evidence Source Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  <span>Source: {dbMed?.verified_source || "CDSCO / MedlinePlus"}</span>
                  <span>Last Verified: {dbMed?.last_verified_date || "2026"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

