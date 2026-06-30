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
    <div className="flex-1 relative bg-black overflow-hidden rounded-3xl border border-[var(--border-subtle)] shadow-sm">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] rounded-3xl"
      />

      {/* Speaking blur overlay */}
      <div
        className={`absolute inset-0 w-full h-full rounded-3xl transition-all duration-500 pointer-events-none ${
          isSpeaking && !handsVisible ? "backdrop-blur-xl bg-black/40" : ""
        }`}
      />

      {/* Landmark canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none rounded-3xl"
      />

      {/* Visual-only webcam hide overlay */}
      <AnimatePresence>
        {!webcamVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg-primary)]/90 backdrop-blur-md rounded-3xl"
          >
            <Video className="w-12 h-12 text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[var(--text-secondary)]">Camera is off</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking / Listening overlay */}
      <AnimatePresence>
        {webcamVisible && isSpeaking && !handsVisible && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
          >
            <div className="w-24 h-24 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-blue)]/30 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-[var(--accent-blue)]/40 flex items-center justify-center backdrop-blur-md border border-[var(--accent-blue)]/50">
                <Mic className="text-[var(--bg-primary)]" size={32} />
              </div>
            </div>
            <span className="text-[var(--text-primary)] font-semibold text-xl tracking-tight drop-shadow-md">
              {t("conv.listening") || "Listening..."}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand-type hint labels */}
      {webcamVisible && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/10 shadow-sm">
            <span className="mr-1.5 opacity-80">✋</span> Letters → Right Hand
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/10 shadow-sm">
            <span className="mr-1.5 opacity-80">🤚</span> Numbers → Left Hand
          </div>
        </div>
      )}

      {/* Gesture detected / status badge */}
      {webcamVisible && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <AnimatePresence mode="wait">
            {currentGesture ? (
              <motion.div
                key={`${currentGesture}-${currentHand}`}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/50 backdrop-blur-xl text-white border shadow-lg ${
                  currentHand === "Right" ? "border-purple-500/30" : "border-blue-500/30"
                }`}
              >
                <div className={`p-1.5 rounded-full ${currentHand === "Right" ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300"}`}>
                  <Volume2 size={16} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium opacity-70 uppercase tracking-wider">
                    {currentGesture && currentGesture.length > 1
                      ? "Suggestion"
                      : currentHand === "Right"
                      ? "Letter"
                      : "Number"}
                  </span>
                  <strong className={`text-xl font-bold tracking-tight ${
                    currentHand === "Right" ? "text-purple-200" : "text-blue-200"
                  }`}>
                    {currentGesture}
                  </strong>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md text-white/70 text-xs font-medium border border-white/10 shadow-sm"
              >
                {handsVisible
                  ? (t("conv.reading") || "Reading hands...")
                  : micStatus === "listening"
                  ? (
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-pulse" />
                      {t("conv.listening") || "Listening"}
                    </span>
                  )
                  : (t("conv.idle") || "Ready")}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
