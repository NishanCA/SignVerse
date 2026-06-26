/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../context/LanguageContext";

const floatingEmojis = ["🤟", "👋", "🙌", "👍", "✌️", "🤌", "👐", "🤝", "👏", "🖐️", "👇", "👊", "🤚", "🤞", "🤘", "🫶"];

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      
      {/* Ambient background layers */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px]" />
        {/* Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Floating emojis in background */}
      {mounted && floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl font-black brightness-0 invert opacity-10 select-none pointer-events-none"
          style={{
            left: `${5 + (i * 6)}%`,
            top: `${10 + (i % 4) * 22}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 4 + (i % 5) * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: (i % 3) * 0.4,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-sm w-full z-10"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 blur-xl opacity-50 animate-pulse" />
            {/* Icon body */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl">
              <img src="/app-logo-new.png" alt="SignVerse Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-1">
            <span className="text-gradient">Sign</span>
            <span className="text-white">Verse</span>
          </h1>
        </motion.div>



        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-2 justify-center mb-10"
        >
          {["🤟 Gesture to Speech", "🎙️ Speech to Sign", "🌐 Multi-language", "🤖 Avatar"].map((feat, i) => (
            <motion.span
              key={feat}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-medium"
            >
              {feat}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/language")}
          className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-primary shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:shadow-[0_0_50px_rgba(124,58,237,0.7)] transition-all duration-300 relative overflow-hidden group"
        >
          <span className="relative z-10">Get Started</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-slate-600 text-xs"
        >
          Designed for the deaf & non-verbal community
        </motion.p>
      </motion.div>
    </main>
  );
}
