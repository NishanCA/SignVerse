/**
 * gesture-recognition.ts
 *
 * MediaPipe Hands runs entirely in the browser (fast, no lag).
 * The 42 landmark floats are sent to the Python FastAPI backend
 * which runs the SAME TFLite model as app.py — guaranteeing identical results.
 *
 * No browser-side TFLite needed → no WASM issues, no CDN failures.
 */

import { BACKEND_URL } from "./config";

// ── Throttle /api/classify to max 2.5 requests/sec (400 ms gate) ──────────
// This only limits backend HTTP calls. It does NOT block gesture detection
// or UI updates — those happen every frame regardless.
let lastClassificationTime = 0;
const CLASSIFY_THROTTLE_MS = 400;

// ── NOTE: Duplicate gesture dedup (1000 ms) WAS HERE but was removed. ─────
// The gesture state machine in useConversationEngine depends on receiving
// onGestureDetected on every classify result so hold-timers can accumulate.
// Deduplication at this layer prevents the state machine from ever confirming
// a held gesture, breaking letter printing entirely. Dedup is intentionally
// NOT applied here.

/**
 * Normalises hand landmarks exactly as Python's pre_process_landmark():
 *  1. Convert [0-1] relative coords → pixel coords
 *  2. Shift so wrist (landmark 0) is the origin
 *  3. Flatten to 1-D array of 42 values
 *  4. Divide every value by max-absolute-value → range [-1, 1]
 */
export function preProcessLandmark(
  landmarks: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number
): number[] {
  const pts = landmarks.map((lm) => ({
    x: Math.min(Math.floor(lm.x * imageWidth), imageWidth - 1),
    y: Math.min(Math.floor(lm.y * imageHeight), imageHeight - 1),
  }));

  const baseX = pts[0].x;
  const baseY = pts[0].y;
  const shifted = pts.map((p) => ({ x: p.x - baseX, y: p.y - baseY }));

  const flat: number[] = [];
  shifted.forEach((p) => flat.push(p.x, p.y));

  const maxVal = Math.max(...flat.map(Math.abs));
  if (maxVal === 0) return flat;
  return flat.map((n) => n / maxVal);
}

/**
 * Send 42 landmark floats + hand side to the backend.
 * - hand_side "Right" → keypoint classifier → letters / Delete
 * - hand_side "Left"  → number classifier  → 0-9
 * Returns null if confidence < 0.5, throttled, or request fails.
 *
 * Throttled to 400 ms between HTTP calls — backend protection only.
 * Gesture outputs are NOT deduplicated here; the state machine in
 * useConversationEngine handles repeated gestures for hold-to-print.
 */
export async function predictSign(
  flatLandmarks: number[],
  hand_side: string = "Right"
): Promise<string | null> {
  const now = Date.now();

  // Throttle: limit backend HTTP calls, but emit null so classifyPendingRef
  // is released immediately and next frames can still be processed.
  if (now - lastClassificationTime < CLASSIFY_THROTTLE_MS) {
    console.log("[Gesture] skipped: throttle (backend rate limit, not blocking state machine)");
    return null;
  }
  lastClassificationTime = now;

  try {
    const res = await fetch(`${BACKEND_URL}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks: flatLandmarks, hand_side }),
    });
    if (!res.ok) {
      console.log("[Gesture] skipped: backend returned", res.status);
      return null;
    }
    const data = await res.json();

    if (data.confidence < 0.5) {
      console.log("[Gesture] skipped: low confidence", data.confidence?.toFixed(2));
      return null;
    }

    const label = data.label as string;
    console.log("[Gesture] predicted:", label, "confidence:", data.confidence?.toFixed(2));
    return label;
  } catch (err) {
    console.log("[Gesture] skipped: fetch error", err);
    return null;
  }
}

/** No-op: kept for API compatibility. Model is loaded on the backend. */
export async function loadGestureModel() {
  return true;
}
