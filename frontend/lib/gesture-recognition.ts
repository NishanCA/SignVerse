/**
 * gesture-recognition.ts
 *
 * Reverted to use the lightweight backend endpoint for fast inference
 * while offloading device memory.
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

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://signverse-backend.onrender.com";

// Dummy function to prevent errors from useMediaPipe calling it on mount
export async function loadGestureModel() {
  return true; 
}

export async function predictSign(
  flatLandmarks: number[],
  hand_side: string = "Right"
): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landmarks: flatLandmarks,
        hand_side: hand_side,
      }),
    });

    if (!res.ok) {
      console.warn("[Gesture] Server error:", res.status);
      return null;
    }

    const data = await res.json();
    if (data && data.label && data.label !== "?" && data.confidence > 0.5) {
      return data.label;
    }
    return null;
  } catch (err) {
    console.error("[Gesture] Inference API error:", err);
    return null;
  }
}
