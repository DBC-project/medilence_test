import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldAlert,
  Search,
  Pill,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { Medicine, DrugInteractionResult } from "../types";

export const InteractionCheckerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([]);
  const [customMedicineInput, setCustomMedicineInput] = useState("");
  const [customList, setCustomList] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DrugInteractionResult | null>(null);

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await apiClient.get("/medicines/");
        const list: Medicine[] = res.data.results || res.data;
        setAvailableMedicines(list);

        // Preload medicine from query param if available
        const paramMed = searchParams.get("med");
        if (paramMed) {
          const match = list.find((m) => m.name.toLowerCase().includes(paramMed.toLowerCase()));
          if (match) {
            setSelectedMedicines([match]);
          } else {
            setCustomList([paramMed]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
      }
    };

    fetchMeds();
  }, [searchParams]);

  const handleAddMedicine = (med: Medicine) => {
    if (!selectedMedicines.some((m) => m.id === med.id)) {
      setSelectedMedicines([...selectedMedicines, med]);
    }
  };

  const handleRemoveMedicine = (id: string) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.id !== id));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMedicineInput.trim() && !customList.includes(customMedicineInput.trim())) {
      setCustomList([...customList, customMedicineInput.trim()]);
      setCustomMedicineInput("");
    }
  };

  const handleRemoveCustom = (name: string) => {
    setCustomList(customList.filter((c) => c !== name));
  };

  const handleCheckInteractions = async () => {
    if (selectedMedicines.length + customList.length < 2) {
      alert("Please select or add at least two medicines to analyze interactions.");
      return;
    }

    setIsChecking(true);
    try {
      const res = await apiClient.post("/interactions/check/", {
        medicine_ids: selectedMedicines.map((m) => m.id),
        medicine_names: customList,
        language,
      });
      setResult(res.data);
    } catch (err) {
      console.error("Interaction check failed:", err);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          <AlertOctagon className="h-3.5 w-3.5 text-amber-600" />
          <span>Patient Safety Screening</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {t("interactionTitle")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {t("interactionSubtitle")}
        </p>
      </div>



      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Medicine Selection */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">1. Select Medicines to Compare</h3>

            {/* Quick Available Picker */}
            <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
              {availableMedicines.map((med) => (
                <div
                  key={med.id}
                  onClick={() => handleAddMedicine(med)}
                  className="flex items-center justify-between rounded-lg p-2 text-xs hover:bg-white hover:shadow-sm cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-bold text-slate-900">{med.name}</span>
                    <span className="text-slate-500 block text-[11px]">{med.generic_name}</span>
                  </div>
                  <button className="rounded bg-teal-50 px-2 py-0.5 text-teal-700 font-bold hover:bg-teal-100">
                    + Add
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                type="text"
                value={customMedicineInput}
                onChange={(e) => setCustomMedicineInput(e.target.value)}
                placeholder="Or type another medicine/ingredient..."
                className="flex-1 rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900"
              >
                Add
              </button>
            </form>
          </div>

          {/* Currently Selected Pill Chips */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Selected for Analysis ({selectedMedicines.length + customList.length})
              </h3>
              {(selectedMedicines.length > 0 || customList.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedMedicines([]);
                    setCustomList([]);
                    setResult(null);
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedMedicines.map((med) => (
                <span
                  key={med.id}
                  className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900"
                >
                  <Pill className="h-3.5 w-3.5 text-teal-600" />
                  <span>{med.name}</span>
                  <button
                    onClick={() => handleRemoveMedicine(med.id)}
                    className="ml-1 text-teal-600 hover:text-teal-900"
                  >
                    ×
                  </button>
                </span>
              ))}

              {customList.map((name) => (
                <span
                  key={name}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  <span>{name}</span>
                  <button
                    onClick={() => handleRemoveCustom(name)}
                    className="ml-1 text-slate-500 hover:text-slate-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <button
              onClick={handleCheckInteractions}
              disabled={isChecking || selectedMedicines.length + customList.length < 2}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>{isChecking ? "Screening Interactions..." : t("checkNowBtn")}</span>
            </button>
          </div>
        </div>

        {/* Right: Results Display */}
        <div className="space-y-6 lg:col-span-6">
          {!result ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
              <ShieldAlert className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">No Check Performed Yet</p>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Add 2 or more medicines on the left and click "Check Selected Medicines" to screen for dangerous drug interactions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Status Banner */}
              <div
                className={`rounded-3xl border p-5 ${
                  result.status === "POTENTIALLY_SERIOUS"
                    ? "border-rose-300 bg-rose-50 text-rose-950"
                    : result.status === "ATTENTION_REQUIRED"
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-emerald-300 bg-emerald-50 text-emerald-950"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.status === "POTENTIALLY_SERIOUS" ? (
                    <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : result.status === "ATTENTION_REQUIRED" ? (
                    <AlertOctagon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wide">
                      {result.status === "POTENTIALLY_SERIOUS"
                        ? t("seriousInteraction")
                        : result.status === "ATTENTION_REQUIRED"
                        ? t("attentionRequired")
                        : t("noInteraction")}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed font-medium">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Duplicate Active Ingredient Warnings */}
              {result.duplicate_alerts && result.duplicate_alerts.length > 0 && (
                <div className="space-y-3">
                  {result.duplicate_alerts.map((dup, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border-2 border-rose-300 bg-white p-5 shadow-sm space-y-2"
                    >
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{dup.title}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {dup.description}
                      </p>
                      <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900">
                        <b>Clinical Directive:</b> {dup.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pairwise Interaction Cards */}
              {result.interactions && result.interactions.length > 0 && (
                <div className="space-y-3">
                  {result.interactions.map((inter) => (
                    <div
                      key={inter.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">
                          {inter.primary_ingredient} + {inter.secondary_ingredient}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            inter.severity === "POTENTIALLY_SERIOUS"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {inter.severity}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {inter.description}
                      </p>

                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-800">
                        <b>Guidance for Patient:</b> {inter.recommendation}
                      </div>

                      <div className="text-[11px] text-slate-400 pt-1">
                        <b>Evidence Source:</b> {inter.evidence_source} (Confidence: {(inter.confidence_score * 100).toFixed(0)}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mandatory Legal & Safety Guidance */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">⚠️ Pharmacopeia Notice:</span> {result.disclaimer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

