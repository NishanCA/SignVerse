/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";

interface AvatarProps {
  signingText?: string;
  isActive?: boolean;
}

const GESTURE_POSES: Record<string, { color: string }> = {
  A: { color: "#a78bfa" },
  B: { color: "#60a5fa" },
  C: { color: "#34d399" },
  D: { color: "#fbbf24" },
  E: { color: "#f87171" },
  F: { color: "#c084fc" },
  G: { color: "#38bdf8" },
  H: { color: "#4ade80" },
  I: { color: "#fb923c" },
  J: { color: "#e879f9" },
  K: { color: "#22d3ee" },
  L: { color: "#a3e635" },
  M: { color: "#facc15" },
  N: { color: "#818cf8" },
  O: { color: "#f472b6" },
  P: { color: "#34d399" },
  Q: { color: "#94a3b8" },
  R: { color: "#fcd34d" },
  S: { color: "#c4b5fd" },
  T: { color: "#67e8f9" },
  U: { color: "#86efac" },
  V: { color: "#fda4af" },
  W: { color: "#d8b4fe" },
  X: { color: "#f9a8d4" },
  Y: { color: "#a5f3fc" },
  Z: { color: "#bef264" },
};

export default function Avatar2D({ signingText, isActive = false }: AvatarProps) {
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [letterQueue, setLetterQueue] = useState<string[]>([]);
  const [bodyPose, setBodyPose] = useState<"idle" | "signing">("idle");

  useEffect(() => {
    if (!signingText) return;
    const letters = signingText.toUpperCase().split("").filter(l => GESTURE_POSES[l]);
    setLetterQueue(letters);
    setBodyPose("signing");
  }, [signingText]);

  useEffect(() => {
    if (letterQueue.length === 0) {
      setCurrentLetter(null);
      setBodyPose("idle");
      return;
    }
    
    const letter = letterQueue[0];
    setCurrentLetter(letter);

    const timer = setTimeout(() => {
      setLetterQueue(prev => prev.slice(1));
    }, 700);

    return () => clearTimeout(timer);
  }, [letterQueue]);

  const pose = currentLetter ? GESTURE_POSES[currentLetter] : null;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full gap-6 select-none">
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 left-0 right-0 flex justify-center z-10"
          >
            <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Ready to Sign
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={bodyPose === "signing" ? { y: [0, -8, 0] } : { y: [0, -4, 0] }}
        transition={
          bodyPose === "signing"
            ? { duration: 0.5, repeat: Infinity }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative flex items-center justify-center w-64 h-64"
      >
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-40 transition-colors duration-500"
          style={{ background: pose?.color ?? "#6366f1" }}
        />

        <AnimatePresence mode="wait">
          {pose && currentLetter ? (
            <motion.div
              key={currentLetter}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 20 }}
              className="relative z-10 w-full h-full rounded-3xl overflow-hidden border-4"
              style={{ borderColor: `${pose.color}88`, boxShadow: `0 0 30px ${pose.color}44` }}
            >
              <Image
                src={`/asl/${currentLetter}.jpg`}
                alt={`ASL sign for ${currentLetter}`}
                fill
                className="object-cover"
                unoptimized
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 text-[100px] leading-none opacity-20 grayscale"
            >
              ✋
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {currentLetter ? (
          <motion.div
            key={`letter-${currentLetter}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="text-6xl font-black tracking-widest"
              style={{ color: pose?.color ?? "#a78bfa" }}
            >
              {currentLetter}
            </div>
            <div className="flex gap-1.5 mt-2">
              {letterQueue.map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="idle-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-500 font-medium tracking-widest uppercase"
          >
            Sign Avatar
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
