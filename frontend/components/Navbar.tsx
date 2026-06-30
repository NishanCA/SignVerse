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

  // Hidden on welcome, login, permissions screens usually, but we assume page structure handles this.
  
  return (
    <>
      {/* Mobile Bottom Navigation (Floating Dock style) */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-panel px-3 py-3 flex justify-between items-center rounded-2xl shadow-lg w-[90%] max-w-sm"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="relative flex flex-col items-center justify-center w-12 h-12">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative z-10 flex flex-col items-center justify-center transition-colors ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
              >
                <item.icon size={22} className={isActive ? "text-[var(--accent-blue)]" : ""} />
                <span className="text-[9px] mt-1 font-medium">{item.name}</span>
              </motion.div>
              {isActive && (
                <motion.div 
                  layoutId="mobile-active-nav"
                  className="absolute inset-0 bg-[var(--text-primary)] opacity-[0.04] rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </motion.nav>

      {/* Desktop Top/Side Navigation (Sleek Apple/Arc style) */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass-panel px-8 py-3 justify-between items-center border-b border-[var(--border-subtle)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border-subtle)]">
            <img src="/app-logo-new.png" alt="SignVerse Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-base text-[var(--text-primary)] tracking-tight">SignVerse</span>
        </div>

        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-subtle)] shadow-sm">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="relative px-4 py-1.5 rounded-lg outline-none focus-ring">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative z-10 flex items-center gap-2 transition-colors ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  <item.icon size={16} className={isActive ? "text-[var(--accent-blue)]" : ""} />
                  <span className="text-sm font-medium">{item.name}</span>
                </motion.div>
                {isActive && (
                  <motion.div 
                    layoutId="desktop-active-nav"
                    className="absolute inset-0 bg-[var(--bg-elevated)] rounded-lg shadow-sm border border-[var(--border-subtle)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
