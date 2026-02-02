
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const VisionAirLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
       <defs>
          <linearGradient id="bird-grad-1" x1="100" y1="100" x2="400" y2="400" gradientUnits="userSpaceOnUse">
             <stop offset="0" stopColor="#F97316"/>
             <stop offset="1" stopColor="#EA580C"/>
          </linearGradient>
          <linearGradient id="bird-grad-2" x1="100" y1="300" x2="400" y2="500" gradientUnits="userSpaceOnUse">
             <stop offset="0" stopColor="#FDBA74"/>
             <stop offset="1" stopColor="#F97316"/>
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="10" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
       </defs>
       
       <path d="M140 320 C 140 320, 160 480, 320 440 C 400 420, 460 360, 460 360 C 460 360, 380 380, 300 360 C 240 345, 200 280, 140 320 Z" fill="url(#bird-grad-2)" filter="url(#glow)"/>
       <path d="M120 220 C 120 220, 160 360, 320 360 C 400 360, 480 280, 480 280 C 480 280, 380 320, 300 300 C 220 280, 180 180, 120 220 Z" fill="#FED7AA" opacity="0.6"/>
       <path d="M100 140 C 100 140, 150 280, 320 280 C 420 280, 480 200, 480 200 C 480 200, 380 240, 300 220 C 200 190, 180 80, 100 140 Z" fill="url(#bird-grad-1)" filter="url(#glow)"/>
    </svg>
);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 1: Initial Black Screen -> Light Explodes
    const t1 = setTimeout(() => setStage(1), 500);
    // Stage 2: Logo Assembly
    const t2 = setTimeout(() => setStage(2), 1200);
    // Stage 3: Text Reveal
    const t3 = setTimeout(() => setStage(3), 2200);
    // Stage 4: Exit
    const t4 = setTimeout(() => onComplete(), 3800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, scale: stage >= 1 ? 1 : 0.8 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-orange-950 to-slate-900"
      />
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center">
          
          {/* Logo Animation */}
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-8">
            <AnimatePresence>
                {stage >= 1 && (
                    <motion.div
                        initial={{ scale: 0, rotate: -45, opacity: 0, filter: "blur(20px)" }}
                        animate={{ scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)" }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 20, 
                            duration: 1.5 
                        }}
                    >
                        <VisionAirLogo className="w-full h-full drop-shadow-[0_0_50px_rgba(249,115,22,0.5)]" />
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Text Animation */}
          <div className="h-32 overflow-hidden flex flex-col items-center relative">
             <motion.h1 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: stage >= 2 ? 0 : 100, opacity: stage >= 2 ? 1 : 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
                className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-white tracking-tighter"
             >
                 Vision <span className="text-orange-500">Air</span>
             </motion.h1>
             
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: stage >= 3 ? 1 : 0, scale: stage >= 3 ? 1 : 0.9 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-6 flex gap-4"
             >
                 <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-orange-200 tracking-widest uppercase backdrop-blur-md">AI Powered</span>
                 <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-orange-200 tracking-widest uppercase backdrop-blur-md">Next Gen</span>
             </motion.div>
          </div>
      </div>
      
      {/* Light Sweep Effect */}
      {stage >= 2 && (
          <motion.div 
            initial={{ left: '-100%', opacity: 0 }}
            animate={{ left: '200%', opacity: 0.3 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 pointer-events-none"
          />
      )}
    </div>
  );
};
