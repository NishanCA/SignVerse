"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { MessageSquare, BookOpen, Settings, ChevronRight, Award, Flame, History } from "lucide-react";
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
            if (data.fullName) setUserName(data.fullName.split(" ")[0]); // First name
          }
        } catch (err) {
          console.warn("Failed to load user name:", err);
        }
      } else {
        // Try localStorage fallback
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
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <main className="min-h-screen pb-24 md:pt-24 px-6 relative overflow-x-hidden">
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-700/10 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto pt-8">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1">{t("home.welcome")} <span className="text-gradient">{userName}!</span></h1>
          <p className="text-slate-400">{t("home.subtitle")}</p>
        </motion.header>

        {/* Stats Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {[
            { label: t("home.streak"), value: `${stats.streak} Days`, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
            { label: t("home.conversations"), value: stats.conversationCount.toString(), icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="glass-card p-4 flex flex-col items-center justify-center text-center">
              <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon size={20} />
              </div>
              <h3 className="text-lg font-bold">{stat.value}</h3>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Conversation Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/conversation")}
            className="glass-card-hover p-6 cursor-pointer relative overflow-hidden group col-span-1 md:col-span-2"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-purple-500/30 transition-colors" />

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                  <MessageSquare size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t("home.start_conv")}</h2>
                <p className="text-slate-400 max-w-sm mb-6">{t("home.start_conv_desc")}</p>

                <div className="flex items-center text-sm font-bold text-purple-400">
                  {t("home.open_camera")} <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div className="hidden sm:block opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-32 h-32 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                  <img src="/app-logo-new.png" alt="SignVerse Logo" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Learning Section */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/learning")}
            className="glass-card-hover p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <BookOpen size={20} />
              </div>
              <h2 className="text-xl font-bold mb-2">ASL Dictionary</h2>
              <p className="text-slate-400 text-sm mb-4">Explore the complete ASL alphabet, numbers, and common words.</p>
            </div>

            <div>
              <div className="flex items-center text-sm font-bold text-emerald-400 mt-4">
                Open Dictionary <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Settings Section */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/settings")}
            className="glass-card-hover p-6 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center mb-4">
                <Settings size={20} />
              </div>
              <h2 className="text-xl font-bold mb-2">{t("home.preferences")}</h2>
              <p className="text-slate-400 text-sm mb-4">{t("home.preferences_desc")}</p>
            </div>

            <div className="flex items-center text-sm font-bold text-slate-300">
              {t("home.open_settings")} <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </motion.div>

        {/* Conversation History Link */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="mt-8"
        >
          <div
            onClick={() => router.push("/history")}
            className="glass-card-hover p-5 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Conversation History</h3>
                <p className="text-sm text-slate-400">View and manage your past translation logs.</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>
      </div>
    </main>
  );
}
