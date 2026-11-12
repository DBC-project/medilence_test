import React, { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Pill,
  Calendar,
  AlertCircle,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { MedicationSchedule, Prescription } from "../types";

export const RemindersPage: React.FC = () => {
  const { t } = useLanguage();

  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("1 tablet");
  const [frequency, setFrequency] = useState("Twice daily (BD)");
  const [instructions, setInstructions] = useState("Take after food");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderTime2, setReminderTime2] = useState("20:00");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchSchedules = async () => {
    try {
      const [schedRes, rxRes] = await Promise.all([
        apiClient.get("/reminders/"),
        apiClient.get("/prescriptions/"),
      ]);
      setSchedules(schedRes.data.results || schedRes.data);
      setPrescriptions(rxRes.data.results || rxRes.data);
    } catch (err) {
      console.error("Failed to load reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleLogStatus = async (scheduleId: string, status: "TAKEN" | "SKIPPED") => {
    try {
      await apiClient.post(`/reminders/${scheduleId}/log/`, { status });
      fetchSchedules();
    } catch (err) {
      console.error("Failed to log status:", err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/reminders/", {
        medicine_name: medName,
        dosage,
        frequency,
        instructions,
        start_date: startDate,
        is_active: true,
        reminders: [
          { reminder_time: `${reminderTime}:00`, label: "Dose 1", days_of_week: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], is_enabled: true },
          ...(frequency.includes("Twice") ? [{ reminder_time: `${reminderTime2}:00`, label: "Dose 2", days_of_week: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], is_enabled: true }] : [])
        ]
      });

      setShowAddModal(false);
      setMedName("");
      fetchSchedules();
    } catch (err) {
      console.error("Failed to create reminder schedule:", err);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this medication schedule?")) return;
    try {
      await apiClient.delete(`/reminders/${id}/`);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {t("reminders")} & Adherence Tracker
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Keep track of daily doses strictly matching your doctor's confirmed prescription instructions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Medication Reminder</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading reminder schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
            <Clock className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No Active Schedules</p>
            <p className="text-xs text-slate-500 mt-1">Add medication reminders manually or import from a confirmed prescription.</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 font-bold flex-shrink-0">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{schedule.medicine_name}</h3>
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      {schedule.dosage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Frequency: <b className="text-slate-700">{schedule.frequency}</b> • Instructions: <b className="text-teal-700">{schedule.instructions}</b>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {schedule.reminders?.map((r, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                        <Clock className="h-3 w-3 text-teal-600" />
                        <span>{r.reminder_time.slice(0, 5)} ({r.label})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleLogStatus(schedule.id, "TAKEN")}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("takeNow")}</span>
                </button>
                <button
                  onClick={() => handleLogStatus(schedule.id, "SKIPPED")}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{t("skipDose")}</span>
                </button>
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Delete Schedule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Medication Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Augmentin 625 Duo"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Dosage</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="1 tablet"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Once daily (OD)">Once daily (OD)</option>
                    <option value="Twice daily (BD)">Twice daily (BD)</option>
                    <option value="Three times daily (TDS)">Three times daily (TDS)</option>
                    <option value="As needed (SOS)">As needed (SOS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. After breakfast and dinner"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">First Reminder Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
                {frequency.includes("Twice") && (
                  <div>
                    <label className="block font-semibold text-slate-700">Second Reminder Time</label>
                    <input
                      type="time"
                      value={reminderTime2}
                      onChange={(e) => setReminderTime2(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 py-2.5 font-bold text-white shadow-sm hover:bg-teal-700"
              >
                Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

