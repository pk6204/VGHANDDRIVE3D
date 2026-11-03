import { Lane } from '../types';

export const GAME_CONSTANTS = {
  // Road dimensions
  LANE_WIDTH: 4.0,
  LANE_POSITIONS: [-4.0, 0.0, 4.0] as const, // Lane 0, 1, 2
  ROAD_WIDTH: 15.0,
  ROAD_LENGTH: 300.0,
  CHUNK_LENGTH: 200.0,
  ACTIVE_CHUNKS: 4,

  // Speeds in km/h (visual)
  SPEED_IDLE: 25,
  SPEED_BASE: 80,
  SPEED_MAX: 140,
  SPEED_BRAKE: 40,
  ACCELERATION_RATE: 45, // km/h per second
  BRAKING_RATE: 70,
  COAST_DECEL_RATE: 20,

  // Conversion from km/h to 3D world units/sec
  KMH_TO_UNITS: 0.45,

  // Gameplay
  TOTAL_TIME: 120, // 120 seconds
  CHECKPOINT_INTERVAL: 400, // Every 400m
  COLLISION_INVULNERABILITY: 2.2, // seconds
  COLLISION_SPEED_DROP: 0.45, // drop to 45% of speed

  // Scoring
  POINTS_OVERTAKE: 10,
  POINTS_COIN: 25,
  POINTS_CHECKPOINT: 50,

  // Camera
  CAMERA_OFFSET_Y: 3.8,
  CAMERA_OFFSET_Z: 9.5,
  CAMERA_LOOK_Y: 1.5,
  CAMERA_LOOK_Z: -18.0,
};

export const getLaneX = (lane: Lane): number => {
  return GAME_CONSTANTS.LANE_POSITIONS[lane] ?? 0;
};
