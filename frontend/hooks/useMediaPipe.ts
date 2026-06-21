/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { preProcessLandmark, predictSign } from "../lib/gesture-recognition";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseMediaPipeOptions {
  onGestureDetected: (sign: string, handSide: string) => void;
  onHandPresent: () => void;
  /** Called after exactly 2000 ms of no hand detected. */
  onHandAbsent: () => void;
  suggestions?: string[];
  smartSuggestions?: boolean;
  gestureSensitivity?: number;
}

const HAND_ABSENT_DELAY_MS = 2000;

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export function useMediaPipe({
  onGestureDetected,
  onHandPresent,
  onHandAbsent,
  suggestions = [],
  smartSuggestions = false,
  gestureSensitivity = 0.75,
}: UseMediaPipeOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const classifyPendingRef = useRef(false);
  const handAbsentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handPresentRef = useRef(false);
  const twoHandsStartTimeRef = useRef<number | null>(null);
  const twoHandsTargetRef = useRef<number | null>(null);

  // Keep callbacks in refs so MediaPipe closure never becomes stale
  const onGestureDetectedRef = useRef(onGestureDetected);
  const onHandPresentRef = useRef(onHandPresent);
  const onHandAbsentRef = useRef(onHandAbsent);
  const suggestionsRef = useRef(suggestions);
  const smartSuggestionsRef = useRef(smartSuggestions);
  const gestureSensitivityRef = useRef(gestureSensitivity);

  useEffect(() => { onGestureDetectedRef.current = onGestureDetected; });
  useEffect(() => { onHandPresentRef.current = onHandPresent; });
  useEffect(() => { onHandAbsentRef.current = onHandAbsent; });
  useEffect(() => { suggestionsRef.current = suggestions; });
  useEffect(() => { smartSuggestionsRef.current = smartSuggestions; });
  useEffect(() => { gestureSensitivityRef.current = gestureSensitivity; });

  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [currentHand, setCurrentHand] = useState<"Right" | "Left" | null>(null);
  const [handsVisible, setHandsVisible] = useState(false);

  // ── Draw skeleton ──────────────────────────────────────────────────────────
  const drawLandmarks = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!results.multiHandLandmarks) return;

    results.multiHandLandmarks.forEach((lms: any[], hi: number) => {
      const originalSide = results.multiHandedness?.[hi]?.label;
      // Swap side to match Python cv.flip laterally inverted behaviour
      const side =
        originalSide === "Right" ? "Left"
        : originalSide === "Left" ? "Right"
        : originalSide;

      const lineColor = side === "Right" ? "rgba(168,85,247,0.9)" : "rgba(34,211,238,0.9)";
      const dotColor = side === "Right" ? "#a855f7" : "#22d3ee";

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(lms[a].x * canvas.width, lms[a].y * canvas.height);
        ctx.lineTo(lms[b].x * canvas.width, lms[b].y * canvas.height);
        ctx.stroke();
      });
      lms.forEach((lm: any, i: number) => {
        const r = [0, 4, 8, 12, 16, 20].includes(i) ? 6 : 4;
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

  // ── Hand presence change ───────────────────────────────────────────────────
  const handleHandPresenceChange = useCallback((detected: boolean) => {
    setHandsVisible(detected);

    if (detected) {
      // Cancel any pending absent timer
      if (handAbsentTimerRef.current) {
        clearTimeout(handAbsentTimerRef.current);
        handAbsentTimerRef.current = null;
      }
      if (!handPresentRef.current) {
        handPresentRef.current = true;
        onHandPresentRef.current();
      }
    } else {
      if (handPresentRef.current) {
        handPresentRef.current = false;
        // Wait exactly 2000 ms before firing onHandAbsent
        handAbsentTimerRef.current = setTimeout(() => {
          handAbsentTimerRef.current = null;
          onHandAbsentRef.current();
        }, HAND_ABSENT_DELAY_MS);
      }
    }
  }, []);

  // ── MediaPipe results handler ──────────────────────────────────────────────
  const onResults = useCallback(async (results: any, cancelled: { value: boolean }) => {
    if (cancelled.value) return;
    drawLandmarks(results);

    const hasHands = !!(results.multiHandLandmarks?.length);
    handleHandPresenceChange(hasHands);

    if (!hasHands) {
      setCurrentGesture(null);
      setCurrentHand(null);
      twoHandsStartTimeRef.current = null;
      return;
    }

    // ── Two-hand smart suggestion mode ────────────────────────────────────
    if (results.multiHandLandmarks.length >= 2 && smartSuggestionsRef.current) {
      let leftHandLms = null;
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const originalSide = results.multiHandedness?.[i]?.label;
        const handSide =
          originalSide === "Right" ? "Left"
          : originalSide === "Left" ? "Right"
          : originalSide;
        if (handSide === "Left") {
          leftHandLms = results.multiHandLandmarks[i].map((lm: any) => ({ ...lm, x: 1 - lm.x }));
          break;
        }
      }

      if (leftHandLms && !classifyPendingRef.current && suggestionsRef.current.length > 0) {
        classifyPendingRef.current = true;
        try {
          const w = results.image?.width || videoRef.current?.videoWidth || 640;
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
            setCurrentGesture(suggestionText);
            setCurrentHand("Left");

            if (twoHandsTargetRef.current !== targetIndex) {
              twoHandsStartTimeRef.current = Date.now();
              twoHandsTargetRef.current = targetIndex;
            } else {
              const heldTime = (Date.now() - (twoHandsStartTimeRef.current || Date.now())) / 1000;
              if (heldTime > gestureSensitivityRef.current) {
                onGestureDetectedRef.current(suggestionText, "suggestion");
                twoHandsStartTimeRef.current = null;
                twoHandsTargetRef.current = null;
              }
            }
          } else {
            twoHandsStartTimeRef.current = null;
            twoHandsTargetRef.current = null;
            setCurrentGesture(null);
            setCurrentHand(null);
          }
        } catch {
          // classification failed — silent
        } finally {
          classifyPendingRef.current = false;
        }
      } else if (!leftHandLms) {
        twoHandsStartTimeRef.current = null;
        twoHandsTargetRef.current = null;
      }
      return; // skip single-hand when two hands present
    } else {
      twoHandsStartTimeRef.current = null;
      twoHandsTargetRef.current = null;
    }

    // ── Single hand processing ────────────────────────────────────────────
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const originalLms = results.multiHandLandmarks[i];
      const originalSide = results.multiHandedness?.[i]?.label;
      const lms = originalLms.map((lm: any) => ({ ...lm, x: 1 - lm.x }));
      const handSide = (
        originalSide === "Right" ? "Left"
        : originalSide === "Left" ? "Right"
        : originalSide
      ) as "Right" | "Left";

      const w = results.image?.width || videoRef.current?.videoWidth || 640;
      const h = results.image?.height || videoRef.current?.videoHeight || 480;

      if (classifyPendingRef.current) continue;
      classifyPendingRef.current = true;

      try {
        const flat = preProcessLandmark(lms, w, h);
        const sign = await predictSign(flat, handSide);
        if (!cancelled.value && sign) {
          setCurrentGesture(sign);
          setCurrentHand(handSide);
          onGestureDetectedRef.current(sign, handSide);
        }
      } finally {
        classifyPendingRef.current = false;
      }
    }
  }, [drawLandmarks, handleHandPresenceChange]);

  // ── MediaPipe init (runs once on mount, never restarts) ───────────────────
  useEffect(() => {
    const cancelled = { value: false };

    async function init() {
      if (!videoRef.current) return;
      try {
        const { Hands } = await import("@mediapipe/hands");
        const { Camera } = await import("@mediapipe/camera_utils");
        if (cancelled.value) return;

        const hands = new Hands({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
        });
        handsRef.current = hands;

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => onResults(results, cancelled));

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && !cancelled.value) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current = camera;

        if (cancelled.value) return;
        await camera.start();
        console.log("[useMediaPipe] Hands ready");
      } catch (err) {
        console.error("[useMediaPipe] init error:", err);
      }
    }

    init();

    return () => {
      cancelled.value = true;
      cameraRef.current?.stop();
      cameraRef.current = null;
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      if (handAbsentTimerRef.current) {
        clearTimeout(handAbsentTimerRef.current);
        handAbsentTimerRef.current = null;
      }
    };
  }, []); // ← empty deps: starts on mount, cleans up on unmount. Never restarts.

  return { videoRef, canvasRef, currentGesture, currentHand, handsVisible };
}
