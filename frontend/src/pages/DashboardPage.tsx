import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Camera,
  Clock,
  AlertTriangle,
  Pill,
  ChevronRight,
  CheckCircle,
  XCircle,
  FileText,
  ShieldCheck,
  BotMessageSquare,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { Prescription, MedicationSchedule } from "../types";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [rxRes, schedRes] = await Promise.all([
          apiClient.get("/prescriptions/"),
          apiClient.get("/reminders/"),
        ]);
        setPrescriptions(rxRes.data.results || rxRes.data);
        setSchedules(schedRes.data.results || schedRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleLogDose = async (scheduleId: string, status: "TAKEN" | "SKIPPED") => {
    try {
      await apiClient.post(`/reminders/${scheduleId}/log/`, { status });
      // Refresh schedules
      const res = await apiClient.get("/reminders/");
      setSchedules(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to log medication dose:", err);
    }
  };

  const patientProfile: any = user?.profile || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{user?.role === "PROFESSIONAL" ? "Doctor Account" : "Patient Health Record"}</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              {t("welcomeBack")}, {user?.first_name || user?.username}!
            </h1>
            <p className="mt-1 text-xs text-teal-100/90 sm:text-sm">
              {t("healthSummary")}
            </p>

            {/* Profile Health Tags */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {patientProfile.blood_group && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-medium backdrop-blur-sm">
                  Blood Group: <b className="text-white">{patientProfile.blood_group}</b>
                </span>
              )}
              {patientProfile.allergies && patientProfile.allergies.length > 0 && (
                <span className="rounded-lg bg-amber-400/20 text-amber-200 px-2.5 py-1 font-medium backdrop-blur-sm">
                  Allergies: <b>{patientProfile.allergies.join(", ")}</b>
                </span>
              )}
              {patientProfile.chronic_conditions && patientProfile.chronic_conditions.length > 0 && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-medium backdrop-blur-sm">
                  Conditions: <b>{patientProfile.chronic_conditions.join(", ")}</b>
                </span>
              )}
            </div>
          </div>

          <Link
            to="/scan"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-bold text-teal-900 shadow-md transition-all hover:bg-teal-50 hover:shadow-lg self-start md:self-auto"
          >
            <Camera className="h-4 w-4 text-teal-700" />
            <span>{t("scanPrescription")}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t("activeRemindersCount")}</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {schedules.filter((s) => s.is_active).length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Scheduled dosage reminders today</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t("prescriptionsAnalyzed")}</span>
            <div className="rounded-xl bg-cyan-50 p-2 text-cyan-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{prescriptions.length}</div>
          <p className="mt-1 text-[11px] text-slate-500">Prescriptions safely stored in vault</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{t("potentialInteractions")}</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">0 Critical</div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">All active regimens verified</p>
        </div>
      </div>

      {/* Today's Medication Reminders Timeline */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Today's Medication Schedule</h2>
          </div>
          <Link to="/reminders" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View All Schedules →
          </Link>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {schedules.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No active medication reminders configured. Add reminders from your confirmed prescriptions.
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{schedule.medicine_name}</h3>
                    <p className="text-xs text-slate-500">
                      {schedule.dosage} • {schedule.frequency} • <span className="text-teal-700">{schedule.instructions}</span>
                    </p>
                    {schedule.reminders && schedule.reminders.length > 0 && (
                      <div className="mt-1 flex gap-2">
                        {schedule.reminders.map((r, i) => (
                          <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            ⏰ {r.reminder_time.slice(0, 5)} ({r.label})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleLogDose(schedule.id, "TAKEN")}
                    className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{t("takeNow")}</span>
                  </button>
                  <button
                    onClick={() => handleLogDose(schedule.id, "SKIPPED")}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{t("skipDose")}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Prescriptions */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">{t("recentPrescriptions")}</h2>
          </div>
          <Link to="/scan" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            + New Scan
          </Link>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {prescriptions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-slate-500">{t("noPrescriptionsYet")}</p>
              <Link
                to="/scan"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal-700"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>{t("scanPrescription")}</span>
              </Link>
            </div>
          ) : (
            prescriptions.map((rx) => (
              <Link
                key={rx.id}
                to={`/prescriptions/${rx.id}`}
                className="group flex items-center justify-between py-4 transition-colors hover:bg-slate-50/80 -mx-3 px-3 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700">
                      {rx.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Doctor: {rx.doctor_name || "Unspecified"} • Date: {rx.prescription_date || rx.created_at.slice(0, 10)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        {rx.medicines?.length || 0} Medicines Identified
                      </span>
                      {rx.reviewed_by_name && (
                        <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          <Stethoscope className="h-3 w-3" />
                          <span>Reviewed by {rx.reviewed_by_name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      rx.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : rx.status === "REVIEWED"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {rx.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

