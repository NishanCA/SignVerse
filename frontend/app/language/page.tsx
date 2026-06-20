"use client";

import { motion } from "framer-motion";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
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
    <main className="min-h-screen p-6 flex flex-col items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[10%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-md flex items-center mb-12 mt-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pr-10">
          <h2 className="text-xl font-semibold">{t("language.select")}</h2>
        </div>
      </header>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col gap-4"
      >
        <p className="text-slate-400 mb-4 px-2">
          {t("language.desc")}
        </p>

        {LANGUAGES.map((lang) => (
          <motion.button
            key={lang.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUiLanguage(lang.id)}
            className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
              uiLanguage === lang.id 
                ? "bg-slate-800 border-2 border-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                : "glass border-2 border-transparent hover:border-white/10"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{lang.flag}</span>
              <span className="text-xl font-medium">{lang.name}</span>
            </div>
            {uiLanguage === lang.id && (
              <CheckCircle2 className="text-purple-500" size={24} />
            )}
          </motion.button>
        ))}

        <div className="mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Proceed to next step in onboarding, likely login or home depending on state
              router.push("/login");
            }}
            className="w-full py-4 px-6 rounded-xl bg-gradient-primary text-white font-semibold text-lg shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 disabled:opacity-50"
          >
            {t("language.next")}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
