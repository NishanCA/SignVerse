/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Settings2, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Avatar3D from "../../components/Avatar3D";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageKey } from "../../translations";
import { BACKEND_URL } from "../../lib/config";

const SKIN_COLORS = [
  { id: "light", hex: "#ffe0bd", label: "Light" },
  { id: "fair", hex: "#e8beac", label: "Fair" },
  { id: "medium", hex: "#c99e82", label: "Medium" },
  { id: "olive", hex: "#a57652", label: "Olive" },
  { id: "brown", hex: "#7a4b2a", label: "Brown" },
  { id: "dark", hex: "#4a2912", label: "Dark" },
];

const UI_LANGUAGES: { id: LanguageKey; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी" },
  { id: "kn", label: "ಕನ್ನಡ" },
  { id: "es", label: "Español" },
  { id: "fr", label: "Français" },
  { id: "de", label: "Deutsch" },
  { id: "ja", label: "日本語" },
  { id: "zh", label: "中文" },
  { id: "ar", label: "العربية" },
  { id: "pt", label: "Português" },
  { id: "ru", label: "Русский" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t, uiLanguage, setUiLanguage } = useLanguage();
  
  const [localUiLanguage, setLocalUiLanguage] = useState<LanguageKey>(uiLanguage);
  const [voiceType, setVoiceType] = useState("male");
  const [accent, setAccent] = useState("indian");
  const [preferredLang, setPreferredLang] = useState("english");
  const [appTheme, setAppTheme] = useState("dark");
  const [smartSuggestions, setSmartSuggestions] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState("medium");
  const [gestureSensitivity, setGestureSensitivity] = useState(0.75);
  const [avatarTrigger, setAvatarTrigger] = useState(0);
  const [avatarSkinColor, setAvatarSkinColor] = useState("#e8beac");

  useEffect(() => {
    const loadSettings = async () => {
      // Try loading from Firestore first
      const user = auth.currentUser;
      if (user) {
        try {
          const settingsSnap = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            if (data.voiceType) setVoiceType(data.voiceType);
            if (data.accent) setAccent(data.accent);
            if (data.preferredLang) setPreferredLang(data.preferredLang);
            if (data.appTheme) setAppTheme(data.appTheme);
            if (data.smartSuggestions !== undefined) setSmartSuggestions(data.smartSuggestions);
            if (data.speechSpeed) setSpeechSpeed(data.speechSpeed);
            if (data.gestureSensitivity !== undefined) setGestureSensitivity(data.gestureSensitivity);
            if (data.avatarSkinColor) setAvatarSkinColor(data.avatarSkinColor);
            // uiLanguage is loaded by LanguageContext automatically from localStorage,
            // but we could also load it from Firestore here if we saved it.
            return; // Loaded from Firestore, skip localStorage
          }
        } catch (err) {
          console.warn("Failed to load settings from Firestore:", err);
        }
      }

      // Fallback to localStorage
      if (localStorage.getItem("voiceType")) setVoiceType(localStorage.getItem("voiceType")!);
      if (localStorage.getItem("accent")) setAccent(localStorage.getItem("accent")!);
      if (localStorage.getItem("preferredLang")) {
        const lang = localStorage.getItem("preferredLang")!;
        setPreferredLang(lang);
        if (lang === "en") setPreferredLang("english");
        if (lang === "hi") setPreferredLang("hindi");
        if (lang === "kn") setPreferredLang("kannada");
      }
      if (localStorage.getItem("appTheme")) setAppTheme(localStorage.getItem("appTheme")!);
      if (localStorage.getItem("smartSuggestions")) setSmartSuggestions(localStorage.getItem("smartSuggestions") === "true");
      if (localStorage.getItem("speechSpeed")) setSpeechSpeed(localStorage.getItem("speechSpeed")!);
      if (localStorage.getItem("gestureSensitivity")) setGestureSensitivity(parseFloat(localStorage.getItem("gestureSensitivity")!));
      if (localStorage.getItem("avatarSkinColor")) setAvatarSkinColor(localStorage.getItem("avatarSkinColor")!);
    };

    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  const saveSettings = async () => {
    const langMap: Record<string, string> = { english: "en", hindi: "hi", kannada: "kn" };
    const settingsData = {
      voiceType,
      accent,
      preferredLang,
      appTheme,
      smartSuggestions,
      speechSpeed,
      gestureSensitivity,
      avatarSkinColor,
    };

    // Save to localStorage
    setUiLanguage(localUiLanguage);
    localStorage.setItem("voiceType", voiceType);
    localStorage.setItem("accent", accent);
    localStorage.setItem("selectedLanguage", langMap[preferredLang] || "en");
    localStorage.setItem("preferredLang", preferredLang);
    localStorage.setItem("appTheme", appTheme);
    localStorage.setItem("smartSuggestions", smartSuggestions.toString());
    localStorage.setItem("speechSpeed", speechSpeed);
    localStorage.setItem("gestureSensitivity", gestureSensitivity.toString());
    localStorage.setItem("avatarSkinColor", avatarSkinColor);

    // Save to Firestore if logged in
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "settings", "preferences"), settingsData);
        // Mark settings as complete
        await setDoc(doc(db, "users", user.uid), { settingsComplete: true }, { merge: true });
      } catch (err) {
        console.warn("Failed to save settings to Firestore:", err);
      }
    }

    router.push("/home");
  };

  const playAccentPreview = async (selectedAccent: string) => {
    setAccent(selectedAccent);
    
    const langMap: Record<string, string> = { english: "en", hindi: "hi", kannada: "kn" };
    const targetCode = langMap[preferredLang] || "en";
    
    let textToSpeak = "Hello, this is how I will sound.";
    
    if (targetCode !== "en") {
      try {
        const res = await fetch(`${BACKEND_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToSpeak, target_language: targetCode }),
        });
        const data = await res.json();
        if (data.translated_text) textToSpeak = data.translated_text;
      } catch {
        console.warn("Translate failed, using English fallback");
      }
    }
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(textToSpeak);
      
      if (selectedAccent === "indian") utt.lang = targetCode === "en" ? "en-IN" : (targetCode === "hi" ? "hi-IN" : "kn-IN");
      else if (selectedAccent === "american") utt.lang = "en-US";
      else if (selectedAccent === "british") utt.lang = "en-GB";
      
      utt.pitch = voiceType === "female" ? 1.2 : 0.8;
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <main className="min-h-screen p-6 relative overflow-x-hidden pb-24">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[100px]" />
      </div>

      <header className="flex items-center mb-8 mt-2">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold ml-2">{t("settings.title")}</h1>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-lg mx-auto"
      >
        {/* UI Language Settings */}
        <section className="glass-card p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-400">
            <Globe size={20} />
            {t("language.select")}
          </h2>
          
          <div>
            <label className="text-sm text-slate-400 block mb-3">{t("language.desc")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {UI_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLocalUiLanguage(lang.id);
                    setUiLanguage(lang.id);
                  }}
                  className={`py-2 rounded-lg font-medium text-sm transition-all ${
                    localUiLanguage === lang.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Voice Settings */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 className="text-purple-400" size={20} />
            {t("settings.voice")}
          </h2>
          
          <div className="mb-6">
            <label className="text-sm text-slate-400 block mb-3">{t("settings.voiceType")}</label>
            <div className="grid grid-cols-2 gap-3">
              {['male', 'female'].map((type) => (
                <button
                  key={type}
                  onClick={() => setVoiceType(type)}
                  className={`py-3 rounded-lg font-medium capitalize transition-all ${
                    voiceType === type 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {t(`settings.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-3">{t("settings.accent")}</label>
            <div className="grid grid-cols-3 gap-2">
              {['indian', 'american', 'british'].map((acc) => (
                <button
                  key={acc}
                  onClick={() => playAccentPreview(acc)}
                  className={`py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                    accent === acc 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {t(`settings.${acc}`)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Translation Preferences */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-emerald-400">{t("settings.translation")}</h2>
          
          <div className="mb-6">
            <label className="text-sm text-slate-400 block mb-3">{t("settings.prefLang")}</label>
            <div className="grid grid-cols-3 gap-2">
              {['english', 'hindi', 'kannada'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setPreferredLang(lang)}
                  className={`py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                    preferredLang === lang 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {t(`settings.${lang}`)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">{t("settings.speechDesc")}</p>
          </div>
        </section>

        {/* Accessibility & Visuals */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-orange-400">{t("settings.access")}</h2>
          
          <div>
            <label className="text-sm text-slate-400 block mb-3">{t("settings.theme")}</label>
            <div className="grid grid-cols-3 gap-3">
              {['colorful', 'dark', 'light'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setAppTheme(theme)}
                  className={`py-3 rounded-lg font-medium capitalize transition-all ${
                    appTheme === theme 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {theme === 'colorful' ? 'Colorful' : (t(`settings.${theme}`) || theme)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">{t("settings.themeDesc")}</p>
          </div>
        </section>

        {/* Smart Features */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">{t("settings.smart")}</h2>
              <p className="text-xs text-slate-400 mt-1">{t("settings.smartDesc")}</p>
            </div>
            <button 
              onClick={() => setSmartSuggestions(!smartSuggestions)}
              className={`w-14 h-7 rounded-full p-1 transition-colors ${smartSuggestions ? 'bg-purple-500' : 'bg-slate-700'}`}
            >
              <motion.div 
                animate={{ x: smartSuggestions ? 28 : 0 }}
                className="w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
          
          {smartSuggestions && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-slate-300 flex items-center gap-2">
              <span className="text-purple-400 font-medium">{t("settings.example")}</span> 
              <span>"How are..." <span className="text-slate-500">you?</span></span>
            </div>
          )}
        </section>

        {/* Avatar Skin Color */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-pink-400">{t("settings.avatarColor")}</h2>
          
          <div className="mb-6">
            <label className="text-sm text-slate-400 block mb-3">{t("settings.skinTone")}</label>
            <div className="flex gap-3 flex-wrap">
              {SKIN_COLORS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => setAvatarSkinColor(skin.hex)}
                  className={`flex flex-col items-center gap-1.5 transition-all ${
                    avatarSkinColor === skin.hex ? 'scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      avatarSkinColor === skin.hex
                        ? 'ring-4 ring-pink-500/50 border-pink-400'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    style={{ backgroundColor: skin.hex }}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">{skin.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Sliders */}
        <section className="glass-card p-6 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium">{t("settings.speed")}</label>
              <button 
                onClick={() => setAvatarTrigger(Date.now())}
                className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors"
              >
                {t("settings.testSpeed")}
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              {["slow", "medium", "fast"].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSpeechSpeed(speed)}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                    speechSpeed === speed 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {t(`settings.${speed}`)}
                </button>
              ))}
            </div>
            
            <div className="h-32 w-full bg-slate-950 rounded-xl overflow-hidden border border-white/10 relative">
               {/* 3D Avatar Preview */}
               <Avatar3D 
                 signingText="SPEED" 
                 trigger={avatarTrigger} 
                 isActive={true} 
                 previewMode={true}
                 speedMultiplier={speechSpeed === "slow" ? 0.5 : speechSpeed === "fast" ? 1.5 : 1.0}
                 skinColor={avatarSkinColor}
               />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">{t("settings.sensitivity")}</label>
              <span className="text-xs text-blue-400">{gestureSensitivity.toFixed(1)}s</span>
            </div>
            <input 
              type="range" 
              min="0.5" max="2.0" step="0.1"
              value={gestureSensitivity}
              onChange={(e) => setGestureSensitivity(parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-2">{t("settings.sensDesc")}</p>
          </div>
        </section>

        {/* Floating Action Button */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveSettings}
            className="w-full max-w-lg mx-auto block py-4 rounded-xl bg-gradient-primary text-white font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
          >
            {t("settings.done")}
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
