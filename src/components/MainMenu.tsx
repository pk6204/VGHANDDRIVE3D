import React from 'react';
import { Play, Camera, HelpCircle, Volume2, Trophy, Hand, ShieldAlert } from 'lucide-react';

interface MainMenuProps {
  bestScore: number;
  onPlay: () => void;
  onOpenSetup: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  isCameraReady: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  bestScore,
  onPlay,
  onOpenSetup,
  onOpenHowToPlay,
  onOpenSettings,
  isCameraReady,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 md:p-10 bg-gradient-to-b from-slate-950/70 via-slate-900/50 to-slate-950/80 backdrop-blur-xs select-none">
      {/* Top Bar with Best Score & Settings */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl shadow-lg">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Best Record</span>
          <span className="text-lg font-bold text-amber-300 font-mono ml-1">{bestScore.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            title="Audio & Game Settings"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Title & Branding */}
      <div className="flex flex-col items-center text-center max-w-2xl mt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">
          <Hand className="w-3.5 h-3.5" />
          Webcam Computer-Vision Racing
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-md">
          HAND DRIVE <span className="text-red-500">3D</span>
        </h1>
        <p className="mt-3 text-base md:text-lg text-slate-300 max-w-lg leading-relaxed font-normal">
          Drive a high-performance sports car down a 3-lane scenic highway using your real hand movements.
        </p>

        {/* Quick Gesture Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-8 w-full max-w-2xl text-left">
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Hand Left</div>
            <div className="text-xs font-bold text-amber-400">Lane Left ⬅️</div>
          </div>
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Hand Right</div>
            <div className="text-xs font-bold text-amber-400">Lane Right ➡️</div>
          </div>
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Open Palm</div>
            <div className="text-xs font-bold text-emerald-400">Accelerate 🚀</div>
          </div>
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Closed Fist</div>
            <div className="text-xs font-bold text-rose-400">Brake 🛑</div>
          </div>
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Index Down</div>
            <div className="text-xs font-bold text-pink-400">Honk Horn 📢</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-9 w-full max-w-md">
          <button
            onClick={onPlay}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-red-900/30 transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>PLAY GAME</span>
          </button>

          <button
            onClick={onOpenSetup}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-600/60 shadow-lg transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Camera className="w-5 h-5 text-blue-400" />
            <span>{isCameraReady ? 'Camera Calibrated' : 'Webcam Setup'}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-5xl flex items-center justify-between text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>No plugins or sign-up needed. Runs 100% locally in browser.</span>
        </div>

        <button
          onClick={onOpenHowToPlay}
          className="flex items-center gap-1 text-slate-300 hover:text-white underline underline-offset-4 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Rules & Scoring</span>
        </button>
      </div>
    </div>
  );
};
