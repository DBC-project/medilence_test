import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ml";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Navigation
    brandName: "MediSense AI",
    tagline: "AI-Powered Prescription & Medicine Intelligence",
    overview: "Overview",
    scanPrescription: "Scan Prescription",
    myMedicines: "My Medicines",
    aiAssistant: "AI Assistant",
    interactionChecker: "Interaction Checker",
    reminders: "Reminders",
    medicalVault: "Document Vault",
    reports: "Reports",
    adminDashboard: "Admin Portal",
    doctorPortal: "Doctor Review Portal",
    logout: "Log Out",
    login: "Sign In",
    register: "Create Account",

    // Common Buttons & Labels
    uploadButton: "Upload Prescription",
    takePhoto: "Capture Camera Photo",
    analyzingText: "Analyzing Prescription OCR & Verifying...",
    confirmDetails: "Confirm Prescription Details",
    generateReport: "Generate Educational Report",
    downloadPdf: "Download Official PDF",
    printReport: "Print Summary",
    searchPlaceholder: "Search medicines, generic names, or active ingredients...",
    emergencyAlert: "Emergency Warning",
    emergencyNotice: "If you are experiencing acute chest pain, breathing difficulty, or severe bleeding, call emergency services (112 / 108) immediately.",
    disclaimerBadge: "AI-generated educational information. Does not replace a doctor or pharmacist.",

    // Dashboard
    welcomeBack: "Welcome back",
    healthSummary: "Here is your prescription and medication safety summary.",
    quickScanPrompt: "Upload a new doctor prescription for instant OCR reading and verification.",
    activeRemindersCount: "Active Reminders Today",
    prescriptionsAnalyzed: "Prescriptions Analyzed",
    potentialInteractions: "Interaction Alerts",
    takeNow: "Mark Taken",
    skipDose: "Skip",
    recentPrescriptions: "Recent Prescriptions",
    noPrescriptionsYet: "No prescriptions uploaded yet. Click below to scan your first prescription.",

    // Prescription Scanner
    scannerTitle: "AI Prescription Scanner",
    scannerSubtitle: "Photograph or upload a prescription in JPG, PNG, or PDF format. Our clinical OCR and AI pipeline will extract medicines and verify dosages.",
    dropzoneTitle: "Drag & drop prescription file here, or click to browse",
    supportedFormats: "Supports JPG, JPEG, PNG, and PDF (Max 15MB)",
    extractedMedicines: "Extracted Medicines & Prescribed Regimen",
    uncertaintyWarningTitle: "Handwriting Uncertainty Detected",
    uncertaintyWarningBody: "One or more medicine names or dosage instructions were unclear from the prescription handwriting. Please verify with your doctor or pharmacist.",
    userConfirmationPrompt: "Please verify each medicine before generating your final educational report:",
    medicineName: "Medicine Name",
    dosage: "Dosage",
    frequency: "Frequency",
    duration: "Duration",
    instructions: "Instructions",
    saveAndContinue: "Confirm & Generate Intelligence Report",

    // Assistant
    chatHeader: "MediSense AI Clinical Information Assistant",
    chatSubtitle: "Ask anything about medicine indications, dosages, side effects, or drug combinations.",
    askPlaceholder: "Ask about your medicines or enter Malayalam/English questions...",
    send: "Send",
    emergencyWarningTitle: "IMMEDIATE EMERGENCY WARNING",
    citationsLabel: "Verified Supporting Sources:",

    // Interactions
    interactionTitle: "Drug-Drug Interaction & Duplicate Ingredient Checker",
    interactionSubtitle: "Check multiple prescribed medicines simultaneously to identify dangerous combinations and duplicate active ingredients.",
    addMedicineBtn: "Add to Checker",
    checkNowBtn: "Check Selected Medicines",
    duplicatesFound: "Duplicate Active Ingredients Found!",
    seriousInteraction: "Potentially Serious Interaction Flagged",
    attentionRequired: "Interaction Requiring Medical Attention",
    noInteraction: "No Known Adverse Interactions Found in Database",
  },
  ml: {
    // Brand & Navigation
    brandName: "മെഡിസെൻസ് AI",
    tagline: "AI അധിഷ്ഠിത പ്രിസ്ക്രിപ്ഷൻ & മരുന്ന് വിവര പ്ലാറ്റ്‌ഫോം",
    overview: "ഡാഷ്‌ബോർഡ്",
    scanPrescription: "പ്രിസ്ക്രിപ്ഷൻ സ്കാൻ ചെയ്യുക",
    myMedicines: "എന്റെ മരുന്നുകൾ",
    aiAssistant: "AI അസിസ്റ്റന്റ്",
    interactionChecker: "മരുന്ന് പ്രതിപ്രവർത്തനങ്ങൾ",
    reminders: "മരുന്ന് ഓർമ്മപ്പെടുത്തലുകൾ",
    medicalVault: "മെഡിക്കൽ രേഖകൾ",
    reports: "റിപ്പോർട്ടുകൾ",
    adminDashboard: "അഡ്മിൻ പോർട്ടൽ",
    doctorPortal: "ഡോക്ടർ റിവ്യൂ പോർട്ടൽ",
    logout: "ലോഗ് ഔട്ട്",
    login: "പ്രവേശിക്കുക",
    register: "രജിസ്റ്റർ ചെയ്യുക",

    // Common Buttons & Labels
    uploadButton: "പ്രിസ്ക്രിപ്ഷൻ അപ്‌ലോഡ് ചെയ്യുക",
    takePhoto: "ക്യാമറ ഫോട്ടോ എടുക്കുക",
    analyzingText: "കുറിപ്പടി വായിച്ച് വിവരങ്ങൾ ശേഖരിക്കുന്നു...",
    confirmDetails: "വിവരങ്ങൾ ശരിയാണോ എന്ന് പരിശോധിക്കുക",
    generateReport: "വിദ്യാഭ്യാസ റിപ്പോർട്ട് തയ്യാറാക്കുക",
    downloadPdf: "PDF റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക",
    printReport: "പ്രിന്റ് ചെയ്യുക",
    searchPlaceholder: "മരുന്നിന്റെ പേരോ ചേരുവയോ തിരയുക...",
    emergencyAlert: "അടിയന്തര മുന്നറിയിപ്പ്",
    emergencyNotice: "കഠിനമായ നെഞ്ചുവേദന, ശ്വാസതടസ്സം, അല്ലെങ്കിൽ രക്തസ്രാവം ഉണ്ടെങ്കിൽ ഉടൻ 112 / 108 എന്ന നമ്പറിൽ ബന്ധപ്പെടുക.",
    disclaimerBadge: "AI അടിസ്ഥാനമാക്കിയുള്ള വിദ്യാഭ്യാസ വിവരങ്ങൾ. ഡോക്ടറുടെ ഉപദേശത്തിന് പകരമാവില്ല.",

    // Dashboard
    welcomeBack: "സ്വാഗതം",
    healthSummary: "നിങ്ങളുടെ പ്രിസ്ക്രിപ്ഷനുകളുടെയും മരുന്നുകളുടെയും വിവരങ്ങൾ താഴെ കാണാം.",
    quickScanPrompt: "ഡോക്ടറുടെ പുതിയ കുറിപ്പടി എളുപ്പത്തിൽ വായിക്കാൻ ഇവിടെ അപ്‌ലോഡ് ചെയ്യുക.",
    activeRemindersCount: "ഇന്നത്തെ മരുന്ന് ഓർമ്മപ്പെടുത്തലുകൾ",
    prescriptionsAnalyzed: "പരിശോധിച്ച കുറിപ്പടികൾ",
    potentialInteractions: "മരുന്ന് പ്രതിപ്രവർത്തന മുന്നറിയിപ്പുകൾ",
    takeNow: "കഴിച്ചു",
    skipDose: "ഒഴിവാക്കുക",
    recentPrescriptions: "സമീപകാല കുറിപ്പടികൾ",
    noPrescriptionsYet: "കുറിപ്പടികൾ ഒന്നും ചേർത്തിട്ടില്ല. ആദ്യ കുറിപ്പടി സ്കാൻ ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക.",

    // Prescription Scanner
    scannerTitle: "AI പ്രിസ്ക്രിപ്ഷൻ സ്കാനർ",
    scannerSubtitle: "ഡോക്ടറുടെ കുറിപ്പടിയുടെ ഫോട്ടോയോ PDF ഫയലോ അപ്‌ലോഡ് ചെയ്യുക. ഞങ്ങളുടെ AI മരുന്നുകളുടെ പേരുകളും അളവുകളും കൃത്യമായി വായിച്ചെടുക്കും.",
    dropzoneTitle: "ഫയൽ ഇവിടെ ഇടുക, അല്ലെങ്കിൽ തിരഞ്ഞെടുക്കുക",
    supportedFormats: "JPG, PNG, PDF ഫയലുകൾ (പരമാവധി 15MB)",
    extractedMedicines: "കണ്ടെത്തിയ മരുന്നുകളും കഴിക്കേണ്ട വിധവും",
    uncertaintyWarningTitle: "കൈയ്യക്ഷരത്തിൽ അവ്യക്തത കണ്ടെത്തി",
    uncertaintyWarningBody: "കുറിപ്പടിയിലെ ചില മരുന്നുകളുടെ പേരോ അളവോ വ്യക്തമല്ല. ദയവായി ഡോക്ടറോടോ ഫാർമസിസ്റ്റിനോടോ ചോദിച്ച് ഉറപ്പുവരുത്തുക.",
    userConfirmationPrompt: "റിപ്പോർട്ട് തയ്യാറാക്കുന്നതിന് മുൻപ് വിവരങ്ങൾ ഉറപ്പുവരുത്തുക:",
    medicineName: "മരുന്നിന്റെ പേര്",
    dosage: "അളവ്",
    frequency: "തവണ",
    duration: "ദിവസങ്ങൾ",
    instructions: "നിർദ്ദേശങ്ങൾ",
    saveAndContinue: "ഉറപ്പുവരുത്തി റിപ്പോർട്ട് ഉണ്ടാക്കുക",

    // Assistant
    chatHeader: "മെഡിസെൻസ് AI മെഡിക്കൽ അസിസ്റ്റന്റ്",
    chatSubtitle: "മരുന്നുകളുടെ ഉപയോഗം, പാർശ്വഫലങ്ങൾ, കഴിക്കേണ്ട രീതി എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.",
    askPlaceholder: "മരുന്നുകളെക്കുറിച്ചുള്ള സംശയങ്ങൾ ചോദിക്കുക...",
    send: "അയക്കുക",
    emergencyWarningTitle: "അടിയന്തര മെഡിക്കൽ മുന്നറിയിപ്പ്",
    citationsLabel: "ഔദ്യോഗിക റഫറൻസുകൾ:",

    // Interactions
    interactionTitle: "മരുന്ന് പ്രതിപ്രവർത്തന & ചേരുവ പരിശോധന",
    interactionSubtitle: "ഒന്നിലധികം മരുന്നുകൾ ഒന്നിച്ച് കഴിക്കുമ്പോൾ ഉണ്ടാകുന്ന ദോഷങ്ങളും ഒരേ ചേരുവ ആവർത്തിക്കുന്നതും പരിശോധിക്കുക.",
    addMedicineBtn: "മരുന്ന് ചേർക്കുക",
    checkNowBtn: "പരിശോധിക്കുക",
    duplicatesFound: "ഒരേ ചേരുവ ആവർത്തിക്കുന്നു!",
    seriousInteraction: "ഗുരുതരമായ പ്രതിപ്രവർത്തന മുന്നറിയിപ്പ്",
    attentionRequired: "ശ്രദ്ധിക്കേണ്ട പ്രതിപ്രവർത്തനം",
    noInteraction: "അറിയപ്പെടുന്ന പ്രതിപ്രവർത്തനങ്ങൾ ഒന്നും കണ്ടെത്തിയിട്ടില്ല",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("medisense_lang") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("medisense_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

