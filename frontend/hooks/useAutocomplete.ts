"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BACKEND_URL } from "../lib/config";

const STARTER_PHRASES = [
  "HELLO",
  "GOOD MORNING",
  "GOOD AFTERNOON",
  "GOOD EVENING",
  "HOW ARE YOU",
  "I AM FINE",
  "NICE TO MEET YOU",
  "WHAT IS YOUR NAME",
  "MY NAME IS",
  "HOW CAN I HELP YOU",
  "CAN YOU HELP ME",
  "I NEED HELP",
  "PLEASE",
  "THANK YOU",
  "YOU ARE WELCOME",
  "EXCUSE ME",
  "SORRY",
  "YES",
  "NO",
  "MAYBE",
  "I DON'T UNDERSTAND",
  "PLEASE REPEAT",
  "PLEASE SPEAK SLOWLY",
  "PLEASE WRITE IT DOWN",
  "CAN YOU SAY THAT AGAIN",
  "WAIT A MINUTE",
  "ONE MOMENT PLEASE",
  "I AM READY",
  "LET'S START",
  "WHAT TIME IS IT",
  "WHAT DAY IS IT",
  "WHERE ARE YOU GOING",
  "WHERE IS THE RESTROOM",
  "WHERE IS THE EXIT",
  "WHERE IS THE ENTRANCE",
  "HOW MUCH DOES IT COST",
  "CAN YOU SHOW ME",
  "I AM DEAF",
  "I CAN READ LIPS",
  "PLEASE LOOK AT ME",
  "I NEED WATER",
  "I NEED FOOD",
  "I NEED A DOCTOR",
  "CALL FOR HELP",
  "I AM LOST",
  "I AM HAPPY",
  "I AM SAD",
  "I AGREE",
  "I DISAGREE",
  "SEE YOU LATER",
  "GOODBYE",
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
    const words = inputText.trim().split(/\s+/).filter(Boolean);

    // Always show starters if input is empty
    if (words.length === 0) {
      setSuggestions(currentStarters);
      previousSentenceRef.current = inputText;
      return;
    }

    if (!smartSuggestions) {
      console.log("[Pipeline] autocomplete skipped");
      setSuggestions([]);
      previousSentenceRef.current = "";
      return;
    }

    // Skip if sentence hasn't changed since last call
    if (inputText === previousSentenceRef.current) return;
    previousSentenceRef.current = inputText;

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
  }, [inputText, smartSuggestions, currentStarters]);

  return { suggestions };
}
