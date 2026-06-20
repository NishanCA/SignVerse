import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use empty turbopack config to silence the Turbopack/webpack mismatch error.
  // All mediapipe and tflite packages are loaded dynamically in browser context.
  turbopack: {},
};

export default nextConfig;
