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
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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

  // Determine the guideline to show
  const getGuidelineContent = () => {
    if (activeTab === "appspecific") {
      return {
        title: "App Specific Guideline",
        desc: "For all App Specific gestures: use your Left Hand for number-based suggestions (0–4) and your Right Hand for Suggestion 5. The Delete gesture also uses the Left Hand."
      };
    }
    return {
      title: t("learning.guideline_title"),
      desc: t("learning.guideline_desc")
    };
  };

  const guideline = getGuidelineContent();

  return (
    <main className="min-h-screen pb-24 md:pt-24 px-6 relative overflow-x-hidden">
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-700/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-700/10 blur-[100px]" />
        {activeTab === "appspecific" && (
          <div className="absolute top-[40%] left-[60%] w-[350px] h-[350px] rounded-full bg-blue-700/8 blur-[100px]" />
        )}
      </div>

      <div className="max-w-6xl mx-auto pt-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{t("learning.title")}</h1>
                <p className="text-slate-400">{t("learning.subtitle")}</p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Important Notice */}
        <motion.div 
          key={activeTab + "-guideline"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass-card p-4 mb-8 flex items-start gap-3 ${activeTab === "appspecific" ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20"}`}
        >
          <Info className={`mt-0.5 shrink-0 ${activeTab === "appspecific" ? "text-blue-400" : "text-amber-400"}`} size={20} />
          <div>
            <h3 className={`font-bold mb-1 ${activeTab === "appspecific" ? "text-blue-400" : "text-amber-400"}`}>{guideline.title}</h3>
            <p className="text-sm text-slate-300">{guideline.desc}</p>
            {activeTab === "appspecific" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs bg-slate-700/60 border border-white/10 rounded-full px-3 py-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  Numbers 0–4 &amp; Delete → <strong className="text-white ml-1">Left Hand</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs bg-slate-700/60 border border-white/10 rounded-full px-3 py-1 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
                  Suggestion 5 → <strong className="text-white ml-1">Right Hand</strong>
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center"
        >
          <div className="glass p-1 rounded-2xl flex w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => { setActiveTab("letters"); setSearchQuery(""); }}
              className={`flex-1 md:w-32 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === "letters" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {t("learning.letters")}
            </button>
            <button
              onClick={() => { setActiveTab("numbers"); setSearchQuery(""); }}
              className={`flex-1 md:w-32 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === "numbers" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {t("learning.numbers")}
            </button>
            <button
              onClick={() => { setActiveTab("words"); setSearchQuery(""); }}
              className={`flex-1 md:w-32 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === "words" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              Words
            </button>
            <button
              onClick={() => { setActiveTab("appspecific"); setSearchQuery(""); }}
              className={`flex-1 md:w-36 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === "appspecific" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-sm border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              App Specific
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`${t("learning.search")}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-card bg-white/5 border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow"
            />
          </div>
        </motion.div>

        {/* App Specific Section Header */}
        {activeTab === "appspecific" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <span className="text-xs font-semibold text-blue-400/80 uppercase tracking-widest px-3">App Specific Signs</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            </div>
            <p className="text-center text-slate-500 text-xs mt-2">Gestures used within the SignVerse app interface</p>
          </motion.div>
        )}

        {/* Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeTab}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              // Determine hand hint for app specific items
              const isRightHand = activeTab === "appspecific" && item === "Suggestion 5";
              const isLeftHand = activeTab === "appspecific" && item !== "Suggestion 5";

              return (
                <motion.div 
                  key={item}
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="glass-card-hover group flex flex-col items-center justify-center p-4 relative overflow-hidden"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${activeTab === "appspecific" ? "bg-gradient-to-br from-blue-500/5 to-purple-500/5" : "bg-gradient-to-br from-emerald-500/5 to-transparent"}`} />
                  
                  <h3 className={`font-black mb-4 text-white/80 group-hover:text-white transition-colors text-center ${item.length > 5 ? 'text-xl' : 'text-3xl'}`}>
                    {item}
                  </h3>
                  
                  <div 
                    className={`w-full aspect-square rounded-xl overflow-hidden bg-slate-800/50 border group-hover:border-emerald-500/50 transition-colors shadow-inner relative flex items-center justify-center cursor-pointer ${activeTab === "appspecific" ? "border-blue-500/20 group-hover:border-blue-500/50" : "border-white/10"}`}
                    onClick={() => setSelectedImage({item, type: activeTab})}
                  >
                    <img 
                      src={getImagePath(item)}
                      alt={`Sign language for ${item}`}
                      className="w-full h-full object-cover transition-all duration-300 transform group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = "/globe.svg";
                        e.currentTarget.className = "w-1/2 h-1/2 m-auto opacity-20";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border backdrop-blur-sm ${activeTab === "appspecific" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>{t("learning.view_sign")}</span>
                    </div>
                  </div>

                  {/* Hand indicator badge for app specific */}
                  {activeTab === "appspecific" && (
                    <div className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${isRightHand ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                      {isRightHand ? "✋ Right Hand" : "🤚 Left Hand"}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* "More Coming..." card — only on words tab when no search */}
          {activeTab === "words" && searchQuery === "" && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card group flex flex-col items-center justify-center p-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none rounded-2xl" />
              <h3 className="text-lg font-black mb-4 text-white/40 text-center">...</h3>
              <div className="w-full aspect-square rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">✨</span>
                <p className="text-sm font-bold text-slate-500 text-center leading-snug">More<br/>Coming...</p>
              </div>
            </motion.div>
          )}
          
          {filteredItems.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center text-slate-400 glass-card"
            >
              {t("learning.no_signs")} &quot;{searchQuery}&quot;
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden bg-slate-900 border border-white/20 shadow-2xl flex flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
              >
                <X size={24} />
              </button>
              <img 
                src={getModalImagePath(selectedImage.item, selectedImage.type)}
                alt={`Sign language for ${selectedImage.item}`}
                className="w-full h-full max-h-[75vh] object-contain rounded-xl"
              />
              <div className="mt-4 text-white text-3xl font-bold">
                {selectedImage.item}
              </div>
              {/* Hand hint in modal for app specific */}
              {selectedImage.type === "appspecific" && (
                <div className={`mt-2 text-sm font-semibold px-3 py-1 rounded-full border ${selectedImage.item === "Suggestion 5" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
                  {selectedImage.item === "Suggestion 5" ? "✋ Use Right Hand" : "🤚 Use Left Hand"}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
