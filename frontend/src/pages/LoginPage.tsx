import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Lock, Mail, ArrowRight, UserCheck, Stethoscope, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAutoFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "PROFESSIONAL") {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Invalid email or password. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-500/20">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            Sign in to MediSense AI
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Secure clinical prescription understanding & health intelligence
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* 1-Click Demo & Testing Credentials for All 3 Roles */}
        <div className="rounded-2xl border border-teal-200/90 bg-teal-50/60 p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-teal-600" />
              Demo & Testing Accounts (Click to Auto-Fill):
            </span>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-100/70 px-2 py-0.5 rounded-full">
              3 Roles
            </span>
          </div>

          <div className="grid gap-2">
            {/* 1. Patient User */}
            <button
              type="button"
              onClick={() => handleAutoFill("patient@medisense.ai", "Patient@123456")}
              className={`w-full text-left rounded-xl border p-2.5 transition-all hover:shadow-xs group ${
                email === "patient@medisense.ai"
                  ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                  : "border-slate-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Patient User
                  </span>
                  <span className="font-bold text-xs text-slate-800">patient@medisense.ai</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 group-hover:underline">
                  Auto-Fill
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Pass: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Patient@123456</code></span>
                <span className="text-slate-400">Scans, Reminders, AI Chat</span>
              </div>
            </button>

            {/* 2. Medical Professional */}
            <button
              type="button"
              onClick={() => handleAutoFill("doctor@medisense.ai", "Doctor@123456")}
              className={`w-full text-left rounded-xl border p-2.5 transition-all hover:shadow-xs group ${
                email === "doctor@medisense.ai"
                  ? "border-sky-500 bg-sky-50/70 ring-1 ring-sky-500"
                  : "border-slate-200 bg-white hover:border-sky-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" /> Doctor User
                  </span>
                  <span className="font-bold text-xs text-slate-800">doctor@medisense.ai</span>
                </div>
                <span className="text-[11px] font-bold text-sky-700 group-hover:underline">
                  Auto-Fill
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Pass: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Doctor@123456</code></span>
                <span className="text-slate-400">Review Portal, Prescriptions</span>
              </div>
            </button>

            {/* 3. Platform Administrator */}
            <button
              type="button"
              onClick={() => handleAutoFill("admin@medisense.ai", "Admin@123456")}
              className={`w-full text-left rounded-xl border p-2.5 transition-all hover:shadow-xs group ${
                email === "admin@medisense.ai"
                  ? "border-purple-500 bg-purple-50/70 ring-1 ring-purple-500"
                  : "border-slate-200 bg-white hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Admin User
                  </span>
                  <span className="font-bold text-xs text-slate-800">admin@medisense.ai</span>
                </div>
                <span className="text-[11px] font-bold text-purple-700 group-hover:underline">
                  Auto-Fill
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Pass: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Admin@123456</code></span>
                <span className="text-slate-400">Governance, Drug DB, Logs</span>
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-teal-600 hover:text-teal-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

