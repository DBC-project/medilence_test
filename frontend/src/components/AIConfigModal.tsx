import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  X,
  Server,
  Zap,
} from "lucide-react";
import { apiClient } from "../api/client";

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState("gemini");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient.get("/ai/config/").then((res) => {
        setConfig(res.data);
        setProvider(res.data.provider || "gemini");
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiClient.post("/ai/config/", {
        provider,
        gemini_api_key: geminiKey,
        groq_api_key: groqKey,
        openrouter_api_key: openrouterKey,
      });
      setConfig(res.data);
      alert("AI Configuration saved successfully!");
    } catch (err) {
      console.error("Failed to save AI configuration:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const activeKey = provider === "gemini" ? geminiKey : provider === "groq" ? groqKey : openrouterKey;
      const res = await apiClient.post("/ai/test/", {
        provider,
        api_key: activeKey,
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        response: err.response?.data?.error || "Connection test failed.",
        latency_ms: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Real Free AI Engine Configuration</h2>
              <p className="text-xs text-slate-500">Configure free clinical vision & language models</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free AI Provider Guide */}
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-950 space-y-2">
          <div className="font-bold text-teal-900 flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-teal-600" />
            <span>100% Free AI Keys (No Credit Card Required):</span>
          </div>
          <ul className="space-y-1 text-[11px] text-teal-900/90 list-disc pl-4">
            <li>
              <b>Google Gemini Free Tier</b>: Get a free API key at{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-teal-700 hover:text-teal-900"
              >
                Google AI Studio (aistudio.google.com)
              </a>{" "}
              (15 RPM free, native prescription vision OCR).
            </li>
            <li>
              <b>Groq Cloud Free Tier</b>: Ultra-fast Llama 3.3 70B at{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-teal-700 hover:text-teal-900"
              >
                console.groq.com
              </a>{" "}
              (30 RPM free).
            </li>
          </ul>
        </div>

        <form onSubmit={handleSaveConfig} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Select Active AI Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
            >
              <option value="gemini">Google Gemini 1.5/2.0 Flash (Free Tier with Multimodal Vision)</option>
              <option value="groq">Groq Cloud (Free Tier - Llama 3.3 70B Versatile)</option>
              <option value="openrouter">OpenRouter Free Models</option>
              <option value="pollinations">Pollinations Anonymous Gateway (Zero-key fallback)</option>
            </select>
          </div>

          {provider === "gemini" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Google Gemini API Key</label>
                {config?.has_gemini_key && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Active: {config.gemini_key_masked}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          {provider === "groq" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Groq API Key</label>
                {config?.has_groq_key && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Active: {config.groq_key_masked}
                  </span>
                )}
              </div>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          {provider === "openrouter" && (
            <div>
              <label className="block font-semibold text-slate-700">OpenRouter API Key</label>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          {/* Test connection result */}
          {testResult && (
            <div
              className={`rounded-xl border p-3 text-xs leading-relaxed ${
                testResult.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-rose-200 bg-rose-50 text-rose-950"
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>{testResult.success ? "✓ AI Connection Active!" : "✕ Connection Issue"}</span>
                {testResult.latency_ms > 0 && <span>{testResult.latency_ms} ms</span>}
              </div>
              <div>{testResult.response}</div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <span>Test Free AI Connection</span>
              )}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-teal-600 py-2.5 font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save AI Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

