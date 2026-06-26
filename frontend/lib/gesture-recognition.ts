/**
 * gesture-recognition.ts
 *
 * MediaPipe Hands runs entirely in the browser (fast, no lag).
 * The 42 landmark floats are now processed entirely locally via
 * TensorFlow.js TFLite, eliminating backend lag and timeouts.
 */

let kpModel: any = null;
let nbModel: any = null;
let keypointLabels: string[] = [];
let numberLabels: string[] = [];

let modelsLoaded = false;
let modelsLoading = false;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}


export async function loadGestureModel() {
  if (modelsLoaded || modelsLoading) return true;
  modelsLoading = true;
  try {
    // Load TF and TFLite from CDN
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/tf-tflite.min.js');

    const tf = (window as any).tf;
    const tflite = (window as any).tflite;

    // Set WASM path to a fast CDN
    tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');

    // Load models
    kpModel = await tflite.loadTFLiteModel('/models/keypoint_classifier.tflite');
    nbModel = await tflite.loadTFLiteModel('/models/number_classifier.tflite');

    // Load labels
    const res = await fetch('/models/labels.json');
    const data = await res.json();
    keypointLabels = data.keypoint || [];
    numberLabels = data.number || [];

    modelsLoaded = true;
    console.log("[Gesture] TFJS TFLite models loaded successfully!");
    return true;
  } catch (err) {
    console.error("[Gesture] Failed to load local TFLite models:", err);
    return false;
  } finally {
    modelsLoading = false;
  }
}

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

export async function predictSign(
  flatLandmarks: number[],
  hand_side: string = "Right"
): Promise<string | null> {
  if (!modelsLoaded) return null;

  try {
    const tf = (window as any).tf;
    const tensor = tf.tensor([flatLandmarks], [1, 42], 'float32');
    let outputTensor: any;
    let labels: string[];

    if (hand_side === "Right") {
      if (!kpModel) return null;
      outputTensor = kpModel.predict(tensor);
      labels = keypointLabels;
    } else {
      if (!nbModel) return null;
      outputTensor = nbModel.predict(tensor);
      labels = numberLabels;
    }

    const outputData = await outputTensor.data();
    tensor.dispose();
    outputTensor.dispose();

    // Find the max value and index
    let maxIdx = 0;
    let maxVal = outputData[0];
    for (let i = 1; i < outputData.length; i++) {
      if (outputData[i] > maxVal) {
        maxVal = outputData[i];
        maxIdx = i;
      }
    }

    if (maxVal < 0.5) {
      return null;
    }

    const label = labels[maxIdx] || "?";
    return label;
  } catch (err) {
    console.error("[Gesture] Inference error:", err);
    return null;
  }
}
