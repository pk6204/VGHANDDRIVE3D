import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Crosshair, AlertTriangle, ArrowRight, X, Keyboard, Volume2 } from 'lucide-react';
import { HandTracker } from '../vision/HandTracker';
import { HandStatus } from '../types';

interface CameraSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReadyToPlay: () => void;
  onFallbackToKeyboard: () => void;
}

export const CameraSetupModal: React.FC<CameraSetupModalProps> = ({
  isOpen,
  onClose,
  onReadyToPlay,
  onFallbackToKeyboard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handStatus, setHandStatus] = useState<HandStatus>({
    detected: false,
    gesture: 'none',
    palmX: 0.5,
    palmY: 0.5,
    confidence: 0,
  });
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    const init = async () => {
      if (!canvasRef.current) return;

      const success = await HandTracker.startCamera(canvasRef.current);
      if (!isMounted) return;

      if (!success) {
        setErrorMessage(
          HandTracker.getErrorMessage() || 'Could not access webcam. Please ensure permission is granted.'
        );
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    };

    const unsub = HandTracker.subscribe((status) => {
      if (isMounted) {
        setHandStatus(status);
      }
    });

    init();

    return () => {
      isMounted = false;
      unsub();
      // Detach preview canvas, but keep persistent tracking stream alive for gameplay
      HandTracker.setPreviewCanvas(null);
    };
  }, [isOpen]);

  const handleCalibrate = () => {
    if (handStatus.detected) {
      HandTracker.calibrateCenter(handStatus.palmX);
      setIsCalibrated(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Webcam Hand Tracking Setup</h2>
              <p className="text-xs text-slate-400">Position your hand in front of your camera to calibrate controls</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Webcam Preview Area */}
          <div className="relative w-full aspect-video max-h-[340px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Canvas for rendering mirrored video & hand skeleton landmarks */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover z-10"
            />

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Starting MediaPipe AI Hand Tracker...</p>
                <p className="text-xs text-slate-400">Please allow camera permissions if prompted</p>
              </div>
            )}

            {/* Error State */}
            {errorMessage && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
                <h3 className="text-base font-bold text-white mb-1">Webcam Access Notice</h3>
                <p className="text-sm text-slate-300 max-w-md mb-4">{errorMessage}</p>
                <button
                  onClick={onFallbackToKeyboard}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all cursor-pointer"
                >
                  <Keyboard className="w-4 h-4" />
                  <span>Play with Keyboard Controls</span>
                </button>
              </div>
            )}

            {/* Realtime detection overlay badge */}
            {!isLoading && !errorMessage && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs shadow-md">
                <span
                  className={`w-2 h-2 rounded-full ${
                    handStatus.detected ? 'bg-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span className="font-semibold text-white">
                  {handStatus.detected ? 'Hand Detected' : 'Hold Hand in View'}
                </span>
                {handStatus.detected && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({Math.round(handStatus.confidence * 100)}%)
                  </span>
                )}
              </div>
            )}

            {/* Recognized gesture badge */}
            {!isLoading && !errorMessage && handStatus.detected && (
              <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-bold text-amber-400 shadow-md">
                Gesture: {handStatus.gesture.toUpperCase()}
              </div>
            )}
          </div>

          {/* Calibration & Status Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calibration box */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Center Calibration</span>
                  {isCalibrated && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Calibrated
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Hold your hand naturally in the center of the frame and click Calibrate to set your neutral steering baseline.
                </p>
              </div>

              <button
                onClick={handleCalibrate}
                disabled={!handStatus.detected}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-sm rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Crosshair className="w-4 h-4" />
                <span>Calibrate Current Hand Position</span>
              </button>
            </div>

            {/* Gestures Reference */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Gesture Guide</div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-300">Move Hand Left</span>
                <span className={`font-semibold ${handStatus.gesture === 'left' ? 'text-amber-400' : 'text-slate-400'}`}>
                  Left Lane
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-300">Move Hand Right</span>
                <span className={`font-semibold ${handStatus.gesture === 'right' ? 'text-amber-400' : 'text-slate-400'}`}>
                  Right Lane
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-300">Open Palm (Spread Fingers)</span>
                <span className={`font-semibold ${handStatus.gesture === 'accelerate' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Accelerate (140 km/h)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-300">Closed Fist (Clench)</span>
                <span className={`font-semibold ${handStatus.gesture === 'brake' ? 'text-rose-400' : 'text-slate-400'}`}>
                  Brake (40 km/h)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-300">Index Pointing Down</span>
                <span className={`font-semibold ${handStatus.gesture === 'horn' ? 'text-pink-400' : 'text-slate-400'}`}>
                  Honk Horn 📢
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={onFallbackToKeyboard}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Keyboard className="w-4 h-4 text-blue-400" />
            <span>Switch to Keyboard (Arrow keys / WASD)</span>
          </button>

          <button
            onClick={onReadyToPlay}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <span>Ready to Drive</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
