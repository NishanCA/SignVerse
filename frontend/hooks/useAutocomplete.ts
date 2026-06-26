"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BACKEND_URL } from "../lib/config";

const STARTER_PHRASES = [
  "HELLO HOW ARE YOU",
  "NICE TO MEET YOU",
  "I NEED HELP",
  "YES",
  "NO",
  "WHAT IS YOUR NAME",
  "PLEASE WRITE IT DOWN",
  "I AM DEAF",
  "THANK YOU",
  "GOODBYE",
  "HOW CAN I HELP YOU",
  "WHERE IS THE RESTROOM",
  "I DON'T UNDERSTAND",
  "PLEASE REPEAT",
  "I AM FINE",
  "WHAT TIME IS IT",
  "EXCUSE ME",
  "I AGREE",
  "I DISAGREE",
  "WAIT A MINUTE",
];

interface UseAutocompleteOptions {
  inputText: string;
  smartSuggestions: boolean;
  messagesLength: number;
}

export function useAutocomplete({ inputText, smartSuggestions, messagesLength }: UseAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentStarters, setCurrentStarters] = useState<string[]>([]);

  // Issue 4: only call autocomplete when the sentence actually changes
  const previousSentenceRef = useRef("");
  const lastMessagesLengthRef = useRef(messagesLength);
  const repliesSinceShuffleRef = useRef(0);

  const shuffleStarters = useCallback(() => {
    const shuffled = [...STARTER_PHRASES].sort(() => 0.5 - Math.random());
    setCurrentStarters(shuffled.slice(0, 5));
    repliesSinceShuffleRef.current = 0;
  }, []);

  // Initialize starters
  useEffect(() => {
    if (currentStarters.length === 0) shuffleStarters();
  }, [currentStarters.length, shuffleStarters]);

  // Shuffle logic on message length change
  useEffect(() => {
    if (messagesLength > lastMessagesLengthRef.current) {
      const diff = messagesLength - lastMessagesLengthRef.current;
      repliesSinceShuffleRef.current += diff;
      lastMessagesLengthRef.current = messagesLength;

      if (repliesSinceShuffleRef.current >= 2) {
        shuffleStarters();
      }
    }
  }, [messagesLength, shuffleStarters]);

  useEffect(() => {
    if (!smartSuggestions) {
      console.log("[Pipeline] autocomplete skipped");
      setSuggestions([]);
      previousSentenceRef.current = "";
      return;
    }

    // Skip if sentence hasn't changed since last call
    if (inputText === previousSentenceRef.current) return;
    previousSentenceRef.current = inputText;

    const words = inputText.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      // Auto-shuffle if they cleared text after typing something (optional UX, but we rely on replies tracker)
      setSuggestions(currentStarters);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log("[Pipeline] autocomplete started");
      fetch(`${BACKEND_URL}/api/autocomplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      })
        .then((r) => r.json())
        .then((data) => setSuggestions(data.suggestions || []))
        .catch(() => {
           console.log("[Pipeline] autocomplete failed");
           setSuggestions([]);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputText, smartSuggestions]);

  return { suggestions };
}
