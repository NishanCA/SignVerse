/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../context/LanguageContext";
import { Sparkles, ArrowRight } from "lucide-react";

export default function WelcomeScreen() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    
    // Auto-login logic
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.profileComplete && userData.settingsComplete) {
              router.push("/home");
            }
          }
        } catch (err) {
          console.error("Auto-login failed:", err);
        }
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Subtle ambient light at top corner */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-blue)] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {/* Elegant Logo / Mark */}
          <div className="flex justify-center mb-12">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-center p-2"
            >
              <img src="/app-logo-new.png" alt="SignVerse Logo" className="w-full h-full object-cover rounded-xl" />
            </motion.div>
          </div>

          {/* Typography */}
          <div className="text-center mb-12">
            <h1 className="heading-xl mb-4 font-semibold">
              SignVerse
            </h1>
            <p className="body-base text-[var(--text-secondary)] max-w-sm mx-auto">
              Breaking communication barriers with real-time sign language assistance.
            </p>
          </div>

          {/* Feature List (Sleek Apple/Linear style) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col gap-3 mb-12"
          >
            {[
              { icon: "🤟", label: "Gesture to Speech" },
              { icon: "🎙️", label: "Speech to Sign" },
              { icon: "🤖", label: "Real-time Avatar" }
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl surface-secondary border border-[var(--border-subtle)]">
                <div className="w-10 h-10 rounded-lg surface-elevated flex items-center justify-center shadow-sm border border-[var(--border-subtle)] text-lg">
                  {feat.icon}
                </div>
                <span className="font-medium text-[var(--text-primary)]">{feat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Call to action */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/language")}
            className="w-full py-3.5 px-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium text-base flex items-center justify-center gap-2 shadow-sm transition-transform"
          >
            <span>Get Started</span>
            <ArrowRight size={18} className="opacity-70" />
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
