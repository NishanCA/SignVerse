"use client";

import { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, Video } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ConversationCameraProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  currentGesture: string | null;
  currentHand: "Right" | "Left" | null;
  handsVisible: boolean;
  isSpeaking: boolean;
  micStatus: "idle" | "listening" | "processing";
  /** Visual-only: when false, renders a dark overlay but camera keeps running. */
  webcamVisible: boolean;
}

export default function ConversationCamera({
  videoRef,
  canvasRef,
  currentGesture,
  currentHand,
  handsVisible,
  isSpeaking,
  micStatus,
  webcamVisible,
}: ConversationCameraProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-1 relative bg-black overflow-hidden rounded-2xl border border-white/10">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] rounded-2xl"
      />

      {/* Speaking blur overlay */}
      <div
        className={`absolute inset-0 w-full h-full rounded-2xl transition-all duration-300 pointer-events-none ${
          isSpeaking && !handsVisible ? "backdrop-blur-md bg-black/30" : ""
        }`}
      />

      {/* Landmark canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none rounded-2xl"
      />

      {/* Visual-only webcam hide overlay */}
      {!webcamVisible && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
          <Video className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
        </div>
      )}

      {/* Speaking / Listening overlay */}
      {webcamVisible && isSpeaking && !handsVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/30 backdrop-blur-sm">
          <Mic className="text-cyan-400 animate-pulse w-12 h-12 mb-4" />
          <span className="text-cyan-300 font-bold text-xl tracking-widest animate-pulse">
            {t("conv.listening")}
          </span>
        </div>
      )}

      {/* Hand-type hint labels */}
      {webcamVisible && (
        <div className="absolute top-16 left-4 flex flex-col gap-2 z-10">
          <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-purple-300 border border-purple-500/30">
            ✋ Letters → Right Hand
          </div>
          <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-cyan-300 border border-cyan-500/30">
            🤚 Numbers → Left Hand
          </div>
        </div>
      )}

      {/* Gesture detected / status badge */}
      {webcamVisible && (
        <div className="absolute bottom-4 left-4 right-4 text-center z-10">
          <AnimatePresence mode="wait">
            {currentGesture ? (
              <motion.div
                key={`${currentGesture}-${currentHand}`}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -8 }}
                className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md text-white border ${
                  currentHand === "Right" ? "border-purple-500/50" : "border-cyan-500/50"
                }`}
              >
                <Volume2
                  size={16}
                  className={currentHand === "Right" ? "text-purple-400" : "text-cyan-400"}
                />
                <span className="text-sm opacity-70">
                  {currentGesture && currentGesture.length > 1
                    ? "Suggestion"
                    : currentHand === "Right"
                    ? "Letter"
                    : "Number"}
                  :
                </span>
                <strong
                  className={`text-2xl font-bold tracking-wider ${
                    currentHand === "Right" ? "text-purple-300" : "text-cyan-300"
                  }`}
                >
                  {currentGesture}
                </strong>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-block px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md text-slate-400 text-xs border border-white/10"
              >
                {handsVisible
                  ? t("conv.reading")
                  : micStatus === "listening"
                  ? `🎤 ${t("conv.listening")}`
                  : t("conv.idle")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
