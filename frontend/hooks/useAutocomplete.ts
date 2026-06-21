"use client";

import { useState, useEffect } from "react";

interface UseAutocompleteOptions {
  inputText: string;
  smartSuggestions: boolean;
}

export function useAutocomplete({ inputText, smartSuggestions }: UseAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!smartSuggestions) {
      setSuggestions([]);
      return;
    }

    const words = inputText.trim().split(/\s+/).filter(Boolean);

    const timeoutId = setTimeout(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/autocomplete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      })
        .then((r) => r.json())
        .then((data) => setSuggestions(data.suggestions || []))
        .catch(() => setSuggestions([]));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputText, smartSuggestions]);

  return { suggestions };
}
