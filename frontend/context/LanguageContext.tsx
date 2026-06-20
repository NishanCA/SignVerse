"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, LanguageKey } from "../translations";

interface LanguageContextType {
  uiLanguage: LanguageKey;
  setUiLanguage: (lang: LanguageKey) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [uiLanguage, setUiLanguageState] = useState<LanguageKey>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage on mount
    const savedLang = localStorage.getItem("uiLanguage") as LanguageKey;
    if (savedLang && translations[savedLang]) {
      setUiLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setUiLanguage = (lang: LanguageKey) => {
    setUiLanguageState(lang);
    localStorage.setItem("uiLanguage", lang);
  };

  const t = (key: string): string => {
    return translations[uiLanguage]?.[key] || translations["en"]?.[key] || key;
  };

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <LanguageContext.Provider value={{ uiLanguage, setUiLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
