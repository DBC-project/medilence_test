import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, LogOut, Menu, Shield, Stethoscope, User, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { AIConfigModal } from "./AIConfigModal";

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Sidebar toggle */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              title="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-md shadow-teal-500/20">
              <Activity className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Medi<span className="text-teal-600">Sense</span> AI
              </span>
              <span className="hidden text-[10px] font-medium tracking-wide text-teal-700 sm:block">
                Clinical Prescription Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Free AI Engine Configuration Button */}
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm hover:bg-teal-100 transition-colors"
            title="Configure Real Free AI Engine"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span className="hidden sm:inline">Free AI Engine</span>
          </button>

          {/* Dual-Language Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              onClick={() => setLanguage("en")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                language === "en"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage("ml")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                language === "ml"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              മലയാളം
            </button>
          </div>

          {isAuthenticated ? (
            <div className="relative flex items-center gap-3">
              <div className="hidden text-right md:block">
                <div className="text-sm font-semibold text-slate-800">{user?.full_name}</div>
                <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-slate-500">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      user?.role === "ADMIN"
                        ? "bg-purple-500"
                        : user?.role === "PROFESSIONAL"
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  {user?.role}
                </div>
              </div>

              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-800 hover:ring-2 hover:ring-teal-400"
              >
                <User className="h-4 w-4" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2 text-xs">
                    <p className="font-semibold text-slate-800">{user?.full_name}</p>
                    <p className="truncate text-slate-500">{user?.email}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Activity className="h-4 w-4 text-teal-600" />
                    {t("overview")}
                  </Link>

                  {user?.role === "PROFESSIONAL" && (
                    <Link
                      to="/portal"
                      onClick={() => setShowUserMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      {t("doctorPortal")}
                    </Link>
                  )}

                  {user?.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Shield className="h-4 w-4 text-purple-600" />
                      {t("adminDashboard")}
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-teal-700"
              >
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      </div>
      <AIConfigModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
    </header>
  );
};

