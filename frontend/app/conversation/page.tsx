/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, SwitchCamera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

// Hooks
import { useMediaPipe } from "../../hooks/useMediaPipe";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { useAutocomplete } from "../../hooks/useAutocomplete";
import { useConversationEngine } from "../../hooks/useConversationEngine";

// Components
import ConversationCamera from "../../components/ConversationCamera";
import ConversationControls from "../../components/ConversationControls";
import ConversationOutput, { AvatarPanel } from "../../components/ConversationOutput";

// Contexts & Services
import { useLanguage } from "../../context/LanguageContext";
import { useBackendStatus } from "../../context/BackendStatusContext";
import { userService } from "../../lib/userService";

// ─── Settings helpers ─────────────────────────────────────────────────────────
function readSettings() {
  return {
    selectedLang: localStorage.getItem("selectedLanguage") || "en",
    avatarSkinColor: localStorage.getItem("avatarSkinColor") || "#e8beac",
    gestureSensitivity: parseFloat(localStorage.getItem("gestureSensitivity") || "0.75"),
    speechSpeed: (() => {
      const ss = localStorage.getItem("speechSpeed");
      if (ss === "slow") return 0.5;
      if (ss === "fast") return 1.5;
      return 1.0;
    })(),
    smartSuggestions: localStorage.getItem("smartSuggestions") === "true",
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConversationScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { status: backendStatus } = useBackendStatus();

  // ── Settings from localStorage ────────────────────────────────────────────
  const [selectedLang, setSelectedLang] = useState("en");
  const [avatarSkinColor, setAvatarSkinColor] = useState("#e8beac");
  const [gestureSensitivity, setGestureSensitivity] = useState(0.75);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [smartSuggestions, setSmartSuggestions] = useState(false);

  const applySettings = useCallback(() => {
    const s = readSettings();
    setSelectedLang(s.selectedLang);
    setAvatarSkinColor(s.avatarSkinColor);
    setGestureSensitivity(s.gestureSensitivity);
    setSpeechSpeed(s.speechSpeed);
    setSmartSuggestions(s.smartSuggestions);
  }, []);

  useEffect(() => {
    applySettings();
  }, [applySettings]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") applySettings();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", applySettings);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", applySettings);
    };
  }, [applySettings]);

  // ── Webcam visual toggle (camera never stops) ─────────────────────────────
  const [webcamVisible, setWebcamVisible] = useState(true);

  // ── Conversation engine ───────────────────────────────────────────────────
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const {
    inputText,
    setInputTextWithRef,
    messages,
    avatarText,
    avatarTrigger,
    hasGestured,
    handleSend,
    handleGestureDetected,
    handleHandAbsent,
    processSpeech,
    setAvatarText,
    injectInitialGreeting,
  } = useConversationEngine({ 
    selectedLang, 
    gestureSensitivity,
    onTtsStart: () => setTtsPlaying(true),
    onTtsEnd: () => setTtsPlaying(false),
  });

  // ── Autocomplete ──────────────────────────────────────────────────────────
  const { suggestions } = useAutocomplete({ 
    inputText, 
    smartSuggestions,
    messagesLength: messages.length
  });

  // ── MediaPipe ─────────────────────────────────────────────────────────────
  const { videoRef, canvasRef, currentGesture, currentHand, handsVisible, toggleCamera } = useMediaPipe({
    onGestureDetected: handleGestureDetected,
    onHandPresent: () => {},           // no action needed: engine tracks hasGestured
    onHandAbsent: handleHandAbsent,    // 2000 ms → auto-send
    suggestions,
    smartSuggestions,
    gestureSensitivity,
  });

  // ── Speech recognition ────────────────────────────────────────────────────
  const { micActive, micStatus, isSpeaking, toggleMic, pauseSpeech, resumeSpeech } = useSpeechRecognition({
    onSpeechResult: processSpeech,
  });

  // Mute mic only when TTS is playing
  useEffect(() => {
    if (ttsPlaying) {
      pauseSpeech();
    } else {
      resumeSpeech();
    }
  }, [ttsPlaying, pauseSpeech, resumeSpeech]);

  // ── Auto-scroll messages ──────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Save conversation on unmount ──────────────────────────────────────────
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => {
    return () => {
      const historyMessages = messagesRef.current.filter(m => !m.localOnly);
      if (historyMessages.length > 0) {
        userService.addConversation(historyMessages);
        userService.incrementConversationCount();
      }
    };
  }, []);

  // ── Inject Initial Greeting ───────────────────────────────────────────────
  const hasInjectedGreetingRef = useRef(false);
  useEffect(() => {
    if (hasInjectedGreetingRef.current) return;
    hasInjectedGreetingRef.current = true;
    
    const pStr = localStorage.getItem("userProfile");
    if (pStr) {
      try {
        const p = JSON.parse(pStr);
        if (p.fullName && p.disabilityType && p.disabilityType !== "None") {
           // We add a tiny delay to ensure TTS engine is ready
           setTimeout(() => {
             injectInitialGreeting(p.fullName, p.disabilityType);
           }, 1000);
        }
      } catch(e) {}
    }
  }, [injectInitialGreeting]);

  // ── Backend status badge ──────────────────────────────────────────────────
  const bbg =
    backendStatus === "online"
      ? "bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20 text-[var(--accent-green)]"
      : backendStatus === "offline"
      ? "bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20 text-[var(--accent-red)]"
      : "bg-[var(--text-tertiary)]/10 border-[var(--border-subtle)] text-[var(--text-tertiary)]";
  
  const bdot =
    backendStatus === "online"
      ? "bg-[var(--accent-green)]"
      : backendStatus === "offline"
      ? "bg-[var(--accent-red)] animate-pulse"
      : "bg-[var(--text-tertiary)] animate-pulse";
      
  const blabel =
    backendStatus === "online"
      ? "Online"
      : backendStatus === "offline"
      ? "Offline"
      : "Connecting...";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 w-full px-4 pt-4 pb-12 z-50 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          onClick={() => router.push("/home")}
          className="p-2.5 rounded-2xl bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/60 hover:text-white transition-colors border border-white/10 shadow-sm pointer-events-auto outline-none focus-ring"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex gap-2 items-center pointer-events-auto">
          {/* Backend status */}
          <div className={`px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-sm ${bbg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bdot}`} />
            {blabel}
          </div>

          <button 
            onClick={toggleCamera} 
            className="p-2.5 rounded-xl bg-black/40 backdrop-blur-md text-white/90 hover:bg-black/60 hover:text-white transition-colors border border-white/10 shadow-sm outline-none focus-ring"
            title="Switch Camera"
          >
            <SwitchCamera size={18} />
          </button>
        </div>
      </header>

      {/* ── Camera + Avatar ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative flex p-2 sm:p-4 gap-2 sm:gap-4 bg-[var(--bg-primary)]">
        <ConversationCamera
          videoRef={videoRef}
          canvasRef={canvasRef}
          currentGesture={currentGesture}
          currentHand={currentHand}
          handsVisible={handsVisible}
          isSpeaking={isSpeaking}
          micStatus={handsVisible ? "idle" : micStatus}
          webcamVisible={webcamVisible}
        />

        <AvatarPanel
          avatarText={avatarText}
          avatarTrigger={avatarTrigger}
          avatarSkinColor={avatarSkinColor}
          speechSpeed={speechSpeed}
          onAvatarFinish={() => setAvatarText(undefined)}
        />
      </div>

      {/* ── Dialogue ────────────────────────────────────────────────────── */}
      <ConversationOutput
        messages={messages}
        messagesEndRef={messagesEndRef}
        avatarText={avatarText}
        avatarTrigger={avatarTrigger}
        avatarSkinColor={avatarSkinColor}
        speechSpeed={speechSpeed}
        onAvatarFinish={() => setAvatarText(undefined)}
      />

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <ConversationControls
        inputText={inputText}
        onInputChange={setInputTextWithRef}
        onSend={handleSend}
        micActive={micActive}
        onToggleMic={toggleMic}
        micStatus={micStatus}
        webcamVisible={webcamVisible}
        onToggleWebcam={() => setWebcamVisible((v) => !v)}
        suggestions={suggestions}
        handsVisible={handsVisible}
        hasGestured={hasGestured}
        onSuggestionSelect={setInputTextWithRef}
      />
    </main>
  );
}
