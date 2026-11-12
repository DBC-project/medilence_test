import React from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Camera,
  Pill,
  BotMessageSquare,
  AlertOctagon,
  Clock,
  FolderLock,
  FileText,
  Stethoscope,
  ShieldAlert,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { to: "/dashboard", label: t("overview"), icon: Activity },
    { to: "/scan", label: t("scanPrescription"), icon: Camera, highlight: true },
    { to: "/medicines", label: t("myMedicines"), icon: Pill },
    { to: "/assistant", label: t("aiAssistant"), icon: BotMessageSquare },
    { to: "/interactions", label: t("interactionChecker"), icon: AlertOctagon },
    { to: "/reminders", label: t("reminders"), icon: Clock },
    { to: "/vault", label: t("medicalVault"), icon: FolderLock },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between lg:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Menu
              </span>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Nav Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-teal-50 text-teal-800 shadow-sm shadow-teal-500/10 font-bold border border-teal-200/50"
                        : item.highlight
                        ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-800 hover:bg-teal-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <item.icon
                    className={`h-4 w-4 ${
                      item.highlight ? "text-teal-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Professional & Admin Section */}
            {(user?.role === "PROFESSIONAL" || user?.role === "ADMIN") && (
              <div className="pt-4">
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Clinical Portals
                </div>
                <div className="space-y-1">
                  {(user.role === "PROFESSIONAL" || user.role === "ADMIN") && (
                    <NavLink
                      to="/portal"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/60"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                      <span>{t("doctorPortal")}</span>
                    </NavLink>
                  )}

                  {user.role === "ADMIN" && (
                    <NavLink
                      to="/admin"
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-purple-50 text-purple-700 font-bold border border-purple-200/60"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      <ShieldAlert className="h-4 w-4 text-purple-600" />
                      <span>{t("adminDashboard")}</span>
                    </NavLink>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Educational Disclaimer Footer In Sidebar */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900">
            <span className="font-semibold block mb-0.5">⚕️ Medical Notice:</span>
            MediSense AI is for educational reference. Never stop, start or modify medications without consulting your prescribing doctor.
          </div>
        </div>
      </aside>
    </>
  );
};

