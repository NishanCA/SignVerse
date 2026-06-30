/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Settings2, Globe, Sparkles, Accessibility, MessageSquare, Monitor, Check } from "lucide-react";
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
            return;
          }
        } catch (err) {
          console.warn("Failed to load settings from Firestore:", err);
        }
      }

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

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "settings", "preferences"), settingsData);
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
    <main className="min-h-screen bg-[var(--bg-primary)] px-6 relative overflow-x-hidden pb-32 pt-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center mb-8 mt-2 sticky top-4 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 py-2 -mx-4 px-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold ml-2 text-[var(--text-primary)]">{t("settings.title") || "Settings"}</h1>
          <button 
            onClick={saveSettings}
            className="ml-auto px-4 py-1.5 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] text-sm font-medium hover:scale-105 transition-transform focus-ring shadow-sm"
          >
            {t("settings.done") || "Done"}
          </button>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* General & UI */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
               <Globe className="text-[var(--accent-blue)]" size={18} />
               <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{t("language.select") || "App Language & Theme"}</h2>
            </div>
            
            <div className="p-5 space-y-6">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">{t("language.desc") || "Interface Language"}</label>
                <div className="flex flex-wrap gap-2">
                  {UI_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLocalUiLanguage(lang.id);
                        setUiLanguage(lang.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        localUiLanguage === lang.id 
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">{t("settings.theme") || "Appearance"}</label>
                <div className="flex gap-2">
                  {['dark', 'light'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setAppTheme(theme)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors border ${
                        appTheme === theme 
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t(`settings.${theme}`) || theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Voice & Translation */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
               <Settings2 className="text-[var(--accent-green)]" size={18} />
               <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{t("settings.voice") || "Voice & Speech"}</h2>
            </div>
            
            <div className="p-5 space-y-6">
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">{t("settings.prefLang") || "Translation Output Language"}</label>
                <div className="flex gap-2">
                  {['english', 'hindi', 'kannada'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setPreferredLang(lang)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors border ${
                        preferredLang === lang 
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t(`settings.${lang}`) || lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">{t("settings.voiceType") || "Voice Profile"}</label>
                <div className="flex gap-2">
                  {['male', 'female'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setVoiceType(type)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors border ${
                        voiceType === type 
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t(`settings.${type}`) || type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-1.5">{t("settings.accent") || "Regional Accent"}</label>
                <div className="flex gap-2">
                  {['indian', 'american', 'british'].map((acc) => (
                    <button
                      key={acc}
                      onClick={() => playAccentPreview(acc)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors border ${
                        accent === acc 
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t(`settings.${acc}`) || acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Smart Features */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Sparkles className="text-[var(--accent-red)]" size={18} />
                 <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{t("settings.smart") || "AI Features"}</h2>
               </div>
               <button 
                 onClick={() => setSmartSuggestions(!smartSuggestions)}
                 className={`w-12 h-6 rounded-full p-1 transition-colors relative shadow-inner ${smartSuggestions ? 'bg-[var(--accent-green)]' : 'bg-[var(--border-strong)]'}`}
                 role="switch"
                 aria-checked={smartSuggestions}
               >
                 <motion.div 
                   animate={{ x: smartSuggestions ? 24 : 0 }}
                   className="w-4 h-4 bg-white rounded-full shadow-sm"
                 />
               </button>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                {t("settings.smartDesc") || "Provide intelligent next-word predictions during text-to-speech."}
              </p>
              {smartSuggestions && (
                <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-tertiary)] uppercase text-xs">{t("settings.example") || "Example:"}</span> 
                  <span>"How are..." <span className="text-[var(--text-tertiary)]">you?</span></span>
                </div>
              )}
            </div>
          </section>

          {/* Avatar & Input Sensitivity */}
          <section className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
             <div className="p-4 border-b border-[var(--border-subtle)] flex items-center gap-2">
               <Accessibility className="text-[var(--text-primary)]" size={18} />
               <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Avatar & Gestures</h2>
            </div>
            
            <div className="p-5 space-y-8">
              {/* Avatar Tone */}
              <div>
                <label className="text-sm font-medium text-[var(--text-primary)] block mb-3">{t("settings.avatarColor") || "Avatar Skin Tone"}</label>
                <div className="flex gap-3 flex-wrap">
                  {SKIN_COLORS.map((skin) => (
                    <button
                      key={skin.id}
                      onClick={() => setAvatarSkinColor(skin.hex)}
                      className={`flex flex-col items-center gap-1.5 transition-all outline-none focus-ring rounded-lg p-1 ${
                        avatarSkinColor === skin.hex ? '' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full border-2 transition-all shadow-sm ${
                          avatarSkinColor === skin.hex
                            ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-elevated)] ring-[var(--text-primary)] border-white/20'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        style={{ backgroundColor: skin.hex }}
                      >
                         {avatarSkinColor === skin.hex && (
                           <div className="w-full h-full flex items-center justify-center mix-blend-difference opacity-50">
                             <Check size={16} className="text-white" />
                           </div>
                         )}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium">{skin.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech Speed */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">{t("settings.speed") || "Avatar Signing Speed"}</label>
                  <button 
                    onClick={() => setAvatarTrigger(Date.now())}
                    className="text-xs px-2.5 py-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors focus-ring outline-none"
                  >
                    {t("settings.testSpeed") || "Preview"}
                  </button>
                </div>
                
                <div className="flex gap-2 mb-4">
                  {["slow", "medium", "fast"].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSpeechSpeed(speed)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors border ${
                        speechSpeed === speed 
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-sm' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t(`settings.${speed}`) || speed}
                    </button>
                  ))}
                </div>
                
                <div className="h-40 w-full bg-[#111111] rounded-2xl overflow-hidden border border-[var(--border-subtle)] relative shadow-inner">
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

              {/* Sensitivity */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">{t("settings.sensitivity") || "Gesture Sensitivity"}</label>
                  <span className="text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-md">{gestureSensitivity.toFixed(1)}s</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" max="2.0" step="0.1"
                  value={gestureSensitivity}
                  onChange={(e) => setGestureSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-[var(--text-primary)] h-1.5 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)] focus-visible:ring-[var(--text-primary)]"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-2">{t("settings.sensDesc") || "Lower value means faster recognition but more accidental triggers."}</p>
              </div>
            </div>
          </section>

        </motion.div>
      </div>
    </main>
  );
}
