"use client";

import { useRef, useState, useCallback } from "react";
import { BACKEND_URL } from "../lib/config";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  translation?: string;
  aslGloss?: string;
};

// ─── TTS ───────────────────────────────────────────────────────────────────────
function speakText(text: string) {
  const trimmedText = text.trim();
  if (!trimmedText) return;

  const audio = new Audio(
    `${BACKEND_URL}/api/tts?text=${encodeURIComponent(trimmedText)}`
  );
  audio.play().catch(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(trimmedText);
    utt.lang = "en-US";
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  });
}

interface UseConversationEngineOptions {
  selectedLang: string;
  gestureSensitivity?: number;
}

export function useConversationEngine({
  selectedLang,
  gestureSensitivity = 0.75,
}: UseConversationEngineOptions) {
  // ── Core state ──────────────────────────────────────────────────────────────
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [avatarText, setAvatarText] = useState<string | undefined>();
  const [avatarTrigger, setAvatarTrigger] = useState(0);
  const [hasGestured, setHasGestured] = useState(false);

  // ── Refs (shadow real-time values for use inside callbacks / closures) ──────
  const inputTextRef = useRef("");
  const selectedLangRef = useRef(selectedLang);
  const gestureSensitivityRef = useRef(gestureSensitivity);
  const hasGesturedRef = useRef(false);

  // Keep refs in sync
  const setInputTextWithRef = useCallback((val: string | ((prev: string) => string)) => {
    setInputText((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      inputTextRef.current = next;
      return next;
    });
  }, []);

  // Sync prop refs on every render (no stale closure issues)
  selectedLangRef.current = selectedLang;
  gestureSensitivityRef.current = gestureSensitivity;
  hasGesturedRef.current = hasGestured;

  // ── Gesture state machine — mirrors Python app.py exactly ─────────────────
  const gestureStateRef = useRef({
    current: null as string | null,
    handSide: null as string | null,
    startTime: 0,
    printed: false,
    repeatStart: 0,
    clearedAll: false,
  });

  // ── Translate helper ────────────────────────────────────────────────────────
  const translateText = useCallback(async (text: string, msgId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_language: selectedLangRef.current }),
      });
      const data = await res.json();
      if (data.translated_text && selectedLangRef.current !== "en") {
        setMessages((p) => p.map((m) => (m.id === msgId ? { ...m, translation: data.translated_text } : m)));
      }
    } catch {
      // silent
    }
  }, []);

  // ── Process speech → ASL gloss → avatar ────────────────────────────────────
  const processSpeech = useCallback(
    async (text: string) => {
      console.log("[Pipeline] speech received");
      const msgId = Date.now().toString();

      // UI Immediately
      setMessages((p) => [
        ...p,
        { id: msgId, sender: "assistant", text },
      ]);
      console.log("[Pipeline] UI updated");

      translateText(text, msgId);

      try {
        const res = await fetch(`${BACKEND_URL}/api/to_asl_gloss`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        const aslGloss = data.asl_gloss || text;

        if (aslGloss.length > 30) {
          speakText("Speech too long");
          return;
        }

        setMessages((p) => p.map((m) => (m.id === msgId ? { ...m, aslGloss } : m)));
        setAvatarText(aslGloss);
        setAvatarTrigger(Date.now());
      } catch {
        if (text.length > 30) {
          speakText("Speech too long");
          return;
        }
        setAvatarText(text);
        setAvatarTrigger(Date.now());
      }
    },
    [translateText]
  );

  // ── Send text (from input, gesture auto-send, or suggestion) ───────────────
  const handleSend = useCallback(
    async (textOverride?: string) => {
      const textStr = typeof textOverride === "string" ? textOverride : inputTextRef.current;
      let text = textStr.trim();
      if (!text) return;

      const msgId = Date.now().toString();
      const msg: Message = { id: msgId, sender: "user", text };

      // UI Immediately
      setMessages((p) => [...p, msg]);
      setInputTextWithRef("");
      console.log("[Pipeline] UI updated");

      speakText(text);
      translateText(text, msgId);

      const wasGestured = hasGesturedRef.current && typeof textOverride !== "string";
      setHasGestured(false);

      // Segmentation/grammar correction only when gestured
      if (wasGestured) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/segment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          const data = await res.json();
          if (data.segmented) {
            setMessages((p) => p.map((m) => (m.id === msgId ? { ...m, text: data.segmented } : m)));
          }
        } catch (err) {
          console.warn("[useConversationEngine] Segmentation failed:", err);
        }
      }
    },
    [translateText, setInputTextWithRef]
  );

  // ── Hand absent callback: auto-send after 2 s no-hand ─────────────────────
  const handleHandAbsent = useCallback(() => {
    const rawText = inputTextRef.current.trim();
    if (!rawText) return;

    fetch(`${BACKEND_URL}/api/segment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText }),
    })
      .then((res) => res.json())
      .then((data) => handleSend(data.segmented || rawText))
      .catch(() => handleSend(rawText));
  }, [handleSend]);

  // ── Gesture state machine (mirrors Python app.py exactly) ─────────────────
  const handleGestureDetected = useCallback(
    (sign: string | null, handSide: string) => {
      // Suggestion selection via two-hand mode
      if (handSide === "suggestion" && sign) {
        console.log("[Pipeline] gesture received");
        setInputTextWithRef(sign);
        return;
      }

      const st = gestureStateRef.current;
      const now = Date.now() / 1000;
      const HOLD_TO_PRINT = gestureSensitivityRef.current;
      const HOLD_TO_REPEAT = 2.5; // Drastically increased to prevent accidental double-letters
      const HOLD_TO_PRINT_DELETE = gestureSensitivityRef.current;
      const HOLD_TO_REPEAT_DELETE = gestureSensitivityRef.current;
      const HOLD_TO_CLEAR_ALL = 3.0;

      const signKey = sign ? `${sign}:${handSide}` : null;

      if (signKey !== st.current) {
        st.current = signKey;
        st.handSide = handSide;
        st.startTime = now;
        st.printed = false;
        st.repeatStart = 0;
        st.clearedAll = false;
        setHasGestured(true);
      } else if (sign && sign !== "Delete") {
        if (!st.printed) {
          if (now - st.startTime >= HOLD_TO_PRINT) {
            console.log("[Pipeline] gesture received");
            setInputTextWithRef((prev) => prev + sign);
            st.printed = true;
            st.repeatStart = now;
          }
        } else {
          if (st.repeatStart === 0) st.repeatStart = now;
          else if (now - st.repeatStart >= HOLD_TO_REPEAT) {
            console.log("[Pipeline] gesture received");
            setInputTextWithRef((prev) => prev + sign);
            st.repeatStart = now;
          }
        }
      } else if (sign === "Delete") {
        if (now - st.startTime >= HOLD_TO_CLEAR_ALL && !st.clearedAll) {
          console.log("[Pipeline] gesture received");
          setInputTextWithRef("");
          st.clearedAll = true;
          st.repeatStart = now;
        } else if (!st.printed && !st.clearedAll) {
          if (now - st.startTime >= HOLD_TO_PRINT_DELETE) {
            console.log("[Pipeline] gesture received");
            setInputTextWithRef((prev) => prev.slice(0, -1));
            st.printed = true;
            st.repeatStart = now;
          }
        } else if (!st.clearedAll) {
          if (st.repeatStart === 0) st.repeatStart = now;
          else if (now - st.repeatStart >= HOLD_TO_REPEAT_DELETE) {
            console.log("[Pipeline] gesture received");
            setInputTextWithRef((prev) => prev.slice(0, -1));
            st.repeatStart = now;
          }
        }
      }
    },
    [setInputTextWithRef]
  );

  return {
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
  };
}
