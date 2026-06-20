"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, BookOpen, Settings, User } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { name: t("nav.home"), href: "/home", icon: Home },
    { name: t("nav.conversation"), href: "/conversation", icon: MessageSquare },
    { name: t("nav.learning"), href: "/learning", icon: BookOpen },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
    { name: t("nav.profile"), href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass-card px-2 py-3 flex justify-between items-center bg-slate-900/80"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="relative flex flex-col items-center justify-center w-14 h-12">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative z-10 flex flex-col items-center justify-center transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <item.icon size={20} className={isActive ? "text-purple-400" : ""} />
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
              </motion.div>
              {isActive && (
                <motion.div 
                  layoutId="mobile-active-nav"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </motion.nav>

      {/* Desktop Top/Side Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass px-6 py-4 justify-between items-center bg-slate-900/60"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-purple-500/20 flex-shrink-0">
            <img src="/app-logo-new.png" alt="SignVerse Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg text-white">SignVerse</span>
        </div>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="relative px-4 py-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative z-10 flex items-center gap-2 transition-colors ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <item.icon size={18} className={isActive ? "text-purple-400" : ""} />
                  <span className="text-sm font-medium">{item.name}</span>
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="desktop-active-nav"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/5"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
