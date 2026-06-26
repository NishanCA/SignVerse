"use client";

import { useState, useEffect, useRef } from "react";
import { BACKEND_URL } from "../lib/config";

interface UseAutocompleteOptions {
  inputText: string;
  smartSuggestions: boolean;
}

export function useAutocomplete({ inputText, smartSuggestions }: UseAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Issue 4: only call autocomplete when the sentence actually changes
  const previousSentenceRef = useRef("");

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
      setSuggestions([
        "HELLO HOW ARE YOU",
        "NICE TO MEET YOU",
        "I NEED HELP",
        "YES",
        "NO"
      ]);
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
