"use client";

import { RefObject } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import Avatar3D from "./Avatar3D";
import { Message } from "../hooks/useConversationEngine";

interface ConversationOutputProps {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  avatarText: string | undefined;
  avatarTrigger: number;
  avatarSkinColor: string;
  speechSpeed: number;
  onAvatarFinish: () => void;
}

export default function ConversationOutput({
  messages,
  messagesEndRef,
  avatarText,
  avatarTrigger,
  avatarSkinColor,
  speechSpeed,
  onAvatarFinish,
}: ConversationOutputProps) {
  return (
    <div className="h-[30vh] bg-slate-900 border-t border-white/10 flex flex-col relative">

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`p-3 rounded-2xl text-sm ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-bl-sm border border-white/5"
              }`}
            >
              <p>{msg.text}</p>
              {msg.translation && (
                <p className="text-xs mt-1 pt-1 border-t border-white/10 opacity-80">
                  {msg.translation}
                </p>
              )}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// ── Avatar Panel (separate export for layout flexibility) ─────────────────────
interface AvatarPanelProps {
  avatarText: string | undefined;
  avatarTrigger: number;
  avatarSkinColor: string;
  speechSpeed: number;
  onAvatarFinish: () => void;
}

export function AvatarPanel({
  avatarText,
  avatarTrigger,
  avatarSkinColor,
  speechSpeed,
  onAvatarFinish,
}: AvatarPanelProps) {
  return (
    <div className="w-1/3 md:w-1/3 relative overflow-hidden rounded-2xl flex flex-col items-center justify-center bg-slate-900">
      <Avatar3D
        signingText={avatarText}
        trigger={avatarTrigger}
        isActive={true}
        onFinish={onAvatarFinish}
        skinColor={avatarSkinColor}
        speedMultiplier={speechSpeed}
      />
    </div>
  );
}

// ── Bot idle placeholder ─────────────────────────────────────────────────────
export function AvatarIdleOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all">
      <Bot className="w-16 h-16 text-slate-500 mb-4 opacity-50" />
    </div>
  );
}
