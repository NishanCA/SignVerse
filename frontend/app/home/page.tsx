"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { MessageSquare, BookOpen, Settings, ChevronRight, Award, Flame, History, Play } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";
import { userService, UserStats } from "../../lib/userService";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<UserStats>({ streak: 0, conversationCount: 0, lastLoginDate: null });
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    setStats(userService.getStats());

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.fullName) setUserName(data.fullName.split(" ")[0]); 
          }
        } catch (err) {
          console.warn("Failed to load user name:", err);
        }
      } else {
        try {
          const profile = localStorage.getItem("userProfile");
          if (profile) {
            const data = JSON.parse(profile);
            if (data.fullName) setUserName(data.fullName.split(" ")[0]);
          }
        } catch { }
      }
    });

    return () => unsubscribe();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pb-24 md:pt-24 px-6">
      <Navbar />

      <div className="max-w-2xl mx-auto pt-8 md:pt-4">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-10"
        >
          <h1 className="heading-xl text-[var(--text-primary)] mb-2">
            {t("home.welcome") || "Welcome,"} <span className="text-[var(--accent-blue)]">{userName}</span>
          </h1>
          <p className="body-base text-[var(--text-secondary)]">
            {t("home.subtitle") || "Ready to break communication barriers?"}
          </p>
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6"
        >
          {/* Stats Row */}
          <motion.div variants={itemVariants} className="flex gap-4">
            {[
              { label: t("home.streak") || "Day Streak", value: stats.streak, icon: Flame, color: "var(--accent-red)" },
              { label: t("home.conversations") || "Sessions", value: stats.conversationCount, icon: MessageSquare, color: "var(--accent-blue)" },
            ].map((stat, i) => (
              <div key={i} className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-xl bg-[var(--bg-secondary)]" style={{ color: stat.color }}>
                    <stat.icon size={18} />
                  </div>
                  <span className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Primary Action: Conversation */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push("/conversation")}
            className="cursor-pointer bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-md group outline-none focus-ring"
            role="button"
            tabIndex={0}
          >
            <div className="mb-6 sm:mb-0">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--bg-primary)] text-[var(--text-primary)] mb-4 shadow-sm">
                <Play size={20} className="ml-1" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {t("home.start_conv") || "Start Conversation"}
              </h2>
              <p className="text-[var(--bg-secondary)] opacity-80 max-w-xs text-sm leading-relaxed">
                {t("home.start_conv_desc") || "Open the camera to begin translating sign language in real-time."}
              </p>
            </div>
            <div className="flex items-center gap-2 font-medium bg-[var(--bg-primary)]/10 px-4 py-2.5 rounded-xl group-hover:bg-[var(--bg-primary)]/20 transition-colors">
              <span className="text-sm">{t("home.open_camera") || "Launch"}</span>
              <ChevronRight size={16} />
            </div>
          </motion.div>

          {/* Secondary Actions List */}
          <motion.div variants={itemVariants} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm flex flex-col mt-2">
            
            <div 
              onClick={() => router.push("/learning")}
              className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--accent-green)]">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">ASL Dictionary</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">Explore alphabet and common words.</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </div>

            <div 
              onClick={() => router.push("/history")}
              className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--accent-blue)]">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">Conversation History</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">View and manage past translations.</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </div>

            <div 
              onClick={() => router.push("/settings")}
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{t("home.preferences") || "Preferences"}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{t("home.preferences_desc") || "Manage application settings."}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
            </div>

          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
