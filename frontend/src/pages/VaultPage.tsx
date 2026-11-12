import React, { useEffect, useState } from "react";
import {
  FolderLock,
  Upload,
  FileText,
  Trash2,
  Share2,
  Download,
  Filter,
  Lock,
  Plus,
  X,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { MedicalDocument } from "../types";

export const VaultPage: React.FC = () => {
  const { t } = useLanguage();

  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Form states
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<MedicalDocument["category"]>("PRESCRIPTION");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDesc, setDocDesc] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("doctor@medisense.ai");
  const [shareSuccess, setShareSuccess] = useState(false);

  const fetchDocuments = async () => {
    try {
      const url = selectedCategory === "ALL" ? "/documents/" : `/documents/?category=${selectedCategory}`;
      const res = await apiClient.get(url);
      setDocuments(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;

    try {
      const formData = new FormData();
      formData.append("title", docTitle || docFile.name);
      formData.append("category", docCategory);
      formData.append("document_file", docFile);
      formData.append("description", docDesc);

      await apiClient.post("/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowUploadModal(false);
      setDocTitle("");
      setDocFile(null);
      fetchDocuments();
    } catch (err) {
      console.error("Document upload failed:", err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Permanently delete this medical document from your private vault?")) return;
    try {
      await apiClient.delete(`/documents/${id}/`);
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleShareRecord = async () => {
    try {
      // Find doctor user by email
      const usersRes = await apiClient.get("/admin/users/");
      const users = usersRes.data.results || usersRes.data;
      const doctor = users.find((u: any) => u.email === doctorEmail || u.role === "PROFESSIONAL");

      if (doctor) {
        await apiClient.post("/documents/share/", {
          professional_id: doctor.id,
          document_id: selectedDocId,
        });
        setShareSuccess(true);
        setTimeout(() => {
          setShareSuccess(false);
          setShowShareModal(false);
        }, 1500);
      } else {
        alert("Medical professional not found.");
      }
    } catch (err) {
      console.error("Failed to share record:", err);
    }
  };

  const categories = [
    { id: "ALL", label: "All Documents" },
    { id: "PRESCRIPTION", label: "Prescriptions" },
    { id: "LAB_REPORT", label: "Lab Test Reports" },
    { id: "DISCHARGE_SUMMARY", label: "Discharge Summaries" },
    { id: "IMAGING", label: "Scans / Imaging" },
    { id: "OTHER", label: "Other Records" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Lock className="h-3.5 w-3.5 text-teal-600" />
            <span>End-to-End Private Storage (DPDP Act)</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {t("medicalVault")}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Encrypted personal vault for previous prescriptions, diagnostic lab reports, and medical records.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`rounded-xl px-3.5 py-2 font-semibold transition-all ${
              selectedCategory === c.id
                ? "bg-teal-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500">
            Loading private documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400">
            <FolderLock className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No Documents in this Category</p>
            <p className="text-xs text-slate-500 mt-1">Upload prescriptions or lab reports to organize your medical history.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                    {doc.category}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{doc.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {doc.description || "Uploaded medical record document"}
                </p>
                <div className="mt-2 text-[11px] text-slate-400">
                  Date: {doc.created_at.slice(0, 10)} • {(doc.file_size_bytes / 1024).toFixed(1)} KB
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setShowShareModal(true);
                    }}
                    className="flex items-center gap-1 rounded-lg p-1.5 text-xs text-teal-700 hover:bg-teal-50"
                    title="Share with Doctor"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </button>

                  <a
                    href={doc.document_file}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-1.5 text-xs text-slate-600 hover:bg-slate-100"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>

                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Upload to Private Vault</h3>
              <button onClick={() => setShowUploadModal(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Blood Test Lipid Profile"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                >
                  <option value="PRESCRIPTION">Prescription</option>
                  <option value="LAB_REPORT">Lab Test Report</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="IMAGING">Scans / Imaging</option>
                  <option value="OTHER">Other Health Record</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Select File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Clinical Notes / Description</label>
                <textarea
                  rows={2}
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  placeholder="e.g. Annual health checkup report"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-teal-600 py-2.5 font-bold text-white shadow-sm hover:bg-teal-700"
              >
                Save to Private Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share with Medical Professional Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Share Record with Physician</h3>
              <button onClick={() => setShowShareModal(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {shareSuccess ? (
              <div className="py-6 text-center text-xs font-bold text-emerald-700">
                <CheckCircle className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
                Access granted! The medical professional can now review this record.
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Medical records are strictly private under the DPDP Act. Sharing requires your explicit consent.
                </p>

                <div>
                  <label className="block font-semibold text-slate-700">Select Verified Doctor</label>
                  <select
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
                  >
                    <option value="doctor@medisense.ai">Dr. Thomas Mathew (MD General Medicine - KMC #49281)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleShareRecord}
                  className="w-full rounded-xl bg-teal-600 py-2.5 font-bold text-white shadow-sm hover:bg-teal-700"
                >
                  Grant Explicit Access to Doctor
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

