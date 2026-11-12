import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Lock, Mail, User, Phone, ArrowRight, Stethoscope } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<"PATIENT" | "PROFESSIONAL">("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        role,
        language_preference: "en",
      };

      const user = await register(payload);
      if (user.role === "PROFESSIONAL") {
        navigate("/portal");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        "Registration could not be completed. Please check your information."
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
            Create your MediSense AI Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Select your account type to get started
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              role === "PATIENT"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Patient User</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("PROFESSIONAL")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              role === "PROFESSIONAL"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Medical Professional</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Rahul"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98471 23456"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {role === "PROFESSIONAL" && (
            <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <div>
                <label className="block text-xs font-semibold text-blue-900">
                  Medical License / Registration Number
                </label>
                <input
                  type="text"
                  required={role === "PROFESSIONAL"}
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. KMC-49281"
                  className="mt-1 w-full rounded-lg border border-blue-200 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-900">
                  Clinical Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="General Medicine / Cardiology"
                  className="mt-1 w-full rounded-lg border border-blue-200 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 leading-relaxed">
            By creating an account, you agree to MediSense AI's Clinical Terms of Use and DPDP Privacy Protocol.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
          >
            <span>{loading ? "Registering..." : "Complete Registration"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

