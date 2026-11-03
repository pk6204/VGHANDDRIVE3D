import React from 'react';
import { Pause, Trophy, Coins, Compass, Gauge, AlertCircle } from 'lucide-react';
import { FloatingText, GameStats, HandStatus, Lane } from '../types';
import { WebcamPIP } from './WebcamPIP';

interface GameplayHUDProps {
  stats: GameStats;
  handStatus: HandStatus;
  inputMode: 'webcam' | 'keyboard';
  floatingTexts: FloatingText[];
  onPause: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  stats,
  handStatus,
  inputMode,
  floatingTexts,
  onPause,
}) => {
  const isTimeCritical = stats.timeLeft <= 15;
  const isTimeWarning = stats.timeLeft <= 30 && !isTimeCritical;

  const laneLabels = ['LEFT', 'CENTER', 'RIGHT'];

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Bar: Stats, Timer & Pause */}
      <div className="flex items-start justify-between w-full max-w-6xl mx-auto gap-3 pointer-events-auto">
        {/* Score & Coins Card */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800/90 rounded-2xl px-4 py-2.5 shadow-xl">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</div>
            <div className="text-2xl md:text-3xl font-black text-white font-mono leading-none">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-1" />

          <div className="flex items-center gap-1.5 text-amber-400">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-bold font-mono">{stats.coinsCollected}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono">{stats.bestScore}</span>
          </div>
        </div>

        {/* 120s Countdown Timer */}
        <div
          className={`flex flex-col items-center px-6 py-2 rounded-2xl border backdrop-blur-xs shadow-xl transition-colors ${
            isTimeCritical
              ? 'bg-rose-950/90 border-rose-600 text-rose-300 animate-pulse'
              : isTimeWarning
              ? 'bg-amber-950/80 border-amber-600 text-amber-300'
              : 'bg-slate-950/80 border-slate-800 text-white'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Time Remaining</span>
          <span className="text-2xl md:text-3xl font-black font-mono tracking-tight leading-none">
            {Math.floor(stats.timeLeft / 60)}:{(stats.timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Distance & Pause Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-xs border border-slate-800/90 rounded-2xl px-4 py-2.5 shadow-xl">
            <Compass className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Distance</div>
              <div className="text-sm font-bold text-white font-mono">{stats.distance} m</div>
            </div>
          </div>

          <button
            onClick={onPause}
            className="p-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-xs border border-slate-800 text-slate-300 hover:text-white rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Floating score text notifications in upper middle */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        {floatingTexts.map((item) => (
          <div
            key={item.id}
            className={`px-4 py-1.5 rounded-full text-sm font-black tracking-wide shadow-lg animate-fade-in-up ${
              item.type === 'coin'
                ? 'bg-amber-500/90 text-amber-950 border border-amber-300'
                : item.type === 'checkpoint'
                ? 'bg-emerald-500/90 text-emerald-950 border border-emerald-300'
                : item.type === 'collision'
                ? 'bg-rose-600/95 text-white border border-rose-300 animate-shake'
                : 'bg-blue-600/90 text-white border border-blue-400'
            }`}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Bottom Row: Webcam PIP, Center 3-Lane Guide, Speedometer */}
      <div className="flex items-end justify-between w-full max-w-6xl mx-auto gap-4 pointer-events-auto">
        {/* Left: Webcam PIP / Keyboard reminder */}
        <div>
          <WebcamPIP handStatus={handStatus} inputMode={inputMode} />
        </div>

        {/* Center: 3-Lane Visual Indicator */}
        <div className="flex flex-col items-center bg-slate-950/80 backdrop-blur-xs border border-slate-800/90 px-4 py-2 rounded-2xl shadow-xl mb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Current Lane</div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((laneIndex) => {
              const isActive = stats.currentLane === laneIndex;
              return (
                <div
                  key={laneIndex}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 scale-105'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {laneLabels[laneIndex]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Digital Speedometer */}
        <div className="flex flex-col items-end bg-slate-950/80 backdrop-blur-xs border border-slate-800/90 px-5 py-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>SPEED</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-white leading-none">{stats.speed}</span>
            <span className="text-xs font-bold text-slate-400">KM/H</span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider mt-1">
            {stats.speed >= 120 ? (
              <span className="text-emerald-400">BOOSTING 🚀</span>
            ) : stats.speed <= 45 ? (
              <span className="text-rose-400">BRAKING 🛑</span>
            ) : (
              <span className="text-blue-400">CRUISING</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
