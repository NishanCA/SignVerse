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
}: ConversationOutputProps) {
  return (
    <div className="h-[28vh] bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] flex flex-col relative">

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:px-8 space-y-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={msg.id}
            className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.sender === "user"
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-br-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border-subtle)]"
              }`}
            >
              <p className="font-medium">{msg.text}</p>
              {msg.translation && (
                <p className={`text-xs mt-2 pt-2 border-t opacity-80 ${
                  msg.sender === "user" ? "border-[var(--bg-primary)]/20" : "border-[var(--border-subtle)]"
                }`}>
                  {msg.translation}
                </p>
              )}
            </div>
          </motion.div>
        ))}
        {/* Placeholder if empty */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] gap-2">
            <Bot size={32} className="opacity-50" />
            <p className="text-sm font-medium">Start signing or speaking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// ── Avatar Panel ──────────────────────────────────────────────────────────────
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
    <div className="w-1/3 md:w-1/4 relative overflow-hidden rounded-3xl flex flex-col items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
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
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg-secondary)]/50 backdrop-blur-md transition-all">
      <Bot className="w-12 h-12 text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
    </div>
  );
}
