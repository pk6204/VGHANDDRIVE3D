import React from 'react';
import { X, Volume2, VolumeX, Keyboard, Camera, Trash2 } from 'lucide-react';
import { AudioSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onUpdateAudio: (settings: AudioSettings) => void;
  inputMode: 'webcam' | 'keyboard';
  onUpdateInputMode: (mode: 'webcam' | 'keyboard') => void;
  onResetBestScore: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onUpdateAudio,
  inputMode,
  onUpdateInputMode,
  onResetBestScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Game Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input Method */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Primary Controls
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onUpdateInputMode('webcam')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'webcam'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Webcam Hand</span>
              </button>

              <button
                onClick={() => onUpdateInputMode('keyboard')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'keyboard'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Keyboard Fallback</span>
              </button>
            </div>
          </div>

          {/* Sound Mute Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              {audioSettings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-rose-400" />
              )}
              <div>
                <div className="text-xs font-bold text-white">Audio Sound Effects</div>
                <div className="text-[11px] text-slate-400">Engine roar, collisions, coin chimes</div>
              </div>
            </div>

            <button
              onClick={() =>
                onUpdateAudio({
                  ...audioSettings,
                  soundEnabled: !audioSettings.soundEnabled,
                })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                audioSettings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {audioSettings.soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Volume Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Engine Sound Volume</span>
                <span className="font-mono text-slate-400">{Math.round(audioSettings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.engineVolume}
                onChange={(e) =>
                  onUpdateAudio({
                    ...audioSettings,
                    engineVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">SFX Sound Volume</span>
                <span className="font-mono text-slate-400">{Math.round(audioSettings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.sfxVolume}
                onChange={(e) =>
                  onUpdateAudio({
                    ...audioSettings,
                    sfxVolume: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Reset Best Score */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Clear Local Best Score</span>
            <button
              onClick={onResetBestScore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Record</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
