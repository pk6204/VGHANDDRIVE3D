import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SoundEffects } from '../audio/SoundEffects';
import { CheckpointItem, CoinItem, FloatingText, GameStats, GestureType, Lane, TrafficVehicle } from '../types';
import { GAME_CONSTANTS, getLaneX } from './constants';
import {
  createCheckpointArch,
  createCoin,
  createMountainCluster,
  createPlayerCar,
  createTrafficBus,
  createTrafficSedan,
  createTrafficTruck,
  createTree,
  PlayerCarGroup,
} from './models';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onFloatingText: (item: FloatingText) => void;
  onGameOver: (stats: GameStats) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator | null = null;

  // Scene elements
  private playerCar: PlayerCarGroup;
  private roadChunks: THREE.Group[] = [];
  private groundPlane: THREE.Mesh;
  private trafficVehicles: TrafficVehicle[] = [];
  private coins: CoinItem[] = [];
  private checkpoints: CheckpointItem[] = [];
  private particles: { mesh: THREE.Points; life: number; maxLife: number; velocities: Float32Array }[] = [];
  private mountainCluster: THREE.Group;

  // Road continuous tracking
  private chunkLength: number = 160.0;
  private activeChunkCount: number = 6;
  private furthestAheadZ: number = -640.0;

  // Game state
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  // Driving parameters
  private currentLane: Lane = 1; // 0=Left, 1=Center, 2=Right
  private targetLaneX: number = 0;
  private currentCarX: number = 0;
  private currentSpeedKmh: number = GAME_CONSTANTS.SPEED_BASE;
  private targetSpeedKmh: number = GAME_CONSTANTS.SPEED_BASE;
  private distanceTraveled: number = 0;
  private score: number = 0;
  private bestScore: number = 0;
  private timeLeft: number = GAME_CONSTANTS.TOTAL_TIME;
  private coinsCollected: number = 0;
  private vehiclesOvertaken: number = 0;
  private collisions: number = 0;

  // Invulnerability & Camera shake
  private invulnerableTimer: number = 0;
  private cameraShakeIntensity: number = 0;

  // Horn cooldown
  private lastHornTime: number = 0;

  // Spawn tracking
  private nextTrafficZ: number = -70;
  private nextCoinZ: number = -45;
  private nextCheckpointDistance: number = GAME_CONSTANTS.CHECKPOINT_INTERVAL;
  private vehicleIdCounter: number = 1;
  private coinIdCounter: number = 1;
  private checkpointIdCounter: number = 1;
  private textIdCounter: number = 1;

  // Lane input state tracking to require neutral return before consecutive shifts
  private hasHandRecentInput: boolean = false;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Load best score from local storage
    try {
      const saved = localStorage.getItem('hand_drive_best_score');
      if (saved) this.bestScore = parseInt(saved, 10) || 0;
    } catch {
      this.bestScore = 0;
    }

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x93c5fd); // Clear daylight sky blue
    this.scene.fog = new THREE.Fog(0x93c5fd, 160, 320); // Horizon fade

    // 2. Camera: proper near/far planes
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.2, 600);
    this.camera.position.set(0, GAME_CONSTANTS.CAMERA_OFFSET_Y, GAME_CONSTANTS.CAMERA_OFFSET_Z);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Environment map
    try {
      this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    } catch (e) {
      console.warn('Could not initialize PMREMGenerator:', e);
    }

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Seamless Infinite Ground Plane (prevents ANY black or empty void under scenery)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f471e, // Rich dark countryside green
      roughness: 0.96,
      metalness: 0.02,
    });
    const groundGeo = new THREE.PlaneGeometry(700, 700);
    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = -0.12;
    this.groundPlane.receiveShadow = true;
    this.groundPlane.frustumCulled = false;
    this.scene.add(this.groundPlane);

    // 7. Mountains & Initial Highway Chunks
    this.mountainCluster = createMountainCluster();
    this.scene.add(this.mountainCluster);

    this.initRoadChunks();

    // 8. Player Car
    this.playerCar = createPlayerCar();
    this.playerCar.position.set(0, 0, 0);
    this.scene.add(this.playerCar);

    // Window resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Initial render
    this.renderer.render(this.scene, this.camera);
  }

  private setupLighting() {
    // Balanced warm sunlight
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    sunLight.position.set(25, 45, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 140;
    const d = 30;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Cool sky fill light
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 1.15);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);
  }

  /**
   * Initializes 6 road chunks spanning behind and ahead of player.
   */
  private initRoadChunks() {
    this.roadChunks = [];
    const chunkCount = this.activeChunkCount;
    const chunkLen = this.chunkLength;

    for (let i = 0; i < chunkCount; i++) {
      // Chunk 0 is placed BEHIND the player at +chunkLen, rest extend forward
      const zOffset = (1 - i) * chunkLen;
      const chunk = this.createRoadChunk(zOffset);
      this.roadChunks.push(chunk);
      this.scene.add(chunk);
    }

    this.furthestAheadZ = (1 - (chunkCount - 1)) * chunkLen;
  }

  private createRoadChunk(zOffset: number): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = zOffset;

    const chunkLen = this.chunkLength;
    const roadWidth = GAME_CONSTANTS.ROAD_WIDTH;

    // 1. Asphalt Road Surface
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1,
    });
    const roadGeo = new THREE.PlaneGeometry(roadWidth, chunkLen);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0, -chunkLen / 2);
    roadMesh.receiveShadow = true;
    roadMesh.frustumCulled = false; // Prevent premature culling
    chunk.add(roadMesh);

    // 2. Dashed Lane Markings with polygonOffset to prevent coplanar Z-fighting
    const stripeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const dashLength = 3.5;
    const gapLength = 4.5;
    const stripeCount = Math.floor(chunkLen / (dashLength + gapLength));

    const stripeWidth = 0.22;
    const leftDividerX = -GAME_CONSTANTS.LANE_WIDTH / 2;
    const rightDividerX = GAME_CONSTANTS.LANE_WIDTH / 2;
    const stripeGeo = new THREE.PlaneGeometry(stripeWidth, dashLength);

    for (let i = 0; i < stripeCount; i++) {
      const z = -(i * (dashLength + gapLength) + dashLength / 2);

      const leftStripe = new THREE.Mesh(stripeGeo, stripeMat);
      leftStripe.rotation.x = -Math.PI / 2;
      leftStripe.position.set(leftDividerX, 0.02, z);
      leftStripe.frustumCulled = false;
      chunk.add(leftStripe);

      const rightStripe = new THREE.Mesh(stripeGeo, stripeMat);
      rightStripe.rotation.x = -Math.PI / 2;
      rightStripe.position.set(rightDividerX, 0.02, z);
      rightStripe.frustumCulled = false;
      chunk.add(rightStripe);
    }

    // 3. Solid Shoulder Lines
    const shoulderMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const shoulderGeo = new THREE.PlaneGeometry(0.35, chunkLen);

    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.rotation.x = -Math.PI / 2;
    leftShoulder.position.set(-roadWidth / 2 + 0.35, 0.02, -chunkLen / 2);
    leftShoulder.frustumCulled = false;
    chunk.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.rotation.x = -Math.PI / 2;
    rightShoulder.position.set(roadWidth / 2 - 0.35, 0.02, -chunkLen / 2);
    rightShoulder.frustumCulled = false;
    chunk.add(rightShoulder);

    // 4. Guardrails with Reflectors
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.8,
    });
    const railGeo = new THREE.BoxGeometry(0.2, 0.5, chunkLen);

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-roadWidth / 2 - 0.2, 0.45, -chunkLen / 2);
    leftRail.castShadow = true;
    leftRail.frustumCulled = false;
    chunk.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(roadWidth / 2 + 0.2, 0.45, -chunkLen / 2);
    rightRail.castShadow = true;
    rightRail.frustumCulled = false;
    chunk.add(rightRail);

    // 5. Roadside Verges
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x275924,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    });
    const vergeWidth = 100;
    const vergeGeo = new THREE.PlaneGeometry(vergeWidth, chunkLen);

    const leftVerge = new THREE.Mesh(vergeGeo, grassMat);
    leftVerge.rotation.x = -Math.PI / 2;
    leftVerge.position.set(-roadWidth / 2 - vergeWidth / 2 - 0.3, -0.04, -chunkLen / 2);
    leftVerge.receiveShadow = true;
    leftVerge.frustumCulled = false;
    chunk.add(leftVerge);

    const rightVerge = new THREE.Mesh(vergeGeo, grassMat);
    rightVerge.rotation.x = -Math.PI / 2;
    rightVerge.position.set(roadWidth / 2 + vergeWidth / 2 + 0.3, -0.04, -chunkLen / 2);
    rightVerge.receiveShadow = true;
    rightVerge.frustumCulled = false;
    chunk.add(rightVerge);

    // 6. Natural Roadside Trees
    const treeSpacing = 20.0;
    const treeCount = Math.floor(chunkLen / treeSpacing);

    for (let i = 0; i < treeCount; i++) {
      const z = -(i * treeSpacing + Math.random() * 6);
      const isPine = Math.random() > 0.45;

      const treeL = createTree(isPine ? 'pine' : 'oak');
      treeL.position.set(-roadWidth / 2 - 4 - Math.random() * 12, 0, z);
      const scaleL = 0.8 + Math.random() * 0.4;
      treeL.scale.set(scaleL, scaleL, scaleL);
      chunk.add(treeL);

      const treeR = createTree(!isPine ? 'pine' : 'oak');
      treeR.position.set(roadWidth / 2 + 4 + Math.random() * 12, 0, z);
      const scaleR = 0.8 + Math.random() * 0.4;
      treeR.scale.set(scaleR, scaleR, scaleR);
      chunk.add(treeR);
    }

    return chunk;
  }

  /**
   * Resets entire game world and road chunks cleanly.
   * Eliminates the disappearing road bug on restarts!
   */
  public startGame() {
    this.score = 0;
    this.timeLeft = GAME_CONSTANTS.TOTAL_TIME;
    this.distanceTraveled = 0;
    this.coinsCollected = 0;
    this.vehiclesOvertaken = 0;
    this.collisions = 0;
    this.currentLane = 1;
    this.targetLaneX = 0;
    this.currentCarX = 0;
    this.currentSpeedKmh = GAME_CONSTANTS.SPEED_BASE;
    this.targetSpeedKmh = GAME_CONSTANTS.SPEED_BASE;
    this.invulnerableTimer = 0;
    this.hasHandRecentInput = false;
    this.lastHornTime = 0;

    // Reset player car position
    this.playerCar.position.set(0, 0, 0);
    this.playerCar.rotation.set(0, 0, 0);

    // Reset mountains and ground plane to origin
    this.mountainCluster.position.set(0, 0, 0);
    this.groundPlane.position.set(0, -0.12, 0);

    // RESET ALL ROAD CHUNKS TO FIXED CONTIGUOUS STARTING POSITIONS
    const chunkLen = this.chunkLength;
    this.roadChunks.forEach((chunk, i) => {
      chunk.position.z = (1 - i) * chunkLen;
    });
    this.furthestAheadZ = (1 - (this.activeChunkCount - 1)) * chunkLen;

    // Clear and remove existing entities from scene
    this.trafficVehicles.forEach((v) => this.scene.remove(v.mesh));
    this.trafficVehicles = [];

    this.coins.forEach((c) => this.scene.remove(c.mesh));
    this.coins = [];

    this.checkpoints.forEach((cp) => this.scene.remove(cp.mesh));
    this.checkpoints = [];

    this.nextTrafficZ = -70;
    this.nextCoinZ = -45;
    this.nextCheckpointDistance = GAME_CONSTANTS.CHECKPOINT_INTERVAL;

    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();

    SoundEffects.startEngine();

    if (!this.animationFrameId) {
      this.animate();
    }
  }

  public pauseGame() {
    this.isPaused = true;
    SoundEffects.stopEngine();
  }

  public resumeGame() {
    this.isPaused = false;
    this.clock.getDelta(); // Clear delta accumulation to prevent position jump
    SoundEffects.startEngine();
  }

  public stopGame() {
    this.isRunning = false;
    this.isPaused = false;
    SoundEffects.stopEngine();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Process recognized hand gesture
   */
  public handleGesture(gesture: GestureType) {
    if (!this.isRunning || this.isPaused) return;

    // 1. Horn gesture
    if (gesture === 'horn') {
      const now = performance.now();
      if (now - this.lastHornTime > 650) {
        this.lastHornTime = now;
        SoundEffects.playHorn();

        this.callbacks.onFloatingText({
          id: this.textIdCounter++,
          text: 'HONK! 📢',
          points: 0,
          type: 'horn',
          timestamp: Date.now(),
        });

        // Traffic vehicles directly ahead in current lane react
        this.trafficVehicles.forEach((v) => {
          if (v.lane === this.currentLane && v.z < this.playerCar.position.z && v.z > this.playerCar.position.z - 45) {
            v.speed = Math.min(100, v.speed + 15); // Accelerates out of your way!
          }
        });
      }
      return;
    }

    // 2. Lane change trigger
    if (gesture === 'left') {
      if (!this.hasHandRecentInput) {
        this.shiftLane(-1);
        this.hasHandRecentInput = true;
      }
    } else if (gesture === 'right') {
      if (!this.hasHandRecentInput) {
        this.shiftLane(1);
        this.hasHandRecentInput = true;
      }
    } else {
      // Returned towards center / neutral or accelerate / brake -> re-arm steering
      this.hasHandRecentInput = false;
    }

    // 3. Speed control
    if (gesture === 'accelerate') {
      this.targetSpeedKmh = GAME_CONSTANTS.SPEED_MAX;
      this.playerCar.setBraking(false);
    } else if (gesture === 'brake') {
      this.targetSpeedKmh = GAME_CONSTANTS.SPEED_BRAKE;
      this.playerCar.setBraking(true);
      SoundEffects.playBrake();
    } else if (gesture === 'neutral') {
      this.targetSpeedKmh = GAME_CONSTANTS.SPEED_BASE;
      this.playerCar.setBraking(false);
    } else if (gesture === 'none') {
      // Hand missing: safely coast and slow down to avoid runaway crash
      this.targetSpeedKmh = GAME_CONSTANTS.SPEED_IDLE;
      this.playerCar.setBraking(false);
    }
  }

  public shiftLane(direction: -1 | 1) {
    const newLane = (this.currentLane + direction) as Lane;
    if (newLane >= 0 && newLane <= 2) {
      this.currentLane = newLane;
      this.targetLaneX = getLaneX(newLane);
    }
  }

  public triggerHorn() {
    this.handleGesture('horn');
  }

  /**
   * Main game loop
   */
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.isRunning || this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.08); // Clamp any tab-switch delays

    this.updatePhysics(delta);
    this.updateRoadAndEnvironment(delta);
    this.updateTraffic(delta);
    this.updateCoinsAndCheckpoints(delta);
    this.updateCollisions(delta);
    this.updateParticles(delta);
    this.updateCamera(delta);
    this.updateTimer(delta);

    // Sync sound engine
    const speedRatio =
      (this.currentSpeedKmh - GAME_CONSTANTS.SPEED_IDLE) /
      (GAME_CONSTANTS.SPEED_MAX - GAME_CONSTANTS.SPEED_IDLE);
    SoundEffects.updateEngine(Math.max(0, Math.min(1, speedRatio)));

    // Emit stats to React HUD
    this.callbacks.onStatsUpdate({
      score: this.score,
      bestScore: this.bestScore,
      timeLeft: Math.max(0, Math.ceil(this.timeLeft)),
      distance: Math.floor(this.distanceTraveled),
      speed: Math.round(this.currentSpeedKmh),
      coinsCollected: this.coinsCollected,
      vehiclesOvertaken: this.vehiclesOvertaken,
      collisions: this.collisions,
      currentLane: this.currentLane,
    });

    this.renderer.render(this.scene, this.camera);
  };

  private updatePhysics(delta: number) {
    // Speed acceleration / deceleration smoothing
    if (this.currentSpeedKmh < this.targetSpeedKmh) {
      this.currentSpeedKmh = Math.min(
        this.targetSpeedKmh,
        this.currentSpeedKmh + GAME_CONSTANTS.ACCELERATION_RATE * delta
      );
    } else if (this.currentSpeedKmh > this.targetSpeedKmh) {
      const decel =
        this.targetSpeedKmh === GAME_CONSTANTS.SPEED_BRAKE
          ? GAME_CONSTANTS.BRAKING_RATE
          : GAME_CONSTANTS.COAST_DECEL_RATE;
      this.currentSpeedKmh = Math.max(this.targetSpeedKmh, this.currentSpeedKmh - decel * delta);
    }

    // Distance accumulated
    const deltaDistance = (this.currentSpeedKmh / 3.6) * delta;
    this.distanceTraveled += deltaDistance;

    // Smooth horizontal lane transition
    const prevX = this.currentCarX;
    this.currentCarX = THREE.MathUtils.damp(this.currentCarX, this.targetLaneX, 13.0, delta);
    const lateralVel = (this.currentCarX - prevX) / delta;

    this.playerCar.position.x = this.currentCarX;

    // Car bank/roll tilt and slight yaw when turning
    this.playerCar.rotation.z = -lateralVel * 0.025;
    this.playerCar.rotation.y = lateralVel * 0.035;

    // Rotate player car wheels
    const wheelRotDelta = (this.currentSpeedKmh * GAME_CONSTANTS.KMH_TO_UNITS * delta) / 0.38;
    this.playerCar.wheels.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    // Invulnerability blinking after crash
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      const blink = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
      this.playerCar.visible = blink;
      if (this.invulnerableTimer <= 0) {
        this.playerCar.visible = true;
      }
    }
  }

  /**
   * Flawless continuous road recycling:
   * Chunks are guaranteed contiguous with zero gaps.
   * Recycles chunk only when its front has completely cleared behind camera!
   */
  private updateRoadAndEnvironment(delta: number) {
    const chunkLen = this.chunkLength;
    const playerZ = this.playerCar.position.z;

    // Move player forward in world Z
    const forwardStep = this.currentSpeedKmh * GAME_CONSTANTS.KMH_TO_UNITS * delta;
    this.playerCar.position.z -= forwardStep;

    // Follow mountains and seamless ground plane with player
    this.mountainCluster.position.z = this.playerCar.position.z;
    this.groundPlane.position.z = this.playerCar.position.z;

    // Safe continuous road chunk recycling
    // A chunk extends from chunk.position.z to (chunk.position.z - chunkLen).
    // It is only behind the camera when (chunk.position.z - chunkLen) is behind the camera!
    const cameraZ = this.camera.position.z;

    this.roadChunks.forEach((chunk) => {
      // Trailing edge of chunk:
      const chunkBackZ = chunk.position.z - chunkLen;
      // Only recycle when trailing edge has passed 30 units behind the camera
      if (chunkBackZ > cameraZ + 30.0) {
        this.furthestAheadZ -= chunkLen;
        chunk.position.z = this.furthestAheadZ;
      }
    });
  }

  private updateTraffic(delta: number) {
    const playerZ = this.playerCar.position.z;

    // 1. Spawn traffic ahead
    if (playerZ - 130 < this.nextTrafficZ) {
      this.spawnTrafficWave();
    }

    // 2. Move active traffic and check for overtakes
    for (let i = this.trafficVehicles.length - 1; i >= 0; i--) {
      const v = this.trafficVehicles[i];

      const trafficStep = v.speed * GAME_CONSTANTS.KMH_TO_UNITS * delta;
      v.z -= trafficStep;
      v.mesh.position.z = v.z;

      // Overtake detection
      if (!v.overtaken && playerZ < v.z - v.length / 2) {
        v.overtaken = true;
        this.vehiclesOvertaken++;
        this.score += GAME_CONSTANTS.POINTS_OVERTAKE;
        this.checkBestScore();
        SoundEffects.playOvertake();

        this.callbacks.onFloatingText({
          id: this.textIdCounter++,
          text: `+${GAME_CONSTANTS.POINTS_OVERTAKE} OVERTAKE!`,
          points: GAME_CONSTANTS.POINTS_OVERTAKE,
          type: 'overtake',
          timestamp: Date.now(),
        });
      }

      // Cleanup traffic far behind
      if (v.z > playerZ + 45) {
        this.scene.remove(v.mesh);
        this.trafficVehicles.splice(i, 1);
      }
    }
  }

  /**
   * Spawns traffic vehicles ensuring fair gap exists (never blocks all 3 lanes at once)
   */
  private spawnTrafficWave() {
    const playerZ = this.playerCar.position.z;
    const spawnZ = playerZ - 120 - Math.random() * 25;

    const timeProgress = 1 - Math.max(0, this.timeLeft / GAME_CONSTANTS.TOTAL_TIME);
    const availableLanes: Lane[] = [0, 1, 2];
    const laneCountToOccupy = Math.random() < 0.35 + timeProgress * 0.3 ? 2 : 1;
    const shuffledLanes = availableLanes.sort(() => Math.random() - 0.5);

    for (let i = 0; i < laneCountToOccupy; i++) {
      const lane = shuffledLanes[i];
      const zOffset = i * 20 * (Math.random() * 0.4 + 0.8);
      this.createTrafficVehicle(lane, spawnZ - zOffset);
    }

    this.nextTrafficZ = spawnZ - (40 - timeProgress * 12);
  }

  private createTrafficVehicle(lane: Lane, z: number) {
    const rand = Math.random();
    let type: 'sedan' | 'truck' | 'bus' = 'sedan';
    let length = 4.2;
    let width = 1.85;
    let speed = 62 + Math.random() * 15;

    const sedanColors = [0x2563eb, 0x16a34a, 0x475569, 0xf8fafc, 0xd97706];
    const truckColors = [0xb91c1c, 0x1e3a8a, 0x334155, 0x047857];
    const busColors = [0x0284c7, 0x7c3aed, 0xca8a04];

    let mesh: THREE.Group;

    if (rand < 0.6) {
      type = 'sedan';
      const c = sedanColors[Math.floor(Math.random() * sedanColors.length)];
      mesh = createTrafficSedan(c);
    } else if (rand < 0.85) {
      type = 'truck';
      length = 6.2;
      width = 2.1;
      speed = 46 + Math.random() * 10;
      const c = truckColors[Math.floor(Math.random() * truckColors.length)];
      mesh = createTrafficTruck(c);
    } else {
      type = 'bus';
      length = 7.5;
      width = 2.2;
      speed = 52 + Math.random() * 10;
      const c = busColors[Math.floor(Math.random() * busColors.length)];
      mesh = createTrafficBus(c);
    }

    mesh.position.set(getLaneX(lane), 0, z);
    this.scene.add(mesh);

    this.trafficVehicles.push({
      id: this.vehicleIdCounter++,
      type,
      mesh,
      lane,
      z,
      speed,
      length,
      width,
      overtaken: false,
      color: `#${mesh.id.toString(16)}`,
    });
  }

  private updateCoinsAndCheckpoints(delta: number) {
    const playerZ = this.playerCar.position.z;
    const time = this.clock.getElapsedTime();

    // 1. Spawn Coins
    if (playerZ - 100 < this.nextCoinZ) {
      const freeLane = Math.floor(Math.random() * 3) as Lane;
      const coinMesh = createCoin();
      coinMesh.position.set(getLaneX(freeLane), 1.2, this.nextCoinZ);
      this.scene.add(coinMesh);

      this.coins.push({
        id: this.coinIdCounter++,
        mesh: coinMesh,
        lane: freeLane,
        z: this.nextCoinZ,
        collected: false,
      });

      this.nextCoinZ -= 38 + Math.random() * 25;
    }

    // 2. Animate and collect coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.mesh.rotation.y += delta * 4.0;
      coin.mesh.position.y = 1.2 + Math.sin(time * 5 + coin.id) * 0.18;

      const distZ = Math.abs(coin.z - playerZ);
      const distX = Math.abs(coin.mesh.position.x - this.currentCarX);

      if (!coin.collected && distZ < 2.0 && distX < 1.4) {
        coin.collected = true;
        this.coinsCollected++;
        this.score += GAME_CONSTANTS.POINTS_COIN;
        this.checkBestScore();
        SoundEffects.playCoin();
        this.spawnGoldSparkles(coin.mesh.position.x, coin.mesh.position.y, coin.z);

        this.callbacks.onFloatingText({
          id: this.textIdCounter++,
          text: `+${GAME_CONSTANTS.POINTS_COIN} BONUS COIN!`,
          points: GAME_CONSTANTS.POINTS_COIN,
          type: 'coin',
          timestamp: Date.now(),
        });

        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
        continue;
      }

      if (coin.z > playerZ + 25) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
      }
    }

    // 3. Checkpoints
    if (this.distanceTraveled >= this.nextCheckpointDistance) {
      const arch = createCheckpointArch();
      const archZ = playerZ - 90;
      arch.position.set(0, 0, archZ);
      this.scene.add(arch);

      this.checkpoints.push({
        id: this.checkpointIdCounter++,
        mesh: arch,
        z: archZ,
        passed: false,
      });

      this.nextCheckpointDistance += GAME_CONSTANTS.CHECKPOINT_INTERVAL;
    }

    for (let i = this.checkpoints.length - 1; i >= 0; i--) {
      const cp = this.checkpoints[i];
      if (!cp.passed && playerZ <= cp.z) {
        cp.passed = true;
        this.score += GAME_CONSTANTS.POINTS_CHECKPOINT;
        this.checkBestScore();
        SoundEffects.playCheckpoint();
        this.spawnGoldSparkles(0, 4.0, cp.z);

        this.callbacks.onFloatingText({
          id: this.textIdCounter++,
          text: `+${GAME_CONSTANTS.POINTS_CHECKPOINT} CHECKPOINT!`,
          points: GAME_CONSTANTS.POINTS_CHECKPOINT,
          type: 'checkpoint',
          timestamp: Date.now(),
        });
      }

      if (cp.z > playerZ + 60) {
        this.scene.remove(cp.mesh);
        this.checkpoints.splice(i, 1);
      }
    }
  }

  private updateCollisions(delta: number) {
    if (this.invulnerableTimer > 0) return;

    const playerX = this.currentCarX;
    const playerZ = this.playerCar.position.z;
    const playerHalfW = 0.9;
    const playerHalfL = 2.0;

    for (const v of this.trafficVehicles) {
      const vX = v.mesh.position.x;
      const vZ = v.z;
      const vHalfW = v.width / 2;
      const vHalfL = v.length / 2;

      if (
        Math.abs(playerX - vX) < playerHalfW + vHalfW &&
        Math.abs(playerZ - vZ) < playerHalfL + vHalfL
      ) {
        this.triggerCollision();
        break;
      }
    }
  }

  private triggerCollision() {
    this.collisions++;
    this.invulnerableTimer = GAME_CONSTANTS.COLLISION_INVULNERABILITY;
    this.cameraShakeIntensity = 0.65;

    this.currentSpeedKmh = Math.max(
      GAME_CONSTANTS.SPEED_BRAKE,
      this.currentSpeedKmh * GAME_CONSTANTS.COLLISION_SPEED_DROP
    );
    this.targetSpeedKmh = this.currentSpeedKmh;

    SoundEffects.playCollision();

    this.callbacks.onFloatingText({
      id: this.textIdCounter++,
      text: 'CRASH! SLOWDOWN',
      points: 0,
      type: 'collision',
      timestamp: Date.now(),
    });
  }

  private spawnGoldSparkles(x: number, y: number, z: number) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 6;
      velocities[i * 3 + 1] = Math.random() * 5 + 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.35,
      transparent: true,
      opacity: 1.0,
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);
    this.particles.push({ mesh, life: 0, maxLife: 0.7, velocities });
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      const progress = p.life / p.maxLife;

      if (progress >= 1.0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const posAttr = p.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let j = 0; j < posArray.length / 3; j++) {
        posArray[j * 3] += p.velocities[j * 3] * delta;
        posArray[j * 3 + 1] += (p.velocities[j * 3 + 1] - 9.8 * delta) * delta;
        posArray[j * 3 + 2] += p.velocities[j * 3 + 2] * delta;
      }
      posAttr.needsUpdate = true;
      (p.mesh.material as THREE.PointsMaterial).opacity = 1.0 - progress;
    }
  }

  private updateCamera(delta: number) {
    const player = this.playerCar;

    const targetCamX = player.position.x * 0.45;
    const targetCamY = GAME_CONSTANTS.CAMERA_OFFSET_Y;
    const targetCamZ = player.position.z + GAME_CONSTANTS.CAMERA_OFFSET_Z;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 12, delta);
    this.camera.position.y = targetCamY;
    this.camera.position.z = targetCamZ;

    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
    }

    const speedProgress = this.currentSpeedKmh / GAME_CONSTANTS.SPEED_MAX;
    const targetFOV = 56 + speedProgress * 10;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFOV, 8, delta);
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(
      player.position.x * 0.25,
      GAME_CONSTANTS.CAMERA_LOOK_Y,
      player.position.z + GAME_CONSTANTS.CAMERA_LOOK_Z
    );
  }

  private updateTimer(delta: number) {
    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endGame();
    }
  }

  private checkBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try {
        localStorage.setItem('hand_drive_best_score', this.bestScore.toString());
      } catch {
        // ignore
      }
    }
  }

  private endGame() {
    this.isRunning = false;
    SoundEffects.stopEngine();
    SoundEffects.playGameOver();

    this.callbacks.onGameOver({
      score: this.score,
      bestScore: this.bestScore,
      timeLeft: 0,
      distance: Math.floor(this.distanceTraveled),
      speed: 0,
      coinsCollected: this.coinsCollected,
      vehiclesOvertaken: this.vehiclesOvertaken,
      collisions: this.collisions,
      currentLane: this.currentLane,
    });
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.stopGame();
    window.removeEventListener('resize', this.onWindowResize);

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }

    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
