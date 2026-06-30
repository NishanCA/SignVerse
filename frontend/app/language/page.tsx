"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageKey } from "../../translations";

const LANGUAGES: { id: LanguageKey; name: string; flag: string }[] = [
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "hi", name: "Hindi", flag: "🇮🇳" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "ja", name: "Japanese", flag: "🇯🇵" },
  { id: "zh", name: "Chinese", flag: "🇨🇳" },
  { id: "ar", name: "Arabic", flag: "🇦🇪" },
  { id: "pt", name: "Portuguese", flag: "🇵🇹" },
  { id: "ru", name: "Russian", flag: "🇷🇺" },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { uiLanguage, setUiLanguage, t } = useLanguage();

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center relative px-6">
      <header className="w-full max-w-md flex items-center justify-between pt-6 pb-8 z-10">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col gap-2"
      >
        <div className="mb-6">
          <h2 className="heading-lg text-[var(--text-primary)] mb-2">{t("language.select") || "Language"}</h2>
          <p className="body-sm text-[var(--text-secondary)]">
            {t("language.desc") || "Select your preferred language for the interface."}
          </p>
        </div>

        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm">
          {LANGUAGES.map((lang, index) => {
            const isSelected = uiLanguage === lang.id;
            return (
              <motion.button
                key={lang.id}
                whileTap={{ backgroundColor: "var(--bg-secondary)" }}
                onClick={() => setUiLanguage(lang.id)}
                className={`w-full flex items-center justify-between p-4 outline-none focus-visible:bg-[var(--bg-secondary)] transition-colors ${
                  index !== LANGUAGES.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`text-base font-medium ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <Check className="text-[var(--accent-blue)]" size={20} strokeWidth={3} />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 pb-12">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/login")}
            className="w-full py-3.5 px-4 rounded-xl surface-elevated border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-base shadow-sm transition-shadow hover:shadow-md focus-ring"
          >
            {t("language.next") || "Continue"}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
