import React, { useRef, useEffect, useState } from 'react';
import { Camera, ChevronDown, ChevronUp, Crosshair, AlertCircle } from 'lucide-react';
import { HandTracker } from '../vision/HandTracker';
import { HandStatus } from '../types';

interface WebcamPIPProps {
  handStatus: HandStatus;
  inputMode: 'webcam' | 'keyboard';
}

export const WebcamPIP: React.FC<WebcamPIPProps> = ({ handStatus, inputMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (inputMode === 'webcam') {
      if (canvasRef.current) {
        HandTracker.setPreviewCanvas(canvasRef.current);
      }
      if (!HandTracker.isCameraActive()) {
        HandTracker.startCamera(canvasRef.current);
      }
    }
    return () => {
      HandTracker.setPreviewCanvas(null);
    };
  }, [inputMode]);

  const handleRecalibrate = () => {
    if (handStatus.detected) {
      HandTracker.calibrateCenter(handStatus.palmX);
    }
  };

  if (inputMode === 'keyboard') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/85 backdrop-blur-xs border border-slate-700/80 rounded-xl text-xs text-slate-300 shadow-lg">
        <span className="font-semibold text-white">Controls:</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-amber-300">A/D or ⬅️/➡️</span>
        <span>Steer</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">W / ⬆️</span>
        <span>Gas</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-rose-300">S / ⬇️</span>
        <span>Brake</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-pink-300">H</span>
        <span>Horn</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 w-56 sm:w-64 select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              handStatus.detected ? 'bg-emerald-400 shadow-sm shadow-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            {handStatus.detected ? 'Hand Active' : 'No Hand Detected'}
          </span>
          {handStatus.detected && (
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round(handStatus.confidence * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {handStatus.detected && !isCollapsed && (
            <button
              onClick={handleRecalibrate}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Recalibrate Center"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Camera' : 'Collapse Camera'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video & Skeleton Canvas Body */}
      {!isCollapsed && (
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="w-full h-full object-cover"
          />

          {/* Current Recognized Gesture Overlay */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between px-2 py-1 bg-slate-950/85 backdrop-blur-xs rounded-lg border border-slate-800/80 text-[10px]">
            <span className="text-slate-400 font-medium">Gesture:</span>
            <span
              className={`font-bold uppercase ${
                handStatus.gesture === 'accelerate'
                  ? 'text-emerald-400'
                  : handStatus.gesture === 'brake'
                  ? 'text-rose-400'
                  : handStatus.gesture === 'horn'
                  ? 'text-pink-400'
                  : handStatus.gesture === 'left' || handStatus.gesture === 'right'
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {handStatus.gesture}
            </span>
          </div>
        </div>
      )}

      {/* Collapsed mini indicator */}
      {isCollapsed && (
        <div className="px-3 py-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-400">Gesture:</span>
          <span className="font-bold uppercase text-amber-400">{handStatus.gesture}</span>
        </div>
      )}
    </div>
  );
};
