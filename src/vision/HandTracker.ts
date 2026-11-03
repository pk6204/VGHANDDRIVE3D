import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { CalibrationData, GestureType, HandStatus } from '../types';

export type OnHandUpdateCallback = (status: HandStatus) => void;

class HandTrackerService {
  private handLandmarker: HandLandmarker | null = null;
  // Dedicated persistent offscreen video element to survive React component unmounts
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isRunning: boolean = false;
  private isStarting: boolean = false;
  private animationFrameId: number | null = null;
  private lastVideoTime: number = -1;
  private lastInferenceTimestamp: number = 0;

  // Smoothing
  private smoothedPalmX: number = 0.5;
  private smoothedPalmY: number = 0.5;

  private calibration: CalibrationData = {
    centerX: 0.5,
    deadzone: 0.12,
    isCalibrated: false,
  };

  private listeners: Set<OnHandUpdateCallback> = new Set();
  private isInitializingModel: boolean = false;
  private initError: string | null = null;

  constructor() {
    // Create dedicated persistent video element
    if (typeof document !== 'undefined') {
      const v = document.createElement('video');
      v.autoplay = true;
      v.muted = true;
      v.playsInline = true;
      v.style.position = 'fixed';
      v.style.top = '-9999px';
      v.style.left = '-9999px';
      v.style.width = '640px';
      v.style.height = '480px';
      v.style.opacity = '0';
      v.style.pointerEvents = 'none';
      document.body.appendChild(v);
      this.video = v;
    }
  }

  public getCalibration(): CalibrationData {
    return { ...this.calibration };
  }

  public calibrateCenter(centerX?: number) {
    if (centerX !== undefined) {
      this.calibration.centerX = Math.max(0.2, Math.min(0.8, centerX));
    } else {
      this.calibration.centerX = this.smoothedPalmX;
    }
    this.calibration.isCalibrated = true;
  }

  public subscribe(cb: OnHandUpdateCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(status: HandStatus) {
    this.listeners.forEach((cb) => cb(status));
  }

  public async initializeModel(): Promise<boolean> {
    if (this.handLandmarker) return true;
    if (this.isInitializingModel) {
      // Wait for ongoing initialization
      while (this.isInitializingModel) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return !!this.handLandmarker;
    }

    this.isInitializingModel = true;
    this.initError = null;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitializingModel = false;
      return true;
    } catch (err) {
      console.error('Failed to load MediaPipe Hand Landmarker model:', err);
      this.initError = err instanceof Error ? err.message : 'Failed to load hand tracking model.';
      this.isInitializingModel = false;
      return false;
    }
  }

  /**
   * Starts or attaches camera stream. Persistent across modals.
   */
  public async startCamera(previewCanvas?: HTMLCanvasElement | null): Promise<boolean> {
    if (previewCanvas) {
      this.setPreviewCanvas(previewCanvas);
    }

    if (this.isStarting) {
      while (this.isStarting) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return this.isRunning;
    }

    // If stream is already active and running, just return true
    if (
      this.isRunning &&
      this.video &&
      this.video.srcObject &&
      (this.video.srcObject as MediaStream).active
    ) {
      return true;
    }

    this.isStarting = true;
    this.initError = null;

    try {
      // 1. Initialize model
      const modelReady = await this.initializeModel();
      if (!modelReady || !this.handLandmarker) {
        this.isStarting = false;
        return false;
      }

      // 2. Ensure video element exists
      if (!this.video) {
        const v = document.createElement('video');
        v.autoplay = true;
        v.muted = true;
        v.playsInline = true;
        v.style.position = 'fixed';
        v.style.top = '-9999px';
        v.style.left = '-9999px';
        document.body.appendChild(v);
        this.video = v;
      }

      // 3. Request webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.video.srcObject = stream;

      // 4. Wait for video metadata and first frames
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve();
        }, 3000);

        this.video!.onloadeddata = () => {
          clearTimeout(timeout);
          this.video!.play().then(() => resolve()).catch(() => resolve());
        };

        this.video!.onerror = (e) => {
          clearTimeout(timeout);
          reject(e);
        };
      });

      // 5. Start single processing loop
      this.isRunning = true;
      this.isStarting = false;
      this.lastVideoTime = -1;
      this.lastInferenceTimestamp = 0;

      if (this.animationFrameId === null) {
        this.animationFrameId = requestAnimationFrame(this.processLoop);
      }

      return true;
    } catch (err) {
      console.error('Camera initialization error:', err);
      this.initError =
        err instanceof Error ? err.message : 'Webcam permission was denied or camera is unavailable.';
      this.isStarting = false;
      this.isRunning = false;
      return false;
    }
  }

  public setPreviewCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  public stopCamera() {
    // Only stop when user truly leaves game or explicitly turns off camera
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }

    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.notify({
      detected: false,
      gesture: 'none',
      palmX: 0.5,
      palmY: 0.5,
      confidence: 0,
    });
  }

  public isCameraActive(): boolean {
    return (
      this.isRunning &&
      !!this.video &&
      !!this.video.srcObject &&
      (this.video.srcObject as MediaStream).active
    );
  }

  private processLoop = () => {
    if (!this.isRunning) {
      this.animationFrameId = null;
      return;
    }

    const video = this.video;
    if (video && video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
      if (video.currentTime !== this.lastVideoTime && this.handLandmarker) {
        this.lastVideoTime = video.currentTime;

        // Ensure strictly increasing timestamp for MediaPipe video inference
        const now = performance.now();
        const timestamp = Math.max(now, this.lastInferenceTimestamp + 1);
        this.lastInferenceTimestamp = timestamp;

        try {
          const results = this.handLandmarker.detectForVideo(video, timestamp);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const confidence = results.handedness?.[0]?.[0]?.score ?? 0.9;
            const status = this.analyzeHand(landmarks, confidence);

            if (this.canvas && this.ctx) {
              this.drawPreview(video, landmarks, status);
            }

            this.notify(status);
          } else {
            // Hand not detected in this frame
            if (this.canvas && this.ctx) {
              this.drawVideoBackgroundOnly(video);
            }

            this.notify({
              detected: false,
              gesture: 'none',
              palmX: this.smoothedPalmX,
              palmY: this.smoothedPalmY,
              confidence: 0,
            });
          }
        } catch (inferErr) {
          // Log once and recover automatically next frame
          console.warn('Inference frame dropped:', inferErr);
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  };

  /**
   * Analyze hand landmarks to compute smoothed mirrored palm position and determine gesture.
   */
  private analyzeHand(
    landmarks: { x: number; y: number; z: number }[],
    rawConfidence: number
  ): HandStatus {
    const wrist = landmarks[0];
    const indexMCP = landmarks[5];
    const middleMCP = landmarks[9];
    const ringMCP = landmarks[13];
    const pinkyMCP = landmarks[17];

    // Compute center of palm
    const rawPalmX = (wrist.x + indexMCP.x + middleMCP.x + ringMCP.x + pinkyMCP.x) / 5;
    const rawPalmY = (wrist.y + indexMCP.y + middleMCP.y + ringMCP.y + pinkyMCP.y) / 5;

    // Mirrored for natural selfie interaction: physical hand left maps to screen left
    const mirroredPalmX = 1.0 - rawPalmX;
    const palmY = rawPalmY;

    // Exponential smoothing (alpha = 0.4 for smooth yet responsive feel)
    this.smoothedPalmX = this.smoothedPalmX * 0.6 + mirroredPalmX * 0.4;
    this.smoothedPalmY = this.smoothedPalmY * 0.6 + palmY * 0.4;

    const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]; // Index, Middle, Ring, Pinky
    const pips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]];
    const mcps = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];

    let curledFingers = 0;
    let extendedFingers = 0;

    for (let i = 0; i < 4; i++) {
      const tipDist = Math.hypot(tips[i].x - wrist.x, tips[i].y - wrist.y);
      const pipDist = Math.hypot(pips[i].x - wrist.x, pips[i].y - wrist.y);
      const mcpDist = Math.hypot(mcps[i].x - wrist.x, mcps[i].y - wrist.y);

      if (tipDist < pipDist * 0.95 || tipDist < mcpDist * 1.05) {
        curledFingers++;
      } else if (tipDist > mcpDist * 1.25) {
        extendedFingers++;
      }
    }

    // Horn Gesture: Index finger pointing downward (tip Y significantly lower than MCP & PIP)
    // while other fingers are curled or neutral
    const indexTip = landmarks[8];
    const indexMCPJoint = landmarks[5];
    const indexPIPJoint = landmarks[6];
    const middleTip = landmarks[12];
    const isIndexPointingDown =
      indexTip.y > indexPIPJoint.y + 0.04 &&
      indexTip.y > indexMCPJoint.y + 0.06 &&
      middleTip.y < indexTip.y; // Index is pointing lower than middle finger

    const dx = this.smoothedPalmX - this.calibration.centerX;
    const dz = this.calibration.deadzone;

    let gesture: GestureType = 'neutral';

    if (isIndexPointingDown) {
      gesture = 'horn';
    } else if (dx < -dz) {
      gesture = 'left';
    } else if (dx > dz) {
      gesture = 'right';
    } else {
      // In deadzone (center): evaluate Open Palm vs Closed Fist
      if (curledFingers >= 3) {
        gesture = 'brake';
      } else if (extendedFingers >= 3) {
        gesture = 'accelerate';
      } else {
        gesture = 'neutral';
      }
    }

    return {
      detected: true,
      gesture,
      palmX: this.smoothedPalmX,
      palmY: this.smoothedPalmY,
      confidence: rawConfidence,
      landmarks,
    };
  }

  private drawVideoBackgroundOnly(video: HTMLVideoElement) {
    if (!this.canvas || !this.ctx) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();
    // Mirror video horizontally
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Dim overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // Prompt text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hold hand in front of camera', width / 2, height / 2);
  }

  private drawPreview(
    video: HTMLVideoElement,
    landmarks: { x: number; y: number; z: number }[],
    status: HandStatus
  ) {
    if (!this.canvas || !this.ctx) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // 1. Draw mirrored video background
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Semi-transparent backdrop for high contrast landmarks
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(0, 0, width, height);

    // 2. Deadzone guidelines
    const centerPx = this.calibration.centerX * width;
    const deadzonePx = this.calibration.deadzone * width;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.fillRect(centerPx - deadzonePx, 0, deadzonePx * 2, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerPx - deadzonePx, 0);
    ctx.lineTo(centerPx - deadzonePx, height);
    ctx.moveTo(centerPx + deadzonePx, 0);
    ctx.lineTo(centerPx + deadzonePx, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Connective skeleton
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17], // Palm bridge
    ];

    let strokeColor = '#38bdf8'; // Sky blue
    if (status.gesture === 'accelerate') strokeColor = '#10b981'; // Emerald
    if (status.gesture === 'brake') strokeColor = '#ef4444'; // Red
    if (status.gesture === 'left' || status.gesture === 'right') strokeColor = '#f59e0b'; // Amber
    if (status.gesture === 'horn') strokeColor = '#ec4899'; // Pink/Purple

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([i, j]) => {
      const x1 = (1 - landmarks[i].x) * width;
      const y1 = landmarks[i].y * height;
      const x2 = (1 - landmarks[j].x) * width;
      const y2 = landmarks[j].y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 4. Joints
    landmarks.forEach((lm, idx) => {
      const x = (1 - lm.x) * width;
      const y = lm.y * height;
      ctx.beginPath();
      ctx.arc(x, y, idx === 0 || idx % 4 === 0 ? 4 : 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = idx % 4 === 0 ? '#ffffff' : strokeColor;
      ctx.fill();
    });

    // 5. Palm Target Reticle
    const palmPx = status.palmX * width;
    const palmPy = status.palmY * height;

    ctx.beginPath();
    ctx.arc(palmPx, palmPy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  public getErrorMessage(): string | null {
    return this.initError;
  }
}

export const HandTracker = new HandTrackerService();
