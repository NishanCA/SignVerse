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
  // FIX 2: wrapped in try/catch so a canvas error never kills the results loop
  const drawLandmarks = useCallback((results: any) => {
    try {
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
    } catch (err) {
      console.error("[MediaPipe] drawLandmarks error:", err);
    }
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
  // FIX 2: entire body wrapped in try/catch — no exception can freeze the loop.
  // FIX 3: onResults is SYNCHRONOUS. All async classify calls use .then/.catch/.finally
  //         so they never block MediaPipe's internal frame pipeline.
  const onResults = useCallback((results: any, cancelled: { value: boolean }) => {
    if (cancelled.value) return;

    try {
      drawLandmarks(results);

      const hasHands = !!(results.multiHandLandmarks?.length);
      handleHandPresenceChange(hasHands);

      if (!hasHands) {
        setCurrentGesture(null);
        setCurrentHand(null);
        twoHandsStartTimeRef.current = null;
        return;
      }

      // ── Two-hand smart suggestion mode ──────────────────────────────────
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
          const w = results.image?.width || videoRef.current?.videoWidth || 640;
          const h = results.image?.height || videoRef.current?.videoHeight || 480;

          // FIX 3: non-blocking — returns immediately, MediaPipe continues
          try {
            const flat = preProcessLandmark(leftHandLms, w, h);
            predictSign(flat, "Left")
              .then((sign) => {
                if (cancelled.value) return;
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
                      console.log("[Gesture] emitted (suggestion):", suggestionText);
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
              })
              .catch((err) => {
                console.error("[MediaPipe] onResults error (two-hand classify):", err);
              })
              .finally(() => {
                classifyPendingRef.current = false;
              });
          } catch (err) {
            console.error("[MediaPipe] onResults error (two-hand preprocess):", err);
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

      // ── Single hand processing ──────────────────────────────────────────
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

        // FIX 3: non-blocking — returns immediately, MediaPipe continues
        try {
          const flat = preProcessLandmark(lms, w, h);
          predictSign(flat, handSide)
            .then((sign) => {
              if (!cancelled.value && sign) {
                console.log("[Gesture] emitted:", sign, handSide);
                setCurrentGesture(sign);
                setCurrentHand(handSide);
                onGestureDetectedRef.current(sign, handSide);
              }
            })
            .catch((err) => {
              console.error("[MediaPipe] onResults error (single-hand classify):", err);
            })
            .finally(() => {
              classifyPendingRef.current = false;
            });
        } catch (err) {
          console.error("[MediaPipe] onResults error (single-hand preprocess):", err);
          classifyPendingRef.current = false;
        }
      }
    } catch (err) {
      // FIX 7: catch-all — any uncaught exception is logged, processing continues next frame
      console.error("[MediaPipe] onResults error:", err);
    }
  }, [drawLandmarks, handleHandPresenceChange]);

  // ── MediaPipe init (runs once on mount, never restarts) ───────────────────
  useEffect(() => {
    const cancelled = { value: false };

    async function init() {
      if (!videoRef.current) return;

      // FIX 4: Prevent duplicate Hands instances
      if (handsRef.current) {
        console.warn("[MediaPipe] Hands instance already exists, skipping duplicate init");
        return;
      }
      // FIX 5: Prevent duplicate Camera instances
      if (cameraRef.current) {
        console.warn("[MediaPipe] Camera instance already exists, skipping duplicate init");
        return;
      }

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
          // FIX 1: hands.send wrapped in try/catch — exception never kills the frame loop
          onFrame: async () => {
            if (!videoRef.current || cancelled.value) return;
            try {
              await hands.send({ image: videoRef.current });
            } catch (err) {
              console.error("[MediaPipe] hands.send crashed:", err);
            }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current = camera;

        if (cancelled.value) return;
        await camera.start();
        console.log("[MediaPipe] initialized");
      } catch (err) {
        console.error("[MediaPipe] init error:", err);
      }
    }

    init();

    // FIX 6: Strengthened cleanup — destroys every resource on unmount
    return () => {
      console.log("[MediaPipe] cleanup");
      cancelled.value = true;

      // 1. Stop Camera
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
          console.log("[MediaPipe] camera stopped");
        } catch (err) {
          console.error("[MediaPipe] camera stop error:", err);
        }
        cameraRef.current = null;
      }

      // 2. Destroy webcam stream tracks (releases hardware)
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        try {
          stream.getTracks().forEach((track) => track.stop());
          console.log("[MediaPipe] stream destroyed");
        } catch (err) {
          console.error("[MediaPipe] stream destroy error:", err);
        }
      }

      // 3. Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // 4. Close Hands safely — capture ref then null it before closing
      //    so any in-flight onResults sees handsRef.current = null
      const hands = handsRef.current;
      handsRef.current = null;
      if (hands) {
        Promise.resolve(hands.close())
          .then(() => console.log("[MediaPipe] hands closed"))
          .catch(console.error);
      }

      // 5. Clear all timers
      if (handAbsentTimerRef.current) {
        clearTimeout(handAbsentTimerRef.current);
        handAbsentTimerRef.current = null;
      }

      // 6. Reset classify gate so next mount starts clean
      classifyPendingRef.current = false;
      handPresentRef.current = false;
    };
  }, []); // ← empty deps: starts on mount, cleans up on unmount. Never restarts.

  return { videoRef, canvasRef, currentGesture, currentHand, handsVisible };
}
