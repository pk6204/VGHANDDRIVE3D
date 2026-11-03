import type * as THREE from 'three';

export type GameState = 'menu' | 'camera_setup' | 'countdown' | 'playing' | 'paused' | 'game_over';

export type Lane = 0 | 1 | 2; // 0 = Left, 1 = Center, 2 = Right

export type GestureType = 'neutral' | 'left' | 'right' | 'accelerate' | 'brake' | 'horn' | 'none';

export interface HandStatus {
  detected: boolean;
  gesture: GestureType;
  palmX: number; // Normalized 0 to 1
  palmY: number; // Normalized 0 to 1
  confidence: number;
  landmarks?: { x: number; y: number; z: number }[];
}

export interface CalibrationData {
  centerX: number;
  deadzone: number;
  isCalibrated: boolean;
}

export interface TrafficVehicle {
  id: number;
  type: 'sedan' | 'truck' | 'bus';
  mesh: THREE.Group;
  lane: Lane;
  z: number;
  speed: number;
  length: number;
  width: number;
  overtaken: boolean;
  color: string;
}

export interface CoinItem {
  id: number;
  mesh: THREE.Group;
  lane: Lane;
  z: number;
  collected: boolean;
}

export interface CheckpointItem {
  id: number;
  mesh: THREE.Group;
  z: number;
  passed: boolean;
}

export interface FloatingText {
  id: number;
  text: string;
  points: number;
  type: 'overtake' | 'coin' | 'checkpoint' | 'collision' | 'horn';
  timestamp: number;
}

export interface GameStats {
  score: number;
  bestScore: number;
  timeLeft: number;
  distance: number;
  speed: number;
  coinsCollected: number;
  vehiclesOvertaken: number;
  collisions: number;
  currentLane: Lane;
}

export interface AudioSettings {
  soundEnabled: boolean;
  engineVolume: number;
  sfxVolume: number;
}
