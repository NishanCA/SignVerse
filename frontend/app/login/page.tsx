"use client";

import { motion } from "framer-motion";
import { ChevronLeft, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../lib/firebase";
import { useState } from "react";

import { useLanguage } from "../../context/LanguageContext";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      // Check if we are using the dummy key (or no key)
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "AIzaSyDummyKey") {
        // Mock login for demo purposes to test the app flow
        setTimeout(() => {
          router.push("/profile");
        }, 1000);
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user profile exists in Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        if (userData.profileComplete && userData.settingsComplete) {
          // Both profile and settings are done → go to home
          router.push("/home");
        } else if (userData.profileComplete && !userData.settingsComplete) {
          // Profile done but settings not → go to settings
          router.push("/settings");
        } else {
          // Profile not complete → go to profile
          router.push("/profile");
        }
      } else {
        // Brand new user — go to profile setup
        router.push("/profile");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="absolute top-6 left-6">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <LogIn size={40} className="text-purple-400" />
        </div>
        
        <h2 className="text-3xl font-bold mb-2">{t("login.title")}</h2>
        <p className="text-slate-400 text-center mb-8">
          {t("login.subtitle")}
        </p>

        {error && (
          <div className="w-full p-3 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl bg-white text-slate-900 font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-slate-100 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("login.continue")}
            </>
          )}
        </motion.button>
      </motion.div>
    </main>
  );
}
