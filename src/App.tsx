/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { HandTracker } from './vision/HandTracker';
import { SoundEffects } from './audio/SoundEffects';
import { AudioSettings, FloatingText, GameState, GameStats, HandStatus } from './types';
import { MainMenu } from './components/MainMenu';
import { CameraSetupModal } from './components/CameraSetupModal';
import { CountdownOverlay } from './components/CountdownOverlay';
import { GameplayHUD } from './components/GameplayHUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // High-level game flow state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [isCameraSetupOpen, setIsCameraSetupOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Realtime stats from 3D game engine
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    bestScore: 0,
    timeLeft: 120,
    distance: 0,
    speed: 80,
    coinsCollected: 0,
    vehiclesOvertaken: 0,
    collisions: 0,
    currentLane: 1,
  });

  // Hand tracking state
  const [handStatus, setHandStatus] = useState<HandStatus>({
    detected: false,
    gesture: 'none',
    palmX: 0.5,
    palmY: 0.5,
    confidence: 0,
  });

  // Settings
  const [inputMode, setInputMode] = useState<'webcam' | 'keyboard'>('webcam');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    soundEnabled: true,
    engineVolume: 0.4,
    sfxVolume: 0.6,
  });

  // Floating notifications
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // 1. Initialize GameEngine inside isolated canvas div
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onFloatingText: (item) => {
        setFloatingTexts((prev) => [...prev.slice(-3), item]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== item.id));
        }, 1200);
      },
      onGameOver: (finalStats) => {
        setStats(finalStats);
        setGameState('game_over');
      },
    });

    gameEngineRef.current = engine;

    return () => {
      engine.dispose();
      gameEngineRef.current = null;
    };
  }, []);

  // 2. Subscribe to HandTracker updates
  useEffect(() => {
    const unsub = HandTracker.subscribe((status) => {
      setHandStatus(status);
      if (inputMode === 'webcam' && gameEngineRef.current) {
        gameEngineRef.current.handleGesture(status.gesture);
      }
    });

    return () => {
      unsub();
    };
  }, [inputMode]);

  // 3. Keyboard fallback controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
        return;
      }

      if (gameState !== 'playing' || !gameEngineRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameEngineRef.current.shiftLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameEngineRef.current.shiftLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        gameEngineRef.current.handleGesture('accelerate');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        gameEngineRef.current.handleGesture('brake');
      } else if (e.key === 'h' || e.key === 'H') {
        gameEngineRef.current.triggerHorn();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !gameEngineRef.current) return;
      if (
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'W' ||
        e.key === 'ArrowDown' ||
        e.key === 's' ||
        e.key === 'S'
      ) {
        gameEngineRef.current.handleGesture('neutral');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Audio settings sync
  const handleUpdateAudio = useCallback((newSettings: AudioSettings) => {
    setAudioSettings(newSettings);
    SoundEffects.setSettings(newSettings.soundEnabled, newSettings.engineVolume, newSettings.sfxVolume);
  }, []);

  // Flow handlers
  const handlePlayClicked = () => {
    const isCalibrated = HandTracker.getCalibration().isCalibrated;
    if (inputMode === 'webcam' && !isCalibrated) {
      // Prompt camera setup first to ensure real tracking works cleanly
      setIsCameraSetupOpen(true);
    } else {
      startCountdown();
    }
  };

  const startCountdown = () => {
    if (inputMode === 'webcam' && !HandTracker.isCameraActive()) {
      HandTracker.startCamera();
    }
    setIsCameraSetupOpen(false);
    setGameState('countdown');
  };

  const handleCountdownComplete = () => {
    setGameState('playing');
    gameEngineRef.current?.startGame();
  };

  const handlePause = () => {
    setGameState('paused');
    gameEngineRef.current?.pauseGame();
  };

  const handleResume = () => {
    setGameState('playing');
    gameEngineRef.current?.resumeGame();
  };

  const handleRestart = () => {
    setGameState('countdown');
    gameEngineRef.current?.stopGame();
  };

  const handleMainMenu = () => {
    setGameState('menu');
    gameEngineRef.current?.stopGame();
  };

  const handleResetBestScore = () => {
    localStorage.removeItem('hand_drive_best_score');
    setStats((prev) => ({ ...prev, bestScore: 0 }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          bestScore={stats.bestScore}
          onPlay={handlePlayClicked}
          onOpenSetup={() => setIsCameraSetupOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isCameraReady={HandTracker.getCalibration().isCalibrated}
        />
      )}

      {/* Countdown 3, 2, 1, GO! */}
      {gameState === 'countdown' && <CountdownOverlay onComplete={handleCountdownComplete} />}

      {/* Active Gameplay HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameplayHUD
          stats={stats}
          handStatus={handStatus}
          inputMode={inputMode}
          floatingTexts={floatingTexts}
          onPause={handlePause}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onRecalibrate={() => setIsCameraSetupOpen(true)}
          soundEnabled={audioSettings.soundEnabled}
          onToggleSound={() =>
            handleUpdateAudio({ ...audioSettings, soundEnabled: !audioSettings.soundEnabled })
          }
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'game_over' && (
        <GameOverModal
          stats={stats}
          onPlayAgain={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Camera Setup & Calibration Modal */}
      <CameraSetupModal
        isOpen={isCameraSetupOpen}
        onClose={() => setIsCameraSetupOpen(false)}
        onReadyToPlay={startCountdown}
        onFallbackToKeyboard={() => {
          setInputMode('keyboard');
          setIsCameraSetupOpen(false);
          startCountdown();
        }}
      />

      {/* How To Play Modal */}
      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioSettings={audioSettings}
        onUpdateAudio={handleUpdateAudio}
        inputMode={inputMode}
        onUpdateInputMode={setInputMode}
        onResetBestScore={handleResetBestScore}
      />
    </div>
  );
}
