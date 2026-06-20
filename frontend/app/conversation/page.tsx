/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Home, SwitchCamera, Mic, MicOff, Volume2, Video, VideoOff, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { preProcessLandmark, predictSign } from "../../lib/gesture-recognition";
import Avatar3D from "../../components/Avatar3D";
import { userService } from "../../lib/userService";
import { useLanguage } from "../../context/LanguageContext";

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speakText(text: string) {
  const trimmedText = text.trim();
  if (!trimmedText) return;
  
  // Try to use our new Edge TTS neural voice endpoint for natural, human-like voice
  const audio = new Audio(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'/api/tts?text=${encodeURIComponent(trimmedText)}`);
  audio.play().catch(err => {
    console.warn("Neural Edge TTS playback failed, falling back to local SpeechSynthesis:", err);
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(trimmedText);
    utt.lang = "en-US";
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = { id: string; sender: "user" | "assistant"; text: string; translation?: string; aslGloss?: string };

const UI_DICT: Record<string, Record<string, string>> = {
  en: {
    start: "Start Conversation",
    listening: "Listening for speech…",
    processing: "Processing…",
    idle: "Idle",
    reading: "recognising gesture",
    rightHand: "Right hand → Numbers",
    leftHand: "Left hand → Letters",
    autoSpeech: "Auto Speech Recognition",
    smartSpace: "Smart spacing",
    sessionStarted: "Session started! Show your left hand for letters, right hand for numbers."
  },
  hi: {
    start: "बातचीत शुरू करें",
    listening: "आवाज़ सुन रहा है…",
    processing: "प्रक्रिया हो रही है…",
    idle: "हाथ दिखाएं ✋ या बोलें 🎤",
    reading: "इशारा पढ़ रहा है…",
    rightHand: "दाहिना हाथ → संख्याएं",
    leftHand: "बायां हाथ → अक्षर",
    autoSpeech: "स्वचालित आवाज़",
    smartSpace: "स्मार्ट स्पेसिंग",
    sessionStarted: "सत्र शुरू हुआ! अक्षरों के लिए बायां हाथ, संख्याओं के लिए दाहिना हाथ दिखाएं।"
  },
  kn: {
    start: "ಸಂಭಾಷಣೆ ಪ್ರಾರಂಭಿಸಿ",
    listening: "ಮಾತನ್ನು ಆಲಿಸುತ್ತಿದೆ…",
    processing: "ಪ್ರಕ್ರಿಯೆಗೊಳ್ಳುತ್ತಿದೆ…",
    idle: "ಕೈ ತೋರಿಸಿ ✋ ಅಥವಾ ಮಾತನಾಡಿ 🎤",
    reading: "ಸನ್ನೆ ಓದುತ್ತಿದೆ…",
    rightHand: "ಬಲಗೈ → ಸಂಖ್ಯೆಗಳು",
    leftHand: "ಎಡಗೈ → ಅಕ್ಷರಗಳು",
    autoSpeech: "ಸ್ವಯಂ ಧ್ವನಿ",
    smartSpace: "ಸ್ಮಾರ್ಟ್ ಸ್ಪೇಸಿಂಗ್",
    sessionStarted: "ಸತ್ರ ಪ್ರಾರಂಭವಾಯಿತು! ಅಕ್ಷರಗಳಿಗೆ ಎಡಗೈ, ಸಂಖ್ಯೆಗಳಿಗೆ ಬಲಗೈ ತೋರಿಸಿ."
  }
};

export default function ConversationScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  // ── State ────────────────────────────────────────────────────────────────
  const [sessionActive, setSessionActive]   = useState(false);
  const [inputText, setInputText]           = useState("");
  const [avatarText, setAvatarText]         = useState<string | undefined>();
  const [avatarTrigger, setAvatarTrigger]   = useState(0);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [currentHand, setCurrentHand]       = useState<"Right" | "Left" | null>(null);
  const [handsVisible, setHandsVisible]     = useState(false);
  const [webcamActive, setWebcamActive]     = useState(true);
  const [micActive, setMicActive]           = useState(false);
  const [backendStatus, setBackendStatus]   = useState<"checking"|"ok"|"error">("checking");
  const [micStatus, setMicStatus]           = useState<"idle"|"listening"|"processing">("idle");
  const [hasGestured, setHasGestured]       = useState(false);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [selectedLang, setSelectedLang]     = useState("en");
  const [avatarSkinColor, setAvatarSkinColor] = useState("#e8beac");
  const [speechSpeed, setSpeechSpeed]       = useState(1.0);
  const [smartSuggestions, setSmartSuggestions] = useState(false);
  const gestureSensitivityRef               = useRef(0.75);
  const messagesRef                         = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (messagesRef.current.length > 0) {
        userService.addConversation(messagesRef.current);
        userService.incrementConversationCount();
      }
    };
  }, []);

  // Read settings from localStorage
  const readSettingsFromStorage = useCallback(() => {
    setSelectedLang(localStorage.getItem("selectedLanguage") || "en");
    if (localStorage.getItem("avatarSkinColor")) setAvatarSkinColor(localStorage.getItem("avatarSkinColor")!);
    
    const gs = localStorage.getItem("gestureSensitivity");
    if (gs) gestureSensitivityRef.current = parseFloat(gs);
    
    const ss = localStorage.getItem("speechSpeed");
    if (ss === "slow") setSpeechSpeed(0.5);
    else if (ss === "fast") setSpeechSpeed(1.5);
    else setSpeechSpeed(1.0);

    const ssugg = localStorage.getItem("smartSuggestions");
    setSmartSuggestions(ssugg === "true");
  }, []);

  // Load settings on mount
  useEffect(() => {
    readSettingsFromStorage();
  }, [readSettingsFromStorage]);

  // Re-read settings when page becomes visible or gains focus (fixes stale values after settings change)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") readSettingsFromStorage();
    };
    const handleFocus = () => readSettingsFromStorage();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [readSettingsFromStorage]);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputTextRef = useRef("");

  const micActiveRef = useRef(micActive);
  useEffect(() => {
    micActiveRef.current = micActive;
  }, [micActive]);

  const selectedLangRef = useRef(selectedLang);
  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  const wasHandVisibleRef = useRef<boolean>(false);
  const twoHandsStartTimeRef = useRef<number | null>(null);
  const twoHandsTargetRef = useRef<number | null>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef(suggestions);
  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const smartSuggestionsRef = useRef(smartSuggestions);
  useEffect(() => {
    smartSuggestionsRef.current = smartSuggestions;
  }, [smartSuggestions]);

  // ── Smart Suggestions Effect ───────────────────────────────────────────────
  useEffect(() => {
    if (!smartSuggestions) return;
    const words = inputText.trim().split(/\s+/).filter(Boolean);
    fetch("http://localhost:8000/api/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    })
    .then(r => r.json())
    .then(data => {
      setSuggestions(data.suggestions || []);
    })
    .catch(() => setSuggestions([]));
  }, [inputText, smartSuggestions]);

  const hasGesturedRef = useRef(hasGestured);
  useEffect(() => {
    hasGesturedRef.current = hasGestured;
  }, [hasGestured]);

  const setInputTextWithRef = useCallback((val: string | ((prev: string) => string)) => {
    setInputText((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      inputTextRef.current = next;
      return next;
    });
  }, []);

  // Gesture state — mirrors Python app.py exactly
  const gestureStateRef = useRef({
    current: null as string | null,
    handSide: null as string | null,
    startTime: 0,
    printed: false,
    repeatStart: 0,
  });

  // Smart spacing: track last confirmed-gesture timestamp
  const lastGestureTimeRef  = useRef<number>(0);
  const spacingAppliedRef   = useRef<boolean>(false); // prevent double-space

  // Hand presence for mic auto-toggle
  const handLastSeenRef       = useRef<number>(0);       // timestamp when hand was last detected
  const noHandTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGesturingRef        = useRef<boolean>(false);

  // Speech recognition
  const recognitionRef       = useRef<any>(null);
  const classifyPendingRef   = useRef(false);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Backend check ─────────────────────────────────────────────────────────
  useEffect(() => {
    const checkBackend = () => {
      fetch("http://localhost:8000/")
        .then(r => r.ok ? setBackendStatus("ok") : setBackendStatus("error"))
        .catch(() => setBackendStatus("error"));
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Translate helper ──────────────────────────────────────────────────────
  const translateText = useCallback(async (text: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_language: selectedLangRef.current }),
      });
      const data = await res.json();
      if (data.translated_text && selectedLangRef.current !== "en") {
        setMessages(p => {
          const newMsgs = [...p];
          if (newMsgs.length > 0) {
            newMsgs[newMsgs.length - 1].translation = data.translated_text;
          }
          return newMsgs;
        });
      }
    } catch {}
  }, []);

  const processSpeech = useCallback(async (text: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/to_asl_gloss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      const aslGloss = data.asl_gloss || text;
      
      if (aslGloss.length > 30) {
        speakText("Speech too long");
        setMessages(p => [...p, { id: Date.now().toString(), sender: "assistant", text: text }]);
        translateText(text);
        return;
      }

      setMessages(p => [...p, { id: Date.now().toString(), sender: "assistant", text: text, aslGloss }]);
      translateText(text);
      setAvatarText(aslGloss);
      setAvatarTrigger(Date.now());
    } catch {
      if (text.length > 30) {
        speakText("Speech too long");
        setMessages(p => [...p, { id: Date.now().toString(), sender: "assistant", text: text }]);
        translateText(text);
        return;
      }
      setMessages(p => [...p, { id: Date.now().toString(), sender: "assistant", text }]);
      translateText(text);
      setAvatarText(text);
      setAvatarTrigger(Date.now());
    }
  }, []);

  // ── Send typed / composed text ─────────────────────────────────────────────
  const handleSend = useCallback(async (textOverride?: string) => {
    // If handleSend is called from an event (like onClick), textOverride might be an event object. We must verify it's a string.
    const textStr = typeof textOverride === "string" ? textOverride : inputTextRef.current;
    let text = textStr.trim();
    if (!text) return;

    // Run segmentation/grammar correction on send if gestured
    if (hasGesturedRef.current && typeof textOverride !== "string") {
      try {
        const res = await fetch("http://localhost:8000/api/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.segmented) {
          text = data.segmented;
        }
      } catch (err) {
        console.warn("Segmentation failed on send:", err);
      }
    }

    const msg: Message = { id: Date.now().toString(), sender: "user", text };
    setMessages(p => [...p, msg]);
    setInputTextWithRef("");
    speakText(text);
    translateText(text);
    // Reset spacing state
    lastGestureTimeRef.current = 0;
    spacingAppliedRef.current  = false;
    setHasGestured(false);
  }, [translateText, setInputTextWithRef]);

  // ── Speech Recognition (Web Speech API — continuous, auto-process) ─────────
  const startSpeechRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (recognitionRef.current) return; // already running

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setMicStatus("listening");
    recognition.onspeechstart = () => setIsSpeaking(true);
    recognition.onspeechend = () => setIsSpeaking(false);
    recognition.onsoundend = () => setIsSpeaking(false);
    recognition.onaudioend = () => setIsSpeaking(false);

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        // Auto-process final result without pressing any button
        setMicStatus("processing");
        processSpeech(finalTranscript.trim());
        setIsSpeaking(false);
        setTimeout(() => setMicStatus("listening"), 500);
      }
    };

    recognition.onerror = (err: any) => {
      console.warn("Speech recognition error:", err);
      if (err.error === "not-allowed") {
        setMicActive(false);
        micActiveRef.current = false;
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          setMicStatus("idle");
          setIsSpeaking(false);
        }
      }
    };
    recognition.onend = () => {
      setIsSpeaking(false);
      // Auto-restart if still supposed to be listening (with delay to prevent socket conflicts)
      if (micActiveRef.current && !isGesturingRef.current) {
        setTimeout(() => {
          if (micActiveRef.current && !isGesturingRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch (err) {
              console.warn("Speech recognition restart failed in onend, resetting:", err);
              recognitionRef.current = null;
              setMicStatus("idle");
            }
          }
        }, 100);
      } else {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          setMicStatus("idle");
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      recognitionRef.current = null;
      setMicStatus("idle");
    }
  }, [processSpeech]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      try {
        recognitionRef.current.abort(); // Force immediate stop
      } catch {}
      recognitionRef.current = null;
    }
    setMicStatus("idle");
    setIsSpeaking(false);
  }, []);

  // Clean up mic on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
    };
  }, [stopSpeechRecognition]);

  // ── Smart hand presence → mic auto-toggle ────────────────────────────────
  const handleHandPresenceChange = useCallback((detected: boolean) => {
    setHandsVisible(detected);

    if (detected) {
      wasHandVisibleRef.current = true;
      isGesturingRef.current = true;
      handLastSeenRef.current = Date.now();
      if (noHandTimerRef.current) {
        clearTimeout(noHandTimerRef.current);
        noHandTimerRef.current = null;
      }
      if (micActiveRef.current) stopSpeechRecognition();
    } else {
      // Only schedule if the hand was previously visible (meaning it just disappeared)
      if (wasHandVisibleRef.current) {
        wasHandVisibleRef.current = false;
        isGesturingRef.current = false;
        if (noHandTimerRef.current) clearTimeout(noHandTimerRef.current);
        noHandTimerRef.current = setTimeout(async () => {
          if (!isGesturingRef.current) {
            const rawText = inputTextRef.current.trim();
            if (rawText) {
              try {
                const res = await fetch("http://localhost:8000/api/segment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ text: rawText })
                });
                const data = await res.json();
                handleSend(data.segmented || rawText);
              } catch {
                handleSend(rawText);
              }
            }
            if (micActiveRef.current) {
              startSpeechRecognition();
            }
          }
          noHandTimerRef.current = null;
        }, 1500);
      }
    }
  }, [stopSpeechRecognition, startSpeechRecognition, handleSend]);

  // ── Smart spacing handled by auto-send now ─────────────────────────────────

  // ── Gesture confirmed → append letter, speak, smart-space reset ───────────
  const handleGestureDetected = useCallback((sign: string | null, handSide: string) => {
    const st = gestureStateRef.current;
    const now = Date.now() / 1000;
    const HOLD_TO_PRINT        = gestureSensitivityRef.current;
    const HOLD_TO_REPEAT       = gestureSensitivityRef.current;
    const HOLD_TO_PRINT_DELETE = gestureSensitivityRef.current;
    const HOLD_TO_REPEAT_DELETE= gestureSensitivityRef.current;
    const HOLD_TO_CLEAR_ALL    = 3.0; // 3 seconds clear all

    const signKey = sign ? `${sign}:${handSide}` : null;

    if (signKey !== st.current) {
      st.current  = signKey;
      st.handSide = handSide;
      st.startTime = now;
      st.printed   = false;
      st.repeatStart = 0;
      setCurrentGesture(sign);
      setCurrentHand(handSide as "Right" | "Left");
      setHasGestured(true);
      (st as any).clearedAll = false;
    } else if (sign && sign !== "Delete") {
      if (!st.printed) {
        if (now - st.startTime >= HOLD_TO_PRINT) {
          setInputTextWithRef(prev => prev + sign);
          lastGestureTimeRef.current = Date.now();
          spacingAppliedRef.current  = false;
          st.printed = true;
          st.repeatStart = now;
        }
      } else {
        if (st.repeatStart === 0) st.repeatStart = now;
        else if (now - st.repeatStart >= HOLD_TO_REPEAT) {
          setInputTextWithRef(prev => prev + sign);
          lastGestureTimeRef.current = Date.now();
          spacingAppliedRef.current  = false;
          st.repeatStart = now;
        }
      }
    } else if (sign === "Delete") {
      if (now - st.startTime >= HOLD_TO_CLEAR_ALL && !(st as any).clearedAll) {
        setInputTextWithRef("");
        (st as any).clearedAll = true;
        st.repeatStart = now; // prevent single deletes immediately after clear
      } else if (!st.printed && !(st as any).clearedAll) {
        if (now - st.startTime >= HOLD_TO_PRINT_DELETE) {
          setInputTextWithRef(prev => prev.slice(0, -1));
          lastGestureTimeRef.current = Date.now();
          spacingAppliedRef.current  = false;
          st.printed = true;
          st.repeatStart = now;
        }
      } else if (!(st as any).clearedAll) {
        if (st.repeatStart === 0) st.repeatStart = now;
        else if (now - st.repeatStart >= HOLD_TO_REPEAT_DELETE) {
          setInputTextWithRef(prev => prev.slice(0, -1));
          lastGestureTimeRef.current = Date.now();
          spacingAppliedRef.current  = false;
          st.repeatStart = now;
        }
      }
    }
  }, [setInputTextWithRef]);

  // ── Draw skeleton on canvas ────────────────────────────────────────────────
  const drawLandmarks = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!results.multiHandLandmarks) return;

    const CONNECTIONS: [number, number][] = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    results.multiHandLandmarks.forEach((lms: any[], hi: number) => {
      const originalSide = results.multiHandedness?.[hi]?.label;
      // Swap side to match the python cv.flip laterally inverted behavior
      const side = originalSide === "Right" ? "Left" : originalSide === "Left" ? "Right" : originalSide;
      
      // Right hand (letters) = purple, Left hand (numbers) = cyan
      const lineColor = side === "Right" ? "rgba(168,85,247,0.9)" : "rgba(34,211,238,0.9)";
      const dotColor  = side === "Right" ? "#a855f7" : "#22d3ee";

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(lms[a].x * canvas.width, lms[a].y * canvas.height);
        ctx.lineTo(lms[b].x * canvas.width, lms[b].y * canvas.height);
        ctx.stroke();
      });
      lms.forEach((lm: any, i: number) => {
        const r = [0,4,8,12,16,20].includes(i) ? 6 : 4;
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, r, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? dotColor : "#e9d5ff";
        ctx.strokeStyle = "#1e1b4b";
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      });
    });
  }, []);



  // Stable refs for callbacks inside MediaPipe to avoid restarting the camera
  const drawLandmarksRef = useRef(drawLandmarks);
  const handleHandPresenceChangeRef = useRef(handleHandPresenceChange);
  const handleGestureDetectedRef = useRef(handleGestureDetected);

  useEffect(() => {
    drawLandmarksRef.current = drawLandmarks;
    handleHandPresenceChangeRef.current = handleHandPresenceChange;
    handleGestureDetectedRef.current = handleGestureDetected;
  });

  // ── MediaPipe init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionActive || !webcamActive) return;
    let camera: any = null;
    let cancelled   = false;

    async function init() {
      if (!videoRef.current) return;
      try {
        const { Hands } = await import("@mediapipe/hands");
        const { Camera } = await import("@mediapipe/camera_utils");
        if (cancelled) return;

        const hands = new Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(async (results: any) => {
          if (cancelled) return;
          drawLandmarksRef.current(results);

          const hasHands = !!(results.multiHandLandmarks?.length);
          handleHandPresenceChangeRef.current(hasHands);

          if (!hasHands) {
            setCurrentGesture(null);
            setCurrentHand(null);
            twoHandsStartTimeRef.current = null;
            return;
          }

          if (results.multiHandLandmarks.length >= 2 && smartSuggestionsRef.current) {
            // Two hands detected - process left hand to pick specific suggestion
            let leftHandLms = null;
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const originalSide = results.multiHandedness?.[i]?.label;
              const handSide = (originalSide === "Right" ? "Left" : originalSide === "Left" ? "Right" : originalSide);
              if (handSide === "Left") {
                leftHandLms = results.multiHandLandmarks[i].map((lm: any) => ({ ...lm, x: 1 - lm.x }));
                break;
              }
            }

            if (leftHandLms && !classifyPendingRef.current && suggestionsRef.current.length > 0) {
              classifyPendingRef.current = true;
              try {
                const w = results.image?.width  || videoRef.current?.videoWidth  || 640;
                const h = results.image?.height || videoRef.current?.videoHeight || 480;
                const flat = preProcessLandmark(leftHandLms, w, h);
                const sign = await predictSign(flat, "Left");
                
                let targetIndex = -1;
                if (sign === "1") targetIndex = 0;
                else if (sign === "2") targetIndex = 1;
                else if (sign === "3") targetIndex = 2;
                else if (sign === "4") targetIndex = 3;
                else if (sign === "5") targetIndex = 4;

                if (targetIndex !== -1 && targetIndex < suggestionsRef.current.length) {
                  const suggestionText = suggestionsRef.current[targetIndex];
                  
                  // Show the suggestion in the webcam overlay
                  setCurrentGesture(suggestionText);
                  setCurrentHand("Left");
                  setHasGestured(true);

                  if (twoHandsTargetRef.current !== targetIndex) {
                    twoHandsStartTimeRef.current = Date.now();
                    twoHandsTargetRef.current = targetIndex;
                  } else {
                    const heldTime = (Date.now() - (twoHandsStartTimeRef.current || Date.now())) / 1000;
                    if (heldTime > gestureSensitivityRef.current) {
                      setInputTextWithRef(suggestionText);
                      twoHandsStartTimeRef.current = null;
                      twoHandsTargetRef.current = null;
                    }
                  }
                } else {
                  twoHandsStartTimeRef.current = null;
                  twoHandsTargetRef.current = null;
                  // Clear overlay if gesture doesn't match an active suggestion
                  setCurrentGesture(null);
                  setCurrentHand(null);
                }
              } catch (e) {
                // prediction failed
              } finally {
                classifyPendingRef.current = false;
              }
            } else if (!leftHandLms) {
              twoHandsStartTimeRef.current = null;
              twoHandsTargetRef.current = null;
            }
            // Skip single hand processing when two hands are detected
            return;
          } else {
            twoHandsStartTimeRef.current = null;
            twoHandsTargetRef.current = null;
          }

          // Process each detected hand independently
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const originalLms = results.multiHandLandmarks[i];
            const originalSide = results.multiHandedness?.[i]?.label;
            
            // To match Python's cv.flip(image, 1) behavior:
            // 1. Invert X coordinates
            const lms = originalLms.map((lm: any) => ({ ...lm, x: 1 - lm.x }));
            // 2. Swap handedness
            const handSide = (originalSide === "Right" ? "Left" : originalSide === "Left" ? "Right" : originalSide) as "Right" | "Left"; // "Right" = letters, "Left" = numbers
            
            const w = results.image?.width  || videoRef.current?.videoWidth  || 640;
            const h = results.image?.height || videoRef.current?.videoHeight || 480;

            if (classifyPendingRef.current) continue;
            classifyPendingRef.current = true;

            try {
              const flat = preProcessLandmark(lms, w, h);
              const sign = await predictSign(flat, handSide);
              if (!cancelled && sign) handleGestureDetectedRef.current(sign, handSide);
            } finally {
              classifyPendingRef.current = false;
            }
          }
        });

        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && !cancelled) await hands.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
        });
        await camera.start();
        console.log("MediaPipe Hands ready");
      } catch (err) {
        console.error("Camera init error:", err);
      }
    }

    init();
    return () => {
      cancelled = true;
      camera?.stop();
      if (noHandTimerRef.current) clearTimeout(noHandTimerRef.current);
    };
  }, [sessionActive, webcamActive]);

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    setSessionActive(true);
    setMicActive(true);
    micActiveRef.current = true;
    // Removed sessionStarted initial message as requested
    // Start mic right away (hands not visible yet)
    startSpeechRecognition();
  }, [startSpeechRecognition]);

  // ── Mic toggle button ──────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const next = !micActive;
    setMicActive(next);
    micActiveRef.current = next;
    if (!next) {
      stopSpeechRecognition();
    } else {
      if (!isGesturingRef.current) startSpeechRecognition();
    }
  }, [micActive, stopSpeechRecognition, startSpeechRecognition]);

  // ── Status badges ─────────────────────────────────────────────────────────
  const bbg = backendStatus === "ok"
    ? "bg-green-500/20 border-green-500/50 text-green-100"
    : backendStatus === "error"
    ? "bg-red-500/20 border-red-500/50 text-red-200"
    : "bg-yellow-500/20 border-yellow-500/50 text-yellow-100";
  const bdot = backendStatus === "ok" ? "bg-green-400" : backendStatus === "error" ? "bg-red-400 animate-pulse" : "bg-yellow-400 animate-pulse";
  const blabel = backendStatus === "ok" ? "Backend Ready" : backendStatus === "error" ? "Backend Offline" : "Connecting…";

  const micStatusLabel = micStatus === "listening" ? (t("conv.listening")) : micStatus === "processing" ? (t("conv.processing")) : "";

  return (
    <main className="h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => router.push("/home")} className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors flex items-center gap-1">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium pr-1">Back</span>
        </button>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <div className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 ${bbg}`}>
            <span className={`w-2 h-2 rounded-full ${bdot}`} />
            {blabel}
          </div>
          {micStatus !== "idle" && (
            <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-100 text-xs font-semibold flex items-center gap-2">
              <Mic size={12} className="animate-pulse" />
              {micStatusLabel}
            </div>
          )}
          <div className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-100 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
          <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors">
            <SwitchCamera size={20} />
          </button>
        </div>
      </header>

      {/* ── Camera + Avatar ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative flex p-3 gap-3">

        {/* Camera */}
        <div className="flex-1 relative bg-black overflow-hidden rounded-2xl border border-white/10">
          <video ref={videoRef} autoPlay playsInline muted
            className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] rounded-2xl transition-all duration-300 ${isSpeaking ? 'blur-md opacity-50' : ''}`} />
          <canvas ref={canvasRef}
            className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none rounded-2xl" />

          {(!sessionActive || !webcamActive) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
              <Video className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
            </div>
          )}

          {/* Speaking/Listening Overlay */}
          {webcamActive && isSpeaking && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30 backdrop-blur-sm">
              <Mic className="text-cyan-400 animate-pulse w-12 h-12 mb-4" />
              <span className="text-cyan-300 font-bold text-xl tracking-widest animate-pulse">{t("conv.listening")}</span>
            </div>
          )}

          {/* Hand info overlay */}
          {webcamActive && (
          <div className="absolute top-16 left-4 flex flex-col gap-2 z-10">
            <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-purple-300 border border-purple-500/30">
              ✋ Letters → Right Hand
            </div>
            <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-cyan-300 border border-cyan-500/30">
              🤚 Numbers → Left Hand
            </div>
          </div>
          )}

          {/* Gesture detected overlay */}
          {webcamActive && (
          <div className="absolute bottom-4 left-4 right-4 text-center z-10">
            <AnimatePresence mode="wait">
              {currentGesture ? (
                <motion.div key={`${currentGesture}-${currentHand}`}
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -8 }}
                  className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md text-white border ${
                    currentHand === "Right" ? "border-purple-500/50" : "border-cyan-500/50"
                  }`}
                >
                  <Volume2 size={16} className={currentHand === "Right" ? "text-purple-400" : "text-cyan-400"} />
                  <span className="text-sm opacity-70">
                    {currentGesture && currentGesture.length > 1 
                      ? "Suggestion" 
                      : currentHand === "Right" ? "Letter" : "Number"}:
                  </span>
                  <strong className={`text-2xl font-bold tracking-wider ${currentHand === "Right" ? "text-purple-300" : "text-cyan-300"}`}>
                    {currentGesture}
                  </strong>
                </motion.div>
              ) : (
                <motion.div key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md text-slate-400 text-xs border border-white/10"
                >
                  {handsVisible ? (t("conv.reading")) : micStatus === "listening" ? `🎤 ${t("conv.listening")}` : (t("conv.idle"))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>

        {/* Avatar */}
        <div className="w-1/3 md:w-1/2 relative overflow-hidden rounded-2xl flex flex-col items-center justify-center bg-slate-900">
          {(!sessionActive || !micActive) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all">
              <Bot className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
            </div>
          )}
          <Avatar3D signingText={avatarText} trigger={avatarTrigger} isActive={sessionActive} onFinish={() => setAvatarText(undefined)} skinColor={avatarSkinColor} speedMultiplier={speechSpeed} />
        </div>
      </div>

      {/* ── Dialogue ────────────────────────────────────────────────────────── */}
      <div className="h-[40vh] bg-slate-900 border-t border-white/10 flex flex-col relative">

        {/* Start overlay */}
        {!sessionActive && (
          <div className="absolute inset-0 z-30 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center gap-3"
            >
              <Mic size={24} />
              {t("conv.start")}
            </motion.button>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>🤚 {t("learning.numbers")}</span>
              <span>✋ {t("learning.letters")}</span>
              <span>🎤 {t("conv.autoSpeech")}</span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              <div className={`p-3 rounded-2xl text-sm ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-bl-sm border border-white/5"
              }`}>
                <p>{msg.text}</p>
                {msg.translation && (
                  <p className="text-xs mt-1 pt-1 border-t border-white/10 opacity-80">{msg.translation}</p>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-950 border-t border-white/5">
          <div className="flex items-center gap-2">
            {/* Webcam toggle */}
            <button onClick={() => setWebcamActive(!webcamActive)}
              className={`p-3 rounded-xl transition-all ${
                webcamActive
                  ? "bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  : "bg-slate-700/70 text-slate-300 hover:bg-slate-600/70"
              }`}
            >
              {webcamActive ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            {/* Mic toggle */}
            <button onClick={toggleMic}
              className={`p-3 rounded-xl transition-all ${
                micActive
                  ? "bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  : "bg-slate-700/70 text-slate-300 hover:bg-slate-600/70"
              }`}
            >
              {micActive ? <Mic size={24} className={micStatus === "listening" ? "animate-pulse" : ""} /> : <MicOff size={24} />}
            </button>

            {/* Text input */}
            <div className="flex-1 relative bg-white/5 border border-white/10 rounded-xl text-sm transition-all focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 overflow-hidden">
              <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none whitespace-pre text-sm w-full font-sans">
                <span className="text-transparent">{inputText}</span>
                {suggestions.length > 0 && suggestions[0].toLowerCase().startsWith(inputText.toLowerCase()) && (
                  <span className="text-slate-400/50">{suggestions[0].slice(inputText.length)}</span>
                )}
              </div>
              <input type="text"
                value={inputText}
                onChange={e => setInputTextWithRef(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Tab" && suggestions.length > 0 && suggestions[0].toLowerCase().startsWith(inputText.toLowerCase())) {
                    e.preventDefault();
                    setInputTextWithRef(suggestions[0]);
                  } else if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                className="w-full h-full bg-transparent py-3 px-4 focus:outline-none placeholder:text-slate-500 relative z-10 text-white dark:text-white"
              />
            </div>
          </div>

          {/* Smart space indicator */}
          {handsVisible && hasGestured && (
            <p className="text-xs text-slate-500 mt-2 pl-1">
              Pause 1.5s to auto-send and switch to speech
            </p>
          )}
          
          {suggestions.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInputTextWithRef(s)}
                  className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-full text-xs whitespace-nowrap transition-colors border border-purple-500/20 shrink-0"
                >
                  {s}
                </button>
              ))}
              <span className="text-xs text-purple-300/50 flex items-center ml-1 whitespace-nowrap">Hold two hands (Left 5 for 1st, 1-4 for others)</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
