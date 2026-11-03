import React from 'react';
import { X, Hand, Shield, Coins, Sparkles, CheckCircle2 } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Hand className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">How To Play HAND DRIVE 3D</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Section 1: Hand Tracking */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-2">
              1. Real Hand Movement Controls
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">
              MediaPipe computer vision tracks your palm center through your webcam. Sit comfortably facing the camera with your hand held upright.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-0.5">⬅️ Shift Left</span>
                <span className="text-xs text-slate-400">
                  Move your whole palm to the left. The sports car will smoothly transition to the left lane.
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-0.5">➡️ Shift Right</span>
                <span className="text-xs text-slate-400">
                  Move your whole palm to the right to transition into the right lane.
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">🚀 Open Palm = Accelerate</span>
                <span className="text-xs text-slate-400">
                  Open your fingers wide to hit top boost speed (140 km/h).
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-rose-400 block mb-0.5">🛑 Closed Fist = Brake</span>
                <span className="text-xs text-slate-400">
                  Clench your fingers into a fist to apply sports brakes and slow down quickly (40 km/h).
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 sm:col-span-2">
                <span className="font-bold text-pink-400 block mb-0.5">📢 Index Down = Honk Horn</span>
                <span className="text-xs text-slate-400">
                  Point your index finger downward to honk your horn, alert nearby cars, or prompt vehicles directly ahead to speed up or yield! (Keyboard shortcut: H key).
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Missing hand safe mode */}
          <div className="p-3.5 bg-blue-950/30 border border-blue-900/40 rounded-xl flex items-start gap-3 text-xs text-blue-200">
            <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-0.5">Fail-Safe Coasting</strong>
              If your hand leaves the camera frame, the car safely reduces throttle to 25 km/h and stabilizes steering to prevent accidental crashes.
            </div>
          </div>

          {/* Section 3: Scoring Rules */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-2">
              2. Highway Scoring (120-Second Race)
            </h3>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-xl font-black text-white font-mono">+10</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">Overtake Traffic</div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-xl font-black text-amber-300 font-mono">+25</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">Bonus Coin</div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-xl font-black text-emerald-400 font-mono">+50</div>
                <div className="text-[11px] font-bold text-slate-400 mt-0.5">Checkpoint Arch</div>
              </div>
            </div>
          </div>

          {/* Section 4: Collisions */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
            <strong className="text-white block font-semibold mb-1">Crash Recovery</strong>
            Hitting a car, truck, or bus drops your speed abruptly by 55% with a camera jolt and gives a 2.2-second invulnerability recovery window. No points are deducted, but lost speed costs valuable time!
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
