import * as THREE from 'three';
import { GAME_CONSTANTS } from './constants';

// Shared materials for performance and visual realism
const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.85,
  metalness: 0.1,
});

const chromeMaterial = new THREE.MeshStandardMaterial({
  color: 0xdde4ec,
  roughness: 0.12,
  metalness: 0.95,
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.1,
  metalness: 0.4,
  transparent: true,
  opacity: 0.88,
});

const headlightMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffee,
  emissiveIntensity: 1.4,
  roughness: 0.2,
});

export interface PlayerCarGroup extends THREE.Group {
  wheels: THREE.Mesh[];
  brakeLights: THREE.Mesh[];
  setBraking: (braking: boolean) => void;
}

/**
 * Creates a high-fidelity 3D sports car (player vehicle)
 * Composed of chassis, cockpit, windshield, spoiler, exhausts, lights, and 4 detailed alloy wheels.
 */
export function createPlayerCar(): PlayerCarGroup {
  const group = new THREE.Group() as PlayerCarGroup;
  group.name = 'playerCar';

  // Car dimensions
  const carWidth = 1.9;
  const carLength = 4.4;
  const carHeight = 1.1;

  // Primary Silhouette: Sleek Aerodynamic Lower Body
  const carPaintMaterial = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Crimson sports red
    roughness: 0.22,
    metalness: 0.78,
  });

  const bodyGeo = new THREE.BoxGeometry(carWidth, 0.52, carLength);
  const bodyMesh = new THREE.Mesh(bodyGeo, carPaintMaterial);
  bodyMesh.position.y = 0.48;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Front wedge / hood taper
  const hoodGeo = new THREE.BoxGeometry(carWidth * 0.94, 0.22, 1.4);
  const hoodMesh = new THREE.Mesh(hoodGeo, carPaintMaterial);
  hoodMesh.position.set(0, 0.42, -1.5);
  hoodMesh.rotation.x = 0.08;
  hoodMesh.castShadow = true;
  group.add(hoodMesh);

  // Front splitter
  const splitterGeo = new THREE.BoxGeometry(carWidth * 1.02, 0.08, 0.5);
  const splitterMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });
  const splitter = new THREE.Mesh(splitterGeo, splitterMat);
  splitter.position.set(0, 0.18, -2.15);
  group.add(splitter);

  // Secondary Read: Cabin / Greenhouse with Tinted Glass
  const cabinWidth = carWidth * 0.82;
  const cabinGeo = new THREE.BoxGeometry(cabinWidth, 0.52, 2.0);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
  cabinMesh.position.set(0, 0.88, 0.15);
  cabinMesh.castShadow = true;
  group.add(cabinMesh);

  // Roof cap
  const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.92, 0.08, 1.4);
  const roofMesh = new THREE.Mesh(roofGeo, carPaintMaterial);
  roofMesh.position.set(0, 1.16, 0.25);
  group.add(roofMesh);

  // Accent Detail: Rear Wing / Spoiler
  const wingBladeGeo = new THREE.BoxGeometry(carWidth * 0.95, 0.06, 0.42);
  const wingBlade = new THREE.Mesh(wingBladeGeo, carPaintMaterial);
  wingBlade.position.set(0, 1.15, 2.0);
  wingBlade.rotation.x = -0.06;
  group.add(wingBlade);

  const stanchionGeo = new THREE.BoxGeometry(0.06, 0.35, 0.2);
  const stanchionLeft = new THREE.Mesh(stanchionGeo, splitterMat);
  stanchionLeft.position.set(-0.6, 0.95, 2.0);
  const stanchionRight = new THREE.Mesh(stanchionGeo, splitterMat);
  stanchionRight.position.set(0.6, 0.95, 2.0);
  group.add(stanchionLeft, stanchionRight);

  // Dual Chrome Exhausts
  const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16);
  const exhaustLeft = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustLeft.rotation.x = Math.PI / 2;
  exhaustLeft.position.set(-0.5, 0.28, 2.22);
  const exhaustRight = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustRight.rotation.x = Math.PI / 2;
  exhaustRight.position.set(0.5, 0.28, 2.22);
  group.add(exhaustLeft, exhaustRight);

  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMaterial);
  hlLeft.position.set(-0.68, 0.52, -2.2);
  const hlRight = new THREE.Mesh(hlGeo, headlightMaterial);
  hlRight.position.set(0.68, 0.52, -2.2);
  group.add(hlLeft, hlRight);

  // Taillights
  const tailGeo = new THREE.BoxGeometry(0.42, 0.12, 0.08);
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0x990000,
    emissive: 0xcc0000,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const tailLeft = new THREE.Mesh(tailGeo, tailMat);
  tailLeft.position.set(-0.65, 0.55, 2.22);
  const tailRight = new THREE.Mesh(tailGeo, tailMat);
  tailRight.position.set(0.65, 0.55, 2.22);
  group.add(tailLeft, tailRight);

  // 4 Wheels
  const wheels: THREE.Mesh[] = [];
  const wheelRadius = 0.38;
  const wheelThickness = 0.28;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 20);

  const wheelPositions = [
    [-0.96, 0.38, -1.35], // Front Left
    [0.96, 0.38, -1.35],  // Front Right
    [-0.98, 0.38, 1.45],  // Rear Left
    [0.98, 0.38, 1.45],   // Rear Right
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    // Tire
    const tire = new THREE.Mesh(wheelGeo, tireMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Chrome Rim Hub
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, wheelThickness * 1.05, 12);
    const rim = new THREE.Mesh(rimGeo, chromeMaterial);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    group.add(wheelGroup);
    wheels.push(tire);
  });

  group.wheels = wheels;
  group.brakeLights = [tailLeft, tailRight];

  group.setBraking = (braking: boolean) => {
    tailMat.emissiveIntensity = braking ? 3.0 : 0.8;
    tailMat.color.setHex(braking ? 0xff1111 : 0x990000);
  };

  return group;
}

/**
 * Creates a traffic sedan car with distinct paint color
 */
export function createTrafficSedan(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trafficSedan';

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.3,
    metalness: 0.6,
  });

  // Main chassis
  const bodyGeo = new THREE.BoxGeometry(1.85, 0.55, 4.2);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.55, 0.5, 2.2);
  const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
  cabin.position.set(0, 0.95, -0.1);
  group.add(cabin);

  // Roof
  const roofGeo = new THREE.BoxGeometry(1.48, 0.06, 1.7);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.22, -0.1);
  group.add(roof);

  // Headlights & Taillights
  const hlGeo = new THREE.BoxGeometry(0.3, 0.1, 0.08);
  const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
  hlL.position.set(-0.65, 0.52, -2.12);
  const hlR = new THREE.Mesh(hlGeo, headlightMaterial);
  hlR.position.set(0.65, 0.52, -2.12);
  group.add(hlL, hlR);

  const tailGeo = new THREE.BoxGeometry(0.35, 0.1, 0.08);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 1.0 });
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-0.65, 0.52, 2.12);
  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(0.65, 0.52, 2.12);
  group.add(tailL, tailR);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16);
  [[-0.92, 0.36, -1.25], [0.92, 0.36, -1.25], [-0.92, 0.36, 1.25], [0.92, 0.36, 1.25]].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, tireMaterial);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    group.add(w);
  });

  return group;
}

/**
 * Creates a delivery truck
 */
export function createTrafficTruck(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trafficTruck';

  const cabMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35,
    metalness: 0.45,
  });

  const trailerMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Light silver/white trailer
    roughness: 0.4,
    metalness: 0.25,
  });

  // Cab
  const cabGeo = new THREE.BoxGeometry(2.1, 1.4, 2.0);
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 1.0, -2.4);
  cab.castShadow = true;
  group.add(cab);

  // Windshield
  const windshieldGeo = new THREE.BoxGeometry(1.85, 0.65, 0.1);
  const ws = new THREE.Mesh(windshieldGeo, glassMaterial);
  ws.position.set(0, 1.25, -3.42);
  group.add(ws);

  // Large Cargo Box Trailer
  const trailerGeo = new THREE.BoxGeometry(2.2, 2.2, 4.6);
  const trailer = new THREE.Mesh(trailerGeo, trailerMat);
  trailer.position.set(0, 1.5, 0.8);
  trailer.castShadow = true;
  group.add(trailer);

  // Chassis frame
  const frameGeo = new THREE.BoxGeometry(1.4, 0.3, 6.2);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 0.45, -0.6);
  group.add(frame);

  // Truck Wheels (6 wheels)
  const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.32, 16);
  [
    [-1.05, 0.44, -2.4], [1.05, 0.44, -2.4],
    [-1.08, 0.44, 1.4], [1.08, 0.44, 1.4],
    [-1.08, 0.44, 2.4], [1.08, 0.44, 2.4],
  ].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, tireMaterial);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    group.add(w);
  });

  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
  const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
  hlL.position.set(-0.8, 0.65, -3.42);
  const hlR = new THREE.Mesh(hlGeo, headlightMaterial);
  hlR.position.set(0.8, 0.65, -3.42);
  group.add(hlL, hlR);

  // Taillights
  const tailGeo = new THREE.BoxGeometry(0.3, 0.18, 0.1);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 1.0 });
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-0.85, 0.65, 3.12);
  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(0.85, 0.65, 3.12);
  group.add(tailL, tailR);

  return group;
}

/**
 * Creates a highway coach bus
 */
export function createTrafficBus(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trafficBus';

  const busMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.3,
    metalness: 0.4,
  });

  // Bus Main Body
  const busGeo = new THREE.BoxGeometry(2.2, 1.8, 7.5);
  const bus = new THREE.Mesh(busGeo, busMat);
  bus.position.set(0, 1.35, 0);
  bus.castShadow = true;
  group.add(bus);

  // Large side glass ribbon
  const sideGlassGeo = new THREE.BoxGeometry(2.24, 0.7, 5.8);
  const sideGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
  sideGlass.position.set(0, 1.55, -0.2);
  group.add(sideGlass);

  // Front Windshield
  const frontGlassGeo = new THREE.BoxGeometry(2.0, 0.85, 0.1);
  const frontGlass = new THREE.Mesh(frontGlassGeo, glassMaterial);
  frontGlass.position.set(0, 1.5, -3.76);
  group.add(frontGlass);

  // Bus Wheels (6 wheels)
  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.3, 16);
  [
    [-1.08, 0.46, -2.6], [1.08, 0.46, -2.6],
    [-1.08, 0.46, 1.8], [1.08, 0.46, 1.8],
    [-1.08, 0.46, 2.8], [1.08, 0.46, 2.8],
  ].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, tireMaterial);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    group.add(w);
  });

  // Headlights
  const hlGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
  const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
  hlL.position.set(-0.85, 0.7, -3.76);
  const hlR = new THREE.Mesh(hlGeo, headlightMaterial);
  hlR.position.set(0.85, 0.7, -3.76);
  group.add(hlL, hlR);

  // Taillights
  const tailGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 1.2 });
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-0.85, 0.8, 3.76);
  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(0.85, 0.8, 3.76);
  group.add(tailL, tailR);

  return group;
}

/**
 * Creates a spinning 3D collectible gold coin
 */
export function createCoin(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'coin';

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber gold
    roughness: 0.15,
    metalness: 0.95,
  });

  // Outer coin disc
  const discGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.14, 24);
  const disc = new THREE.Mesh(discGeo, goldMat);
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;
  group.add(disc);

  // Inner star/emblem detail
  const starGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.18, 5);
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.1,
    metalness: 0.98,
  });
  const star = new THREE.Mesh(starGeo, starMat);
  star.rotation.x = Math.PI / 2;
  group.add(star);

  group.position.y = 1.2;
  return group;
}

/**
 * Creates an overhead highway gantry bridge (Checkpoint arch)
 */
export function createCheckpointArch(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'checkpointArch';

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Slate steel
    roughness: 0.45,
    metalness: 0.7,
  });

  const span = GAME_CONSTANTS.ROAD_WIDTH + 4.0;
  const height = 6.2;

  // Left & Right Pillars
  const pillarGeo = new THREE.BoxGeometry(0.8, height, 0.8);
  const leftPillar = new THREE.Mesh(pillarGeo, steelMat);
  leftPillar.position.set(-span / 2, height / 2, 0);
  leftPillar.castShadow = true;
  const rightPillar = new THREE.Mesh(pillarGeo, steelMat);
  rightPillar.position.set(span / 2, height / 2, 0);
  rightPillar.castShadow = true;
  group.add(leftPillar, rightPillar);

  // Cross truss beam
  const beamGeo = new THREE.BoxGeometry(span, 0.9, 1.2);
  const beam = new THREE.Mesh(beamGeo, steelMat);
  beam.position.set(0, height - 0.45, 0);
  beam.castShadow = true;
  group.add(beam);

  // Electronic Checkpoint Sign
  const signGeo = new THREE.BoxGeometry(span * 0.7, 1.4, 0.3);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Deep emerald
    roughness: 0.3,
    metalness: 0.2,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, height - 0.45, 0.7);
  group.add(sign);

  // Glowing Green Neon Border & Letters
  const glowGeo = new THREE.BoxGeometry(span * 0.65, 0.12, 0.05);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 2.5,
  });
  const topGlow = new THREE.Mesh(glowGeo, glowMat);
  topGlow.position.set(0, height + 0.15, 0.88);
  const bottomGlow = new THREE.Mesh(glowGeo, glowMat);
  bottomGlow.position.set(0, height - 1.05, 0.88);
  group.add(topGlow, bottomGlow);

  return group;
}

/**
 * Creates natural highway foliage trees
 */
export function createTree(type: 'pine' | 'oak'): THREE.Group {
  const group = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x543d2b,
    roughness: 0.9,
    metalness: 0.05,
  });

  if (type === 'pine') {
    // Pine Tree
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.4, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.2;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1e4620, // Dark pine green
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });

    // 3 tiered cones
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 7), foliageMat);
    c1.position.y = 2.4;
    c1.castShadow = true;

    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.8, 7), foliageMat);
    c2.position.y = 3.6;
    c2.castShadow = true;

    const c3 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.5, 7), foliageMat);
    c3.position.y = 4.6;
    c3.castShadow = true;

    group.add(c1, c2, c3);
  } else {
    // Deciduous Oak
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.8, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x3d7a28, // Lush green
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true,
    });

    const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), foliageMat);
    f1.position.set(0, 3.4, 0);
    f1.castShadow = true;

    const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), foliageMat);
    f2.position.set(0.6, 4.2, 0.3);
    f2.castShadow = true;

    group.add(f1, f2);
  }

  return group;
}

/**
 * Creates distant mountains for natural landscape background
 */
export function createMountainCluster(): THREE.Group {
  const group = new THREE.Group();

  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x334d5c,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });

  const m1 = new THREE.Mesh(new THREE.ConeGeometry(45, 60, 6), mountainMat);
  m1.position.set(-90, 25, -280);
  m1.scale.set(1.4, 1.0, 1.0);

  const m2 = new THREE.Mesh(new THREE.ConeGeometry(55, 75, 6), mountainMat);
  m2.position.set(0, 30, -320);

  const m3 = new THREE.Mesh(new THREE.ConeGeometry(40, 50, 6), mountainMat);
  m3.position.set(95, 20, -290);
  m3.scale.set(1.3, 1.0, 1.1);

  group.add(m1, m2, m3);
  return group;
}
