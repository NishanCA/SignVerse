"use client";

import { motion } from "framer-motion";
import { Camera, Mic, Volume2, AlertCircle, ChevronLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PermissionsScreen() {
  const router = useRouter();
  
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [speakerGranted, setSpeakerGranted] = useState<boolean | null>(null);

  const requestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraGranted(true);
    } catch (e) {
      setCameraGranted(false);
    }
  };

  const requestMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
    } catch (e) {
      setMicGranted(false);
    }
  };

  const requestSpeaker = () => {
    setSpeakerGranted(true);
  };

  const allGranted = cameraGranted && micGranted && speakerGranted;
  const anyDenied = cameraGranted === false || micGranted === false || speakerGranted === false;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex flex-col relative px-6 pb-24">
      <header className="w-full max-w-lg mx-auto flex items-center justify-between pt-6 pb-8 z-10">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-ring"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg mx-auto flex-1 flex flex-col"
      >
        <div className="mb-8">
          <h1 className="heading-lg text-[var(--text-primary)] mb-2">Device Permissions</h1>
          <p className="body-sm text-[var(--text-secondary)]">
            SignVerse needs access to your hardware to enable real-time sign language recognition and speech translation.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Camera */}
          <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-sm flex items-start gap-4 transition-colors">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${cameraGranted ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : cameraGranted === false ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
              <Camera size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                Camera Access
                {cameraGranted && <Check size={14} className="text-[var(--accent-green)]" strokeWidth={3} />}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3 leading-relaxed">Required for hand gesture recognition and avatar animation.</p>
              
              {!cameraGranted && (
                <button 
                  onClick={requestCamera}
                  className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-medium rounded-lg transition-colors focus-ring"
                >
                  Allow Camera
                </button>
              )}
            </div>
          </div>

          {/* Mic */}
          <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-sm flex items-start gap-4 transition-colors">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${micGranted ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : micGranted === false ? 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
              <Mic size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                Microphone Access
                {micGranted && <Check size={14} className="text-[var(--accent-green)]" strokeWidth={3} />}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3 leading-relaxed">Required for speech recognition and live translation.</p>
              
              {!micGranted && (
                <button 
                  onClick={requestMic}
                  className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-medium rounded-lg transition-colors focus-ring"
                >
                  Allow Microphone
                </button>
              )}
            </div>
          </div>

          {/* Speaker */}
          <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-sm flex items-start gap-4 transition-colors">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${speakerGranted ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
              <Volume2 size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                Speaker Output
                {speakerGranted && <Check size={14} className="text-[var(--accent-green)]" strokeWidth={3} />}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 mb-3 leading-relaxed">Required for audio playback of translated speech.</p>
              
              {!speakerGranted && (
                <button 
                  onClick={requestSpeaker}
                  className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-medium rounded-lg transition-colors focus-ring"
                >
                  Allow Audio
                </button>
              )}
            </div>
          </div>
        </div>

        {anyDenied && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-xl flex items-start gap-3 mt-6"
          >
            <AlertCircle className="text-[var(--accent-red)] shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-medium text-[var(--accent-red)]">Access Denied</p>
              <p className="text-xs text-[var(--accent-red)]/80 mt-0.5">Please grant all permissions in your browser settings to continue.</p>
            </div>
          </motion.div>
        )}

        {/* Action Area */}
        <div className="mt-auto pt-8">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/home")}
            disabled={!allGranted && !anyDenied} 
            className={`w-full py-3.5 px-4 rounded-xl font-medium text-base transition-all focus-ring ${
              allGranted 
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm' 
                : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] cursor-not-allowed border border-[var(--border-subtle)]'
            }`}
          >
            Continue
          </motion.button>
          
          {!allGranted && (
             <div className="text-center mt-4">
               <button 
                 onClick={() => router.push("/home")}
                 className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2 transition-colors outline-none focus-visible:text-[var(--text-primary)]"
               >
                 Skip for testing
               </button>
             </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
