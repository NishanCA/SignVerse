"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { BookOpen, Info, Search, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useLanguage } from "../../context/LanguageContext";

export default function LearningScreen() {
  const [activeTab, setActiveTab] = useState<"letters" | "numbers" | "words" | "appspecific">("letters");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<{item: string, type: "letters" | "numbers" | "words" | "appspecific"} | null>(null);
  const { t } = useLanguage();

  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const numbers = Array.from({ length: 10 }, (_, i) => String(i));
  const words = ["Hello", "Goodbye", "Yes", "No", "Please", "Thank You"];
  const appSpecific = ["Delete", "Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4", "Suggestion 5"];

  const items = activeTab === "letters" ? letters : activeTab === "numbers" ? numbers : activeTab === "words" ? words : appSpecific;
  
  const filteredItems = items.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getImagePath = (item: string) => {
    if (activeTab === "letters") return `/learning/Letters/${item}.jpeg`;
    if (activeTab === "numbers") return `/learning/Numbers/${item}.jpeg`;
    if (activeTab === "appspecific") return `/learning/App Specific/${item}.png`;
    return `/learning/Words/${item}.jpeg`;
  };

  const getModalImagePath = (item: string, type: "letters" | "numbers" | "words" | "appspecific") => {
    if (type === "letters") return `/learning/Letters/${item}.jpeg`;
    if (type === "numbers") return `/learning/Numbers/${item}.jpeg`;
    if (type === "appspecific") return `/learning/App Specific/${item}.png`;
    return `/learning/Words/${item}.jpeg`;
  };

  const getGuidelineContent = () => {
    if (activeTab === "appspecific") {
      return {
        title: "App Specific Guideline",
        desc: "For all App Specific gestures: use your Left Hand for number-based suggestions (0–4) and your Right Hand for Suggestion 5. The Delete gesture also uses the Left Hand."
      };
    }
    return {
      title: t("learning.guideline_title") || "ASL Guidelines",
      desc: t("learning.guideline_desc") || "Please use your Right Hand for all these gestures."
    };
  };

  const guideline = getGuidelineContent();

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pb-24 md:pt-24 px-6 relative overflow-x-hidden">
      <Navbar />

      <div className="max-w-5xl mx-auto pt-6">
        <motion.header 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="heading-xl text-[var(--text-primary)] mb-2">{t("learning.title") || "Dictionary"}</h1>
            <p className="body-base text-[var(--text-secondary)]">{t("learning.subtitle") || "Explore ASL alphabet, numbers, and words."}</p>
          </div>
        </motion.header>

        {/* Info Banner */}
        <motion.div 
          key={activeTab + "-guideline"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Info className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" size={18} />
          <div>
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-0.5">{guideline.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{guideline.desc}</p>
            {activeTab === "appspecific" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1 text-[var(--text-primary)] font-medium shadow-sm">
                  <span className="text-[var(--text-secondary)]">🤚 Left Hand:</span> Numbers 0–4 & Delete
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md px-2.5 py-1 text-[var(--text-primary)] font-medium shadow-sm">
                  <span className="text-[var(--text-secondary)]">✋ Right Hand:</span> Suggestion 5
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center z-10 sticky top-0 md:top-20 bg-[var(--bg-primary)]/90 backdrop-blur-md py-2 border-b border-[var(--border-subtle)] md:border-none md:bg-transparent md:backdrop-blur-none">
          <div className="bg-[var(--bg-secondary)] p-1 rounded-xl flex w-full md:w-auto overflow-x-auto border border-[var(--border-subtle)] shadow-sm">
            {[
              { id: "letters", label: t("learning.letters") || "Letters" },
              { id: "numbers", label: t("learning.numbers") || "Numbers" },
              { id: "words", label: "Words" },
              { id: "appspecific", label: "App Specific" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchQuery(""); }}
                className={`flex-1 md:w-32 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-ring outline-none ${activeTab === tab.id ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
            <input 
              type="text" 
              placeholder={`${t("learning.search") || "Search"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--text-tertiary)] focus:ring-1 focus:ring-[var(--text-tertiary)] shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeTab}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isRightHand = activeTab === "appspecific" && item === "Suggestion 5";
              const isLeftHand = activeTab === "appspecific" && item !== "Suggestion 5";

              return (
                <motion.div 
                  key={item}
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group flex flex-col items-center p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
                  onClick={() => setSelectedImage({item, type: activeTab})}
                >
                  <h3 className={`font-semibold mb-3 text-[var(--text-primary)] text-center tracking-tight ${item.length > 5 ? 'text-sm' : 'text-xl'}`}>
                    {item}
                  </h3>
                  
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-subtle)] relative flex items-center justify-center">
                    <img 
                      src={getImagePath(item)}
                      alt={`Sign language for ${item}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/globe.svg";
                        e.currentTarget.className = "w-1/2 h-1/2 m-auto opacity-20 grayscale";
                      }}
                    />
                  </div>

                  {/* Hand indicator badge for app specific */}
                  {activeTab === "appspecific" && (
                    <div className="mt-3 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {isRightHand ? "Right Hand" : "Left Hand"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activeTab === "words" && searchQuery === "" && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-3 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-subtle)] rounded-2xl"
            >
              <h3 className="text-xl font-semibold mb-3 text-[var(--text-tertiary)] text-center">
                ...
              </h3>
              <div className="w-full aspect-square flex flex-col items-center justify-center gap-2">
                <span className="text-2xl opacity-50">✨</span>
                <p className="text-xs font-medium text-[var(--text-tertiary)] text-center">More<br/>Coming</p>
              </div>
            </motion.div>
          )}
          
          {filteredItems.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-16 flex flex-col items-center justify-center"
            >
              <Search size={32} className="text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">{t("learning.no_signs") || "No signs found for"} &quot;{searchQuery}&quot;</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative max-w-2xl w-full rounded-3xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-2xl flex flex-col items-center justify-center p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {selectedImage.item}
                </h2>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-ring"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="w-full bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] flex justify-center">
                <img 
                  src={getModalImagePath(selectedImage.item, selectedImage.type)}
                  alt={`Sign language for ${selectedImage.item}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "/globe.svg";
                    e.currentTarget.className = "w-32 h-32 m-12 opacity-20 grayscale";
                  }}
                />
              </div>

              {selectedImage.type === "appspecific" && (
                <div className="mt-6 text-sm font-medium px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-sm">
                  {selectedImage.item === "Suggestion 5" ? "Use Right Hand" : "Use Left Hand"}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
