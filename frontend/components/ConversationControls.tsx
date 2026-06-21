"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";

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
    <div className="p-4 bg-slate-950 border-t border-white/5">
      <div className="flex items-center gap-2">
        {/* Webcam toggle — visual only */}
        <button
          onClick={onToggleWebcam}
          className={`p-3 rounded-xl transition-all ${
            webcamVisible
              ? "bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              : "bg-slate-700/70 text-slate-300 hover:bg-slate-600/70"
          }`}
        >
          {webcamVisible ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          className={`p-3 rounded-xl transition-all ${
            micActive
              ? "bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              : "bg-slate-700/70 text-slate-300 hover:bg-slate-600/70"
          }`}
        >
          {micActive ? (
            <Mic size={24} className={micStatus === "listening" ? "animate-pulse" : ""} />
          ) : (
            <MicOff size={24} />
          )}
        </button>

        {/* Text input with autocomplete ghost */}
        <div className="flex-1 relative bg-white/5 border border-white/10 rounded-xl text-sm transition-all focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 overflow-hidden">
          {/* Ghost autocomplete text */}
          <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none whitespace-pre text-sm w-full font-sans">
            <span className="text-transparent">{inputText}</span>
            {suggestions.length > 0 &&
              suggestions[0].toLowerCase().startsWith(inputText.toLowerCase()) && (
                <span className="text-slate-400/50">{suggestions[0].slice(inputText.length)}</span>
              )}
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent py-3 px-4 focus:outline-none placeholder:text-slate-500 relative z-10 text-white dark:text-white"
          />
        </div>
      </div>

      {/* Smart-space hint */}
      {handsVisible && hasGestured && (
        <p className="text-xs text-slate-500 mt-2 pl-1">
          Pause 1.5s to auto-send and switch to speech
        </p>
      )}

      {/* Suggestion pills */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionSelect(s)}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-full text-xs whitespace-nowrap transition-colors border border-purple-500/20 shrink-0"
            >
              {s}
            </button>
          ))}
          <span className="text-xs text-purple-300/50 flex items-center ml-1 whitespace-nowrap">
            Hold two hands (Left 5 for 1st, 1-4 for others)
          </span>
        </div>
      )}
    </div>
  );
}
