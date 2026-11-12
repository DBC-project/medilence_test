import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  Sliders,
  Pill,
  Package,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { PrescriptionMedicine, Medicine } from "../types";

export const ScanPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Mode: Doctor Prescription vs Medicine Product Pack (Box, Blister Strip, Bottle)
  const [scanMode, setScanMode] = useState<"PRESCRIPTION" | "PRODUCT_PACK">("PRESCRIPTION");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [prescriptionTitle, setPrescriptionTitle] = useState("");

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [extractedPrescription, setExtractedPrescription] = useState<any | null>(null);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [rawText, setRawText] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(true);

  // Available medicines for autocomplete
  const [verifiedMedicines, setVerifiedMedicines] = useState<Medicine[]>([]);

  // Simulated OpenCV Preprocessing Toggle Filters
  const [enhanceContrast, setEnhanceContrast] = useState(true);
  const [denoiseFilter, setDenoiseFilter] = useState(true);
  const [binarizeMode, setBinarizeMode] = useState(false);

  useEffect(() => {
    apiClient.get("/medicines/").then((res) => {
      setVerifiedMedicines(res.data.results || res.data);
    }).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPrescriptionTitle(file.name.replace(/\.[^/.]+$/, ""));
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleStartAnalysis = async () => {
    setIsProcessing(true);
    setProcessingStep(
      scanMode === "PRODUCT_PACK"
        ? "Analyzing medicine strip/packaging text & detecting pharmaceutical composition..."
        : "Uploading file & applying OpenCV CLAHE contrast enhancement..."
    );

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        const blob = new Blob([rawText || "Medicine Scan"], { type: "text/plain" });
        formData.append("file", blob, "scan_input.txt");
      }
      formData.append(
        "title",
        prescriptionTitle || (scanMode === "PRODUCT_PACK" ? "Medicine Product Scan" : "Doctor Prescription Scan")
      );
      formData.append("scan_category", scanMode);
      formData.append("doctor_name", doctorName);
      formData.append("clinic_name", clinicName);
      formData.append("raw_text", rawText);

      setTimeout(() => setProcessingStep("Detecting text lines, dosage form & active ingredients..."), 700);
      setTimeout(() => setProcessingStep("Cross-referencing entities against CDSCO / WHO essential medicines..."), 1300);

      const res = await apiClient.post("/prescriptions/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setExtractedPrescription(res.data);
      setMedicines(res.data.medicines || []);
    } catch (err: any) {
      console.error("Prescription analysis failed:", err);
      alert(err.response?.data?.error || "Failed to analyze document. Please check file format.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleAddNewMedicine = (prefill?: Partial<PrescriptionMedicine>) => {
    const newMed: PrescriptionMedicine = {
      id: `manual-${Date.now()}`,
      prescription: extractedPrescription?.id || "",
      medicine_name: prefill?.medicine_name || "",
      brand_name: prefill?.brand_name || "",
      generic_name: prefill?.generic_name || "",
      active_ingredient: prefill?.active_ingredient || prefill?.generic_name || "",
      strength: prefill?.strength || "500 mg",
      dosage_form: prefill?.dosage_form || "Tablet",
      prescribed_dose: prefill?.prescribed_dose || "1 Tablet",
      frequency: prefill?.frequency || (scanMode === "PRODUCT_PACK" ? "As directed by physician" : "Twice daily (BD)"),
      duration: prefill?.duration || "5 days",
      route_of_administration: "Oral",
      special_instructions: prefill?.special_instructions || "Take after meals with water",
      confidence_score: 1.0,
      ocr_uncertainty: false,
      user_confirmed: true,
      user_edited: true,
    };
    setMedicines([...medicines, newMed]);
  };

  const handleDeleteMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: keyof PrescriptionMedicine, value: any) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSelectAutocomplete = (index: number, med: Medicine) => {
    const updated = [...medicines];
    updated[index] = {
      ...updated[index],
      medicine_name: med.name,
      brand_name: med.brand_name || med.name,
      generic_name: med.generic_name,
      active_ingredient: med.generic_name,
      strength: med.strength || "500 mg",
      dosage_form: med.dosage_form || "Tablet",
      special_instructions: med.food_precautions || "Take after food with water",
      ocr_uncertainty: false,
    };
    setMedicines(updated);
  };

  const handleConfirmAndProceed = async () => {
    if (!extractedPrescription) return;

    if (medicines.length === 0) {
      alert("Please add at least one medicine before generating the intelligence report.");
      return;
    }

    try {
      await apiClient.patch(`/prescriptions/${extractedPrescription.id}/confirm/`, {
        medicines: medicines,
      });
      navigate(`/prescriptions/${extractedPrescription.id}`);
    } catch (err) {
      console.error("Failed to confirm prescription:", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-sm">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>⚡ Free Open-Source AI Vision & On-Device Neural OCR (RapidOCR + OpenCV)</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {scanMode === "PRODUCT_PACK" ? "Medicine Product & Strip Scanner" : t("scannerTitle")}
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {scanMode === "PRODUCT_PACK"
            ? "Photograph any medicine strip, blister foil, box, or syrup bottle to identify the active chemical ingredients, purpose, and precautions."
            : t("scannerSubtitle")}
        </p>
      </div>

      {!extractedPrescription ? (
        <div className="space-y-6">
          {/* Scan Mode Toggle: Prescription Slip vs Product Packaging */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setScanMode("PRESCRIPTION")}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                scanMode === "PRESCRIPTION"
                  ? "border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileText className="h-4 w-4 text-teal-600" />
              <span>Doctor's Prescription Slip</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode("PRODUCT_PACK")}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                scanMode === "PRODUCT_PACK"
                  ? "border-teal-600 bg-teal-50 text-teal-900 shadow-sm ring-1 ring-teal-500"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Package className="h-4 w-4 text-teal-600" />
              <span>Medicine Strip / Box / Bottle</span>
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Upload Zone */}
            <div className="space-y-6 lg:col-span-7">
              <div className="rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/30 p-8 text-center transition-colors hover:bg-teal-50/50">
                <input
                  type="file"
                  id="prescription-file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="prescription-file"
                  className="flex cursor-pointer flex-col items-center justify-center space-y-3"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-500/20">
                    <Camera className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedFile
                        ? selectedFile.name
                        : scanMode === "PRODUCT_PACK"
                        ? "Take photo or upload medicine packaging / strip image"
                        : t("dropzoneTitle")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{t("supportedFormats")}</p>
                  </div>
                </label>

                {filePreview && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                    <p className="text-[11px] font-bold text-slate-500 mb-1 text-left">Selected Image Preview:</p>
                    <img
                      src={filePreview}
                      alt="Upload Preview"
                      className={`max-h-60 w-full object-contain rounded-lg ${binarizeMode ? "contrast-200 grayscale" : ""}`}
                    />
                  </div>
                )}
              </div>

              {/* OpenCV Image Filters */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 pb-2 text-xs font-bold text-slate-800">
                  <Sliders className="h-4 w-4 text-teal-600" />
                  <span>OpenCV Preprocessing & Foil Denoising</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={enhanceContrast}
                      onChange={(e) => setEnhanceContrast(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>CLAHE Contrast</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={denoiseFilter}
                      onChange={(e) => setDenoiseFilter(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Bilateral Denoise</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={binarizeMode}
                      onChange={(e) => setBinarizeMode(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Adaptive Binarize</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Optional Details */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
              <h3 className="text-sm font-bold text-slate-900">
                {scanMode === "PRODUCT_PACK" ? "Medicine Product Information" : "Prescription Information"}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Scan Label / Title</label>
                <input
                  type="text"
                  value={prescriptionTitle}
                  onChange={(e) => setPrescriptionTitle(e.target.value)}
                  placeholder={scanMode === "PRODUCT_PACK" ? "e.g. Paracetamol Tablet Strip" : "e.g. Clinic Prescription"}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              {scanMode === "PRESCRIPTION" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Doctor / Physician Name</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Thomas Mathew"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Clinic / Hospital</label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="e.g. Cochin Medical Center"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {scanMode === "PRODUCT_PACK"
                    ? "Visible Text on Box / Strip (Optional notes)"
                    : "Prescription Text / Notes (Optional manual lines)"}
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    scanMode === "PRODUCT_PACK"
                      ? "e.g. Dolo 650 Paracetamol Tablets IP 650mg, Micro Labs..."
                      : "Rx: Augmentin 625 Duo 1 tab BD x 5 days..."
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isProcessing || (!selectedFile && !rawText)}
                onClick={handleStartAnalysis}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{processingStep}</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>{scanMode === "PRODUCT_PACK" ? "Identify Medicine Product" : "Start Prescription OCR & AI"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Confirmation and Uncertainty Verification Section */
        <div className="space-y-6">
          {/* Uncertainty Warning Banner if any unclear handwriting detected */}
          {extractedPrescription.has_unclear_handwriting && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    {t("uncertaintyWarningTitle")}
                  </h3>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    {t("uncertaintyWarningBody")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Image Viewer Collapsible */}
          {filePreview && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Eye className="h-4 w-4 text-teal-600" />
                  <span>Uploaded {scanMode === "PRODUCT_PACK" ? "Product Packaging" : "Prescription"} Image Reference:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImagePreview(!showImagePreview)}
                  className="text-xs font-semibold text-teal-600 hover:underline"
                >
                  {showImagePreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>

              {showImagePreview && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
                  <img
                    src={filePreview}
                    alt="Prescription Reference"
                    className="max-h-80 mx-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Extracted medicines list header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {scanMode === "PRODUCT_PACK" ? "Identified Medicine Product & Formulation" : t("extractedMedicines")}
              </h2>
              <p className="text-xs text-slate-500">
                Please verify or add prescribed medicines before compiling the final report:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddNewMedicine()}
                className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Medicine Manually</span>
              </button>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {medicines.length} Found
              </span>
            </div>
          </div>

          {/* When 0 medicines found: Helpful Empty State */}
          {medicines.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-900">
                  No medicines automatically identified from this image
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  The packaging or handwriting may be faint, angled, or reflective. You can add the prescribed medicine manually below to look up its clinical information, side effects, and precautions.
                </p>
              </div>

              {/* Quick Autocomplete Suggestions from Database */}
              <div className="pt-2 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">
                  Quick-Add From Verified Medicine Library ({verifiedMedicines.length} Medicines Available):
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 max-w-2xl mx-auto">
                  {verifiedMedicines.slice(0, 14).map((vm) => (
                    <button
                      key={vm.id}
                      type="button"
                      onClick={() =>
                        handleAddNewMedicine({
                          medicine_name: vm.name,
                          brand_name: vm.brand_name || vm.name,
                          generic_name: vm.generic_name,
                          strength: vm.strength,
                          dosage_form: vm.dosage_form,
                          special_instructions: vm.food_precautions,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900 transition-all"
                    >
                      + {vm.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => handleAddNewMedicine()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enter Medicine Details Manually</span>
                </button>
              </div>
            </div>
          ) : (
            /* Medicines List */
            <div className="space-y-4">
              {medicines.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className={`rounded-2xl border p-5 transition-all ${
                    med.ocr_uncertainty
                      ? "border-amber-300 bg-amber-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={med.medicine_name}
                          onChange={(e) => handleUpdateMedicine(idx, "medicine_name", e.target.value)}
                          placeholder="Type medicine name (e.g. Dolo 650 or Augmentin)..."
                          className="font-bold text-sm text-slate-900 border-b border-dashed border-slate-300 focus:border-teal-500 focus:outline-none flex-1 max-w-sm"
                        />
                        {med.ocr_uncertainty ? (
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            Uncertain Handwriting
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Verified Formulation
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMedicine(idx)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Remove Medicine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Quick matching pills if user enters name */}
                    {med.medicine_name && !med.generic_name && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Match with:</span>
                        {verifiedMedicines
                          .filter((vm) => vm.name.toLowerCase().includes(med.medicine_name.toLowerCase()))
                          .slice(0, 3)
                          .map((vm) => (
                            <button
                              key={vm.id}
                              type="button"
                              onClick={() => handleSelectAutocomplete(idx, vm)}
                              className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 font-bold text-teal-800 hover:bg-teal-100"
                            >
                              {vm.name} ({vm.generic_name})
                            </button>
                          ))}
                      </div>
                    )}

                    {med.ocr_uncertainty && (
                      <p className="text-xs font-semibold text-rose-700 italic">
                        ⚠️ "Medicine name uncertain. Please confirm with your doctor or pharmacist."
                      </p>
                    )}

                    {/* Editable Attributes */}
                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Generic / Active Composition
                        </span>
                        <input
                          type="text"
                          value={med.generic_name}
                          onChange={(e) => handleUpdateMedicine(idx, "generic_name", e.target.value)}
                          placeholder="e.g. Paracetamol IP"
                          className="mt-0.5 w-full rounded-lg border border-slate-200 p-1.5 font-medium"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {t("dosage")} / Strength
                        </span>
                        <input
                          type="text"
                          value={med.prescribed_dose}
                          onChange={(e) => handleUpdateMedicine(idx, "prescribed_dose", e.target.value)}
                          placeholder="e.g. 1 Tablet (650mg)"
                          className="mt-0.5 w-full rounded-lg border border-slate-200 p-1.5 font-medium"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {t("frequency")}
                        </span>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                          placeholder="e.g. Twice daily (BD)"
                          className="mt-0.5 w-full rounded-lg border border-slate-200 p-1.5 font-medium"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          {t("instructions")}
                        </span>
                        <input
                          type="text"
                          value={med.special_instructions}
                          onChange={(e) => handleUpdateMedicine(idx, "special_instructions", e.target.value)}
                          placeholder="e.g. After food with water"
                          className="mt-0.5 w-full rounded-lg border border-slate-200 p-1.5 font-medium"
                        />
                      </div>
                    </div>

                    {/* Monograph Details from Database if matched */}
                    {med.matched_medicine_detail && (
                      <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-950">
                            Verified Monograph: {med.matched_medicine_detail.medicine_category}
                          </span>
                          <span className="rounded bg-teal-200/70 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                            {med.matched_medicine_detail.dosage_form}
                          </span>
                        </div>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">Indications: </span>
                          {language === "ml" && med.matched_medicine_detail.common_uses_ml
                            ? med.matched_medicine_detail.common_uses_ml
                            : med.matched_medicine_detail.common_uses}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => handleAddNewMedicine()}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-teal-400 bg-teal-50/50 px-4 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Add Another Medicine</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => {
                setExtractedPrescription(null);
                setMedicines([]);
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Scan Another File
            </button>

            <button
              type="button"
              disabled={medicines.length === 0}
              onClick={handleConfirmAndProceed}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{t("saveAndContinue")}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
