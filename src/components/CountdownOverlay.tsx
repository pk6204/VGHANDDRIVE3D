import React, { useEffect, useState } from 'react';
import { SoundEffects } from '../audio/SoundEffects';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number | 'GO'>(3);

  useEffect(() => {
    SoundEffects.playCountdown(false);

    const t1 = setTimeout(() => {
      setCount(2);
      SoundEffects.playCountdown(false);
    }, 900);

    const t2 = setTimeout(() => {
      setCount(1);
      SoundEffects.playCountdown(false);
    }, 1800);

    const t3 = setTimeout(() => {
      setCount('GO');
      SoundEffects.playCountdown(true);
    }, 2700);

    const t4 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-2xs select-none pointer-events-none">
      <div className="flex flex-col items-center animate-bounce">
        <div
          key={count}
          className={`text-8xl md:text-9xl font-black tracking-tight drop-shadow-2xl transition-transform duration-300 scale-110 ${
            count === 'GO' ? 'text-emerald-400' : 'text-amber-400'
          }`}
        >
          {count}
        </div>
        <p className="mt-4 text-sm uppercase tracking-widest font-bold text-white/90 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700">
          {count === 'GO' ? 'GREEN LIGHT!' : 'STEER WITH HAND'}
        </p>
      </div>
    </div>
  );
};
