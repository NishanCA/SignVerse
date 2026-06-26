/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Mic, SwitchCamera } from "lucide-react";
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
  const { suggestions } = useAutocomplete({ inputText, smartSuggestions });

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
      ? "bg-green-500/20 border-green-500/50 text-green-100"
      : backendStatus === "offline"
      ? "bg-red-500/20 border-red-500/50 text-red-200"
      : "bg-yellow-500/20 border-yellow-500/50 text-yellow-100";
  const bdot =
    backendStatus === "online"
      ? "bg-green-400"
      : backendStatus === "offline"
      ? "bg-red-400 animate-pulse"
      : "bg-yellow-400 animate-pulse";
  const blabel =
    backendStatus === "online"
      ? "Backend Online"
      : backendStatus === "offline"
      ? "Backend Offline"
      : "Waking up server (20-60s)";

  const micStatusLabel =
    micStatus === "listening"
      ? t("conv.listening")
      : micStatus === "processing"
      ? t("conv.processing")
      : "";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => router.push("/home")}
          className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium pr-1">Back</span>
        </button>

        <div className="flex gap-2 items-center flex-wrap justify-end">
          {/* Backend status */}
          <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 ${bbg}`}>
            <span className={`w-2 h-2 rounded-full ${bdot}`} />
            {blabel}
          </div>

          <button onClick={toggleCamera} className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors">
            <SwitchCamera size={20} />
          </button>
        </div>
      </header>

      {/* ── Camera + Avatar ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative flex p-3 gap-3">
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
