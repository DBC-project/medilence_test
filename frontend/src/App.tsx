import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { DashboardLayout } from "./components/DashboardLayout";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ScanPage } from "./pages/ScanPage";
import { PrescriptionDetailPage } from "./pages/PrescriptionDetailPage";
import { MedicinesPage } from "./pages/MedicinesPage";
import { InteractionCheckerPage } from "./pages/InteractionCheckerPage";
import { AssistantPage } from "./pages/AssistantPage";
import { RemindersPage } from "./pages/RemindersPage";
import { VaultPage } from "./pages/VaultPage";
import { ProfessionalPortalPage } from "./pages/ProfessionalPortalPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-xs text-slate-500">Loading MediSense AI...</div>;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/prescriptions/:id" element={<PrescriptionDetailPage />} />
                <Route path="/medicines" element={<MedicinesPage />} />
                <Route path="/interactions" element={<InteractionCheckerPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/reminders" element={<RemindersPage />} />
                <Route path="/vault" element={<VaultPage />} />
                <Route path="/portal" element={<ProfessionalPortalPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
