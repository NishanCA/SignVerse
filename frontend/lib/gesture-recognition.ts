/**
 * gesture-recognition.ts
 *
 * MediaPipe Hands runs entirely in the browser (fast, no lag).
 * The 42 landmark floats are sent to the Python FastAPI backend
 * which runs the SAME TFLite model as app.py — guaranteeing identical results.
 *
 * No browser-side TFLite needed → no WASM issues, no CDN failures.
 */

const BACKEND = "http://localhost:8000";

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
 * Returns null if confidence < 0.5 or request fails.
 */
export async function predictSign(flatLandmarks: number[], hand_side: string = "Right"): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks: flatLandmarks, hand_side }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.confidence < 0.5) return null;
    return data.label as string;
  } catch {
    return null;
  }
}

/** No-op: kept for API compatibility. Model is loaded on the backend. */
export async function loadGestureModel() {
  return true;
}
