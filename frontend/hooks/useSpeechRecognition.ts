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

  const startSpeech = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (recognitionRef.current) return; // already running

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        setMicStatus("processing");
        onSpeechResultRef.current(finalTranscript.trim());
        setIsSpeaking(false);
        setTimeout(() => setMicStatus("listening"), 500);
      }
    };

    let nonTransientError = false;

    recognition.onerror = (err: any) => {
      console.warn("[useSpeechRecognition] error:", err.error);
      if (
        err.error === "not-allowed" ||
        err.error === "network" ||
        err.error === "aborted" ||
        err.error === "service-not-allowed"
      ) {
        nonTransientError = true;
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
      // Auto-restart if still supposed to be active
      if (micActiveRef.current && !nonTransientError) {
        setTimeout(() => {
          if (micActiveRef.current && !nonTransientError && recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch {
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
      console.error("[useSpeechRecognition] start failed:", err);
      recognitionRef.current = null;
      setMicStatus("idle");
    }
  }, []);

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

  return { micActive, micStatus, isSpeaking, toggleMic, startSpeech, stopSpeech };
}
