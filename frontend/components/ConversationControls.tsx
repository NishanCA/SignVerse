"use client";

import { Mic, MicOff, Video, VideoOff, SendHorizonal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationControlsProps {
  inputText: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  micActive: boolean;
  onToggleMic: () => void;
  micStatus: "idle" | "listening" | "processing";
  webcamVisible: boolean;
  onToggleWebcam: () => void;
  suggestions: string[];
  handsVisible: boolean;
  hasGestured: boolean;
  onSuggestionSelect: (s: string) => void;
}

export default function ConversationControls({
  inputText,
  onInputChange,
  onSend,
  micActive,
  onToggleMic,
  micStatus,
  webcamVisible,
  onToggleWebcam,
  suggestions,
  handsVisible,
  hasGestured,
  onSuggestionSelect,
}: ConversationControlsProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Tab" &&
      suggestions.length > 0 &&
      suggestions[0].toLowerCase().startsWith(inputText.toLowerCase())
    ) {
      e.preventDefault();
      onInputChange(suggestions[0]);
    } else if (e.key === "Enter") {
      onSend();
    }
  };

  return (
    <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] pb-8 z-30">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        
        {/* Suggestion pills */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide items-center"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionSelect(s)}
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full text-xs font-medium whitespace-nowrap transition-colors shadow-sm focus-ring outline-none"
                >
                  {s}
                </button>
              ))}
              <span className="text-[10px] text-[var(--text-tertiary)] font-medium ml-2 whitespace-nowrap hidden sm:inline-flex">
                Hold two hands (Left 5 for 1st, 1-4 for others)
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          {/* Webcam toggle */}
          <button
            onClick={onToggleWebcam}
            className={`p-3.5 rounded-2xl transition-all outline-none focus-ring shadow-sm ${
              webcamVisible
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
            }`}
            title="Toggle Camera"
          >
            {webcamVisible ? <Video size={22} /> : <VideoOff size={22} />}
          </button>

          {/* Mic toggle */}
          <button
            onClick={onToggleMic}
            className={`p-3.5 rounded-2xl transition-all outline-none focus-ring shadow-sm ${
              micActive
                ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
            }`}
            title="Toggle Microphone"
          >
            {micActive ? (
              <Mic size={22} className={micStatus === "listening" ? "animate-pulse" : ""} />
            ) : (
              <MicOff size={22} />
            )}
          </button>

          {/* Text input container */}
          <div className="flex-1 relative bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl flex items-center transition-all focus-within:border-[var(--text-tertiary)] focus-within:ring-1 focus-within:ring-[var(--text-tertiary)] shadow-sm h-14">
            
            {/* Ghost autocomplete text */}
            <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none whitespace-pre text-[15px] font-medium w-full">
              <span className="text-transparent">{inputText}</span>
              {suggestions.length > 0 &&
                suggestions[0].toLowerCase().startsWith(inputText.toLowerCase()) && (
                  <span className="text-[var(--text-tertiary)]">{suggestions[0].slice(inputText.length)}</span>
                )}
            </div>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-full bg-transparent py-0 px-4 focus:outline-none relative z-10 text-[15px] font-medium text-[var(--text-primary)]"
            />

            <AnimatePresence>
              {inputText.trim().length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={onSend}
                  className="mr-2 p-2 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 transition-transform outline-none focus-ring"
                >
                  <SendHorizonal size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Smart-space hint */}
        <AnimatePresence>
          {handsVisible && hasGestured && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[11px] font-medium text-[var(--text-tertiary)] text-center mt-1"
            >
              Pause 1.5s to auto-send and switch to speech
            </motion.p>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
