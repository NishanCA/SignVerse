/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion } from "framer-motion";
import { Camera, Mic, Volume2, AlertCircle, ChevronLeft, CheckCircle2 } from "lucide-react";
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
    // In browsers, speaker output is generally allowed if mic is allowed, 
    // or via AudioContext interaction. We simulate permission here.
    setSpeakerGranted(true);
  };

  const allGranted = cameraGranted && micGranted && speakerGranted;
  const anyDenied = cameraGranted === false || micGranted === false || speakerGranted === false;

  return (
    <main className="min-h-screen p-6 relative overflow-x-hidden pb-24">
      {/* Background */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute bottom-[10%] left-[10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[100px]" />
      </div>

      <header className="flex items-center mb-8 mt-2">
        <button 
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold ml-2">Permission Options</h1>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-lg mx-auto"
      >
        <p className="text-slate-400 mb-6">
          SignVerse requires access to your device hardware for real-time sign language recognition and speech translation.
        </p>

        {/* Camera */}
        <div className={`glass-card p-5 border-l-4 ${cameraGranted ? 'border-l-green-500' : cameraGranted === false ? 'border-l-red-500' : 'border-l-purple-500'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/5 rounded-full">
              <Camera size={24} className={cameraGranted ? 'text-green-400' : 'text-purple-400'} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Camera
                {cameraGranted && <CheckCircle2 size={16} className="text-green-500" />}
              </h3>
              <p className="text-sm text-slate-400 mt-1 mb-3">Needed for hand gesture recognition and avatar animation.</p>
              
              {!cameraGranted && (
                <button 
                  onClick={requestCamera}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-sm font-medium rounded-lg transition-colors w-full"
                >
                  Allow Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mic */}
        <div className={`glass-card p-5 border-l-4 ${micGranted ? 'border-l-green-500' : micGranted === false ? 'border-l-red-500' : 'border-l-blue-500'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/5 rounded-full">
              <Mic size={24} className={micGranted ? 'text-green-400' : 'text-blue-400'} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Microphone
                {micGranted && <CheckCircle2 size={16} className="text-green-500" />}
              </h3>
              <p className="text-sm text-slate-400 mt-1 mb-3">Needed for speech recognition and live translation.</p>
              
              {!micGranted && (
                <button 
                  onClick={requestMic}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-sm font-medium rounded-lg transition-colors w-full"
                >
                  Allow Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Speaker */}
        <div className={`glass-card p-5 border-l-4 ${speakerGranted ? 'border-l-green-500' : 'border-l-indigo-500'}`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/5 rounded-full">
              <Volume2 size={24} className={speakerGranted ? 'text-green-400' : 'text-indigo-400'} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Speaker
                {speakerGranted && <CheckCircle2 size={16} className="text-green-500" />}
              </h3>
              <p className="text-sm text-slate-400 mt-1 mb-3">Needed for audio playback of translated speech.</p>
              
              {!speakerGranted && (
                <button 
                  onClick={requestSpeaker}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-sm font-medium rounded-lg transition-colors w-full"
                >
                  Allow Access
                </button>
              )}
            </div>
          </div>
        </div>

        {anyDenied && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 mt-4"
          >
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-red-200 font-medium">Access Denied</p>
              <p className="text-xs text-red-300 mt-1">Please grant all permissions in your browser settings to continue.</p>
            </div>
          </motion.div>
        )}

        {/* Floating Action Button */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/home")}
            disabled={!allGranted && !anyDenied} // Disable if neither fully granted nor explicitly denied (for demo)
            className={`w-full max-w-lg mx-auto block py-4 rounded-xl font-bold text-lg transition-all ${
              allGranted 
                ? 'bg-gradient-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
                : 'bg-white/10 text-slate-400 cursor-not-allowed'
            }`}
          >
            Continue
          </motion.button>
          
          {/* Demo override button to proceed without actually granting perm (useful for testing if no camera) */}
          {!allGranted && (
             <button 
               onClick={() => router.push("/home")}
               className="w-full text-center text-xs text-slate-500 mt-4 underline"
             >
               Skip for testing
             </button>
          )}
        </div>
      </motion.div>
    </main>
  );
}
