import React from 'react';
import { Trophy, RotateCcw, Home, Coins, Compass, Car, AlertTriangle, Award } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onPlayAgain, onMainMenu }) => {
  const isNewRecord = stats.score >= stats.bestScore && stats.score > 0;

  // Calculate Driving Rank
  let rank = 'B';
  let rankColor = 'text-blue-400';
  let rankFeedback = 'Good driving! Clean highway navigation.';

  if (stats.score > 1200 && stats.collisions === 0) {
    rank = 'S';
    rankColor = 'text-amber-400';
    rankFeedback = 'Master Driver! Flawless speed and zero collisions!';
  } else if (stats.score > 800 && stats.collisions <= 2) {
    rank = 'A';
    rankColor = 'text-emerald-400';
    rankFeedback = 'Excellent run! Great reflexes and swift overtakes.';
  } else if (stats.score > 400) {
    rank = 'B';
    rankColor = 'text-blue-400';
    rankFeedback = 'Solid effort! Practice your hand lane shifts for higher scores.';
  } else {
    rank = 'C';
    rankColor = 'text-slate-400';
    rankFeedback = 'Highway patrol noticed too many crashes. Keep practicing!';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col items-center text-center">
        {/* Record Trophy or Badge */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
            <Trophy className="w-8 h-8 fill-current" />
          </div>
          {isNewRecord && (
            <span className="absolute -top-2 -right-6 px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase tracking-wider text-white rounded-full shadow-md">
              NEW RECORD!
            </span>
          )}
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">TIME EXPIRED!</h2>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">120-Second Challenge Complete</p>

        {/* Final Score Hero */}
        <div className="my-5 py-3 px-6 bg-slate-950/70 border border-slate-800 rounded-2xl w-full flex flex-col items-center">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Final Score</span>
          <span className="text-5xl font-black text-amber-300 font-mono tracking-tight my-0.5">
            {stats.score.toLocaleString()}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Best Record: <strong className="text-white font-mono">{stats.bestScore.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-6 text-left">
          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-3">
            <Compass className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Distance</div>
              <div className="text-sm font-bold text-white font-mono">{stats.distance} m</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-3">
            <Coins className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Coins Collected</div>
              <div className="text-sm font-bold text-white font-mono">{stats.coinsCollected}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-3">
            <Car className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Vehicles Overtaken</div>
              <div className="text-sm font-bold text-white font-mono">{stats.vehiclesOvertaken}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Collisions</div>
              <div className="text-sm font-bold text-white font-mono">{stats.collisions}</div>
            </div>
          </div>
        </div>

        {/* Driving Rating */}
        <div className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between mb-6">
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Driving Rank</div>
            <div className="text-xs text-slate-300">{rankFeedback}</div>
          </div>
          <div className={`text-4xl font-black font-mono ${rankColor}`}>{rank}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
