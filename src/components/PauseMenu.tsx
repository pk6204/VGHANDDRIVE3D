import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Crosshair } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onRecalibrate: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  onRecalibrate,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white tracking-tight mb-1">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">Take a breath or recalibrate your hand</p>

        <div className="flex flex-col gap-3 w-full mb-6">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME DRIVE</span>
          </button>

          <button
            onClick={onRecalibrate}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4 text-blue-400" />
            <span>Recalibrate Hand</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Restart Race</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Exit to Main Menu</span>
          </button>
        </div>

        <button
          onClick={onToggleSound}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          <span>Audio Sound Effects: {soundEnabled ? 'ON' : 'MUTED'}</span>
        </button>
      </div>
    </div>
  );
};
