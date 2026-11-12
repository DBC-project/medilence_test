import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BotMessageSquare,
  Send,
  Sparkles,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { apiClient } from "../api/client";
import { Prescription, AIMessage } from "../types";

export const AssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t, language, setLanguage } = useLanguage();

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      message:
        language === "ml"
          ? "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ മെഡിസെൻസ് AI മെഡിക്കൽ അസിസ്റ്റന്റാണ്. നിങ്ങളുടെ കുറിപ്പടിയിലെ മരുന്നുകളുടെ ഉപയോഗം, കഴിക്കേണ്ട രീതി, സാധ്യമായ പാർശ്വഫലങ്ങൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കാം."
          : "Hello! I am your MediSense AI clinical information assistant. You can ask me why specific medicines are prescribed, what abbreviations mean (e.g. BD, OD, SOS), or whether your medications have food-related precautions.",
      citations: ["CDSCO / WHO Essential Medicines / MedlinePlus"],
      is_emergency_flagged: false,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedRxId, setSelectedRxId] = useState<string>(searchParams.get("rx") || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = await apiClient.get("/prescriptions/");
        setPrescriptions(res.data.results || res.data);
      } catch (err) {
        console.error("Failed to fetch prescriptions:", err);
      }
    };
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: AIMessage = {
      id: String(Date.now()),
      sender: "user",
      message: text,
      citations: [],
      is_emergency_flagged: false,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      const res = await apiClient.post("/assistant/chat/", {
        message: text,
        language,
        prescription_id: selectedRxId || null,
      });

      setMessages((prev) => [...prev, res.data.message]);
    } catch (err) {
      console.error("Assistant chat error:", err);
      const errMsg: AIMessage = {
        id: String(Date.now() + 1),
        sender: "assistant",
        message: "I encountered an issue processing your request. Please try again or rephrase your clinical question.",
        citations: [],
        is_emergency_flagged: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    { en: "What is Augmentin 625 prescribed for?", ml: "അമോക്സിസിലിൻ എന്തിനാണ് ഉപയോഗിക്കുന്നത്?" },
    { en: "Can I take Dolo 650 with Pantocid?", ml: "ഡോളോയും പാന്റോസിഡും ഒന്നിച്ച് കഴിക്കാമോ?" },
    { en: "What does '1 tab BD after food' mean?", ml: "BD pc എന്നാൽ എന്താണ് അർത്ഥം?" },
    { en: "Common side effects of Telmisartan", ml: "ടെൽമിസാർട്ടന്റെ പാർശ്വഫലങ്ങൾ എന്തൊക്കെയാണ്?" },
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
            <BotMessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">{t("chatHeader")}</h2>
            <p className="text-[11px] text-slate-500">{t("chatSubtitle")}</p>
          </div>
        </div>

        {/* Prescription Context Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRxId}
            onChange={(e) => setSelectedRxId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">General Clinical Mode (No Rx Attached)</option>
            {prescriptions.map((rx) => (
              <option key={rx.id} value={rx.id}>
                Context: {rx.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "assistant" && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800 flex-shrink-0 mt-1">
                <BotMessageSquare className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-teal-600 text-white"
                  : msg.is_emergency_flagged
                  ? "border-2 border-rose-400 bg-rose-50 text-rose-950 font-medium"
                  : "border border-slate-100 bg-slate-50/80 text-slate-800"
              }`}
            >
              {msg.is_emergency_flagged && (
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{t("emergencyWarningTitle")}</span>
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.message}</div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 border-t border-slate-200/60 pt-2 text-[10px] text-slate-500">
                  <span className="font-semibold">{t("citationsLabel")}</span> {msg.citations.join(" • ")}
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-700 flex-shrink-0 mt-1">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
            <span>Consulting verified medical resources...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2 flex flex-wrap gap-2 text-xs">
        {samplePrompts.map((p, i) => {
          const text = language === "ml" ? p.ml : p.en;
          return (
            <button
              key={i}
              onClick={() => handleSendMessage(text)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              {text}
            </button>
          );
        })}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="border-t border-slate-200 bg-white p-3 sm:p-4 flex gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={t("askPlaceholder")}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="flex items-center justify-center rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

