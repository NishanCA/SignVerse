"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../lib/firebase";
import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !loading) {
        setLoading(true);
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.profileComplete && userData.settingsComplete) {
              router.push("/home");
            } else if (userData.profileComplete && !userData.settingsComplete) {
              router.push("/settings");
            } else {
              router.push("/profile");
            }
          } else {
            router.push("/profile");
          }
        } catch (err) {
          console.error("Auto-login failed:", err);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router, loading]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.profileComplete && userData.settingsComplete) {
          router.push("/home");
        } else if (userData.profileComplete && !userData.settingsComplete) {
          router.push("/settings");
        } else {
          router.push("/profile");
        }
      } else {
        router.push("/profile");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center relative px-6">
      <header className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5 shadow-sm mb-8">
           <img src="/app-logo-new.png" alt="SignVerse Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        
        <h2 className="heading-lg mb-2 text-center text-[var(--text-primary)]">
          {t("login.title") || "Sign In"}
        </h2>
        <p className="body-sm text-[var(--text-secondary)] text-center mb-8">
          {t("login.subtitle") || "Continue to SignVerse"}
        </p>

        {error && (
          <div className="w-full p-3 mb-6 bg-[var(--accent-red)] bg-opacity-10 border border-[var(--accent-red)] border-opacity-20 rounded-xl text-[var(--accent-red)] text-sm text-center">
            {error}
          </div>
        )}

        <div className="w-full mb-6 flex items-center justify-center gap-3">
          <button 
            type="button"
            className="flex items-center gap-2 outline-none focus-ring rounded-sm group"
            onClick={() => setRememberMe(!rememberMe)}
            aria-checked={rememberMe}
            role="checkbox"
          >
            <div 
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--border-strong)] group-hover:border-[var(--text-primary)]'}`}
            >
              {rememberMe && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4L4 7L9 1" stroke="var(--bg-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors select-none">
              Remember me
            </span>
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl surface-elevated border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium text-base flex items-center justify-center gap-3 transition-shadow hover:shadow-md disabled:opacity-50 focus-ring"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("login.continue") || "Continue with Google"}
            </>
          )}
        </motion.button>
      </motion.div>
    </main>
  );
}
