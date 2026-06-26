/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface UseSpeechRecognitionOptions {
  /** Called with the final transcript when speech is recognized. */
  onSpeechResult: (transcript: string) => void;
}

export function useSpeechRecognition({ onSpeechResult }: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<any>(null);
  const [micActive, setMicActive] = useState(true); // starts active on mount
  const [micStatus, setMicStatus] = useState<"idle" | "listening" | "processing">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Shadow refs for use inside closures
  const micActiveRef = useRef(true);
  const onSpeechResultRef = useRef(onSpeechResult);
  useEffect(() => { onSpeechResultRef.current = onSpeechResult; });

  const stopSpeech = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      try {
        recognitionRef.current.abort();
      } catch {
        // silent
      }
      recognitionRef.current = null;
    }
    setMicStatus("idle");
    setIsSpeaking(false);
  }, []);

  const pauseSpeech = useCallback(() => {
    if (!micActiveRef.current) return;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setMicStatus("idle");
    setIsSpeaking(false);
  }, []);


  const startSpeech = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      console.warn("[Speech] SpeechRecognition API not available in this browser");
      return;
    }
    if (recognitionRef.current) return; // already running

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log("[Speech] started");
      setMicStatus("listening");
    };
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
        console.log("[Speech] transcript:", finalTranscript.trim());
        setMicStatus("processing");
        // Emit the result
        console.log("[Speech] emitted:", finalTranscript.trim());
        onSpeechResultRef.current(finalTranscript.trim());
        setIsSpeaking(false);
        setTimeout(() => setMicStatus("listening"), 500);
      }
    };

    let nonTransientError = false;

    recognition.onerror = (err: any) => {
      console.log("[Speech] error:", err.error);
      // no-speech is transient — do NOT treat it as a fatal error.
      // It fires when silence is detected, but recognition continues.
      if (err.error === "no-speech") return;
      if (
        err.error === "not-allowed" ||
        err.error === "network" ||
        err.error === "aborted" ||
        err.error === "service-not-allowed"
      ) {
        nonTransientError = true;
        setMicActive(false);
        micActiveRef.current = false;
        recognitionRef.current = null;
        setMicStatus("idle");
        setIsSpeaking(false);
      }
    };

    // FIX: The old guard `recognitionRef.current === recognition` failed on
    // restart because recognitionRef.current is set to null by the catch
    // block in some paths before onend fires. Use a local `isActive` flag
    // instead — it is closure-scoped and reliably tracks this instance.
    recognition.onend = () => {
      setIsSpeaking(false);
      if (micActiveRef.current && !nonTransientError) {
        // Auto-restart: replace the stale ref with a fresh start
        recognitionRef.current = null; // clear ref so startSpeech() won't bail early
        setTimeout(() => {
          if (micActiveRef.current && !nonTransientError) {
            startSpeech(); // call startSpeech() rather than recognition.start()
                           // so a brand-new instance is created every time
            console.log("[Speech] restarted after onend");
          }
        }, 150);
      } else {
        recognitionRef.current = null;
        setMicStatus("idle");
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error("[Speech] start failed:", err);
      recognitionRef.current = null;
      setMicStatus("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // startSpeech is intentionally stable — it reads micActiveRef, not micActive state

  const resumeSpeech = useCallback(() => {
    if (!micActiveRef.current) return;
    startSpeech();
  }, [startSpeech]);

  const toggleMic = useCallback(() => {
    const next = !micActiveRef.current;
    micActiveRef.current = next;
    setMicActive(next);
    if (!next) {
      stopSpeech();
    } else {
      startSpeech();
    }
  }, [startSpeech, stopSpeech]);

  // Auto-start on mount
  useEffect(() => {
    startSpeech();
    return () => {
      stopSpeech();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { micActive, micStatus, isSpeaking, toggleMic, startSpeech, stopSpeech, pauseSpeech, resumeSpeech };
}
