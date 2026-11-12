import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pill,
  Search,
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  X,
  Plus,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { Medicine } from "../types";

export const MedicinesPage: React.FC = () => {
  const { t, language } = useLanguage();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await apiClient.get(`/medicines/?search=${searchQuery}`);
        setMedicines(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMedicines, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categories = [
    "ALL",
    "Analgesic and Antipyretic",
    "Broad-Spectrum Penicillin Antibiotic",
    "Proton Pump Inhibitor (PPI)",
    "Biguanide Antidiabetic Agent",
    "Angiotensin II Receptor Blocker (ARB)",
    "Oral Anticoagulant (Vitamin K Antagonist)",
    "Antiplatelet Agent",
  ];

  const filteredMedicines = medicines.filter((m) => {
    if (selectedCategory === "ALL") return true;
    return m.medicine_category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {t("myMedicines")} & Drug Intelligence Directory
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Verified medical library cross-referenced against CDSCO (India), WHO Essential Medicines, and MedlinePlus.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3 py-1.5 font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            Loading verified medicine data...
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            No medicines matched your search query.
          </div>
        ) : (
          filteredMedicines.map((med) => {
            const uses = language === "ml" && med.common_uses_ml ? med.common_uses_ml : med.common_uses;

            return (
              <div
                key={med.id}
                onClick={() => setSelectedMedicine(med)}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-300 hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Pill className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {med.dosage_form}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-extrabold text-slate-900 group-hover:text-teal-700">
                    {med.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Generic: <b className="text-slate-700">{med.generic_name}</b>
                  </p>

                  <div className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    <b>Common Uses:</b> {uses}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-teal-700 font-bold">
                  <span>View Clinical Monograph →</span>
                  <span className="text-slate-400 font-normal">CDSCO Verified</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Medicine Modal */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-[10px] font-bold text-teal-800">
                  {selectedMedicine.medicine_category}
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {selectedMedicine.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Generic: <b className="text-slate-700">{selectedMedicine.generic_name}</b> • Strength: {selectedMedicine.strength}
                </p>
              </div>

              <button
                onClick={() => setSelectedMedicine(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-4 text-xs">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-bold text-slate-900 mb-1">Common Medical Uses:</h4>
                <p className="text-slate-600 leading-relaxed">
                  {language === "ml" && selectedMedicine.common_uses_ml
                    ? selectedMedicine.common_uses_ml
                    : selectedMedicine.common_uses}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-bold text-slate-900 mb-1">How It Works (Mechanism):</h4>
                <p className="text-slate-600 leading-relaxed">
                  {language === "ml" && selectedMedicine.how_it_works_ml
                    ? selectedMedicine.how_it_works_ml
                    : selectedMedicine.how_it_works}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <h4 className="font-bold text-slate-900 mb-1">Common Side Effects:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {(language === "ml" && selectedMedicine.common_side_effects_ml
                      ? selectedMedicine.common_side_effects_ml
                      : selectedMedicine.common_side_effects
                    ).map((se, i) => (
                      <li key={i}>{se}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <h4 className="font-bold text-slate-900 mb-1">Food Precautions:</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {language === "ml" && selectedMedicine.food_precautions_ml
                      ? selectedMedicine.food_precautions_ml
                      : selectedMedicine.food_precautions}
                  </p>
                </div>
              </div>

              {selectedMedicine.serious_warnings && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-amber-900">
                  <h4 className="font-bold mb-1">⚠️ Serious Warning Signs:</h4>
                  <p className="leading-relaxed">
                    {language === "ml" && selectedMedicine.serious_warnings_ml
                      ? selectedMedicine.serious_warnings_ml
                      : selectedMedicine.serious_warnings}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <h4 className="font-bold text-slate-900 mb-1">Missed Dose Instructions:</h4>
                <p className="text-slate-600 leading-relaxed">
                  {language === "ml" && selectedMedicine.missed_dose_info_ml
                    ? selectedMedicine.missed_dose_info_ml
                    : selectedMedicine.missed_dose_info}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                <span>Verified Source: {selectedMedicine.verified_source}</span>
                <span>Last Updated: {selectedMedicine.last_verified_date}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Link
                to={`/interactions?med=${encodeURIComponent(selectedMedicine.name)}`}
                className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                Check Drug Interactions with this Medicine →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

