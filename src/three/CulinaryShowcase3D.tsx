import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RotateCw, Eye, Sparkles } from 'lucide-react';
import {
  createContactShadowTexture,
  createMagelanganTexture,
  createStonewareSpeckleTexture,
  createWoodGrainTexture,
  detectSoftwareWebGL,
  scheduleAfterDraw,
} from './webglUtils';

export type DishModelId = 'nyemek' | 'magelangan' | 'kopi';
type CameraPreset = 'hero' | 'top' | 'detail';

interface CulinaryShowcase3DProps {
  activeDish: DishModelId;
  onSelectDish?: (dish: DishModelId) => void;
}

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  hero: { pos: [0, 2.75, 5.45], target: [0, 0.2, 0], label: 'Perspektif' },
  top: { pos: [0.1, 5.2, 1.55], target: [0, 0.15, 0], label: 'Tampak Atas' },
  detail: { pos: [2.25, 1.75, 3.1], target: [0, 0.35, 0], label: 'Detail Dekat' },
};

function buildNyemekModel(
  woodTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
): { group: THREE.Group; steamPlumes: THREE.Mesh[] } {
  const group = new THREE.Group();
  const steamPlumes: THREE.Mesh[] = [];

  // 1. Lathe ceramic bowl (matte dark slate stoneware)
  const bowlProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.72, 0.0),
    new THREE.Vector2(0.78, 0.1),
    new THREE.Vector2(1.18, 0.45),
    new THREE.Vector2(1.42, 0.92),
    new THREE.Vector2(1.45, 1.02),
    new THREE.Vector2(1.36, 1.02),
    new THREE.Vector2(1.26, 0.85),
    new THREE.Vector2(0.95, 0.35),
    new THREE.Vector2(0.55, 0.14),
    new THREE.Vector2(0.0, 0.12),
  ];
  const bowlGeo = new THREE.LatheGeometry(bowlProfile, 36);
  const bowlMat = new THREE.MeshStandardMaterial({
    color: '#1E2522',
    roughness: 0.72,
    metalness: 0.12,
  });
  const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
  bowlMesh.castShadow = !isSoftwareGl;
  bowlMesh.receiveShadow = !isSoftwareGl;
  group.add(bowlMesh);

  // 2. Brushed champagne gold rim accent
  const rimGeo = new THREE.TorusGeometry(1.405, 0.032, 12, 48);
  const goldMat = new THREE.MeshStandardMaterial({
    color: '#E6BC7B',
    roughness: 0.24,
    metalness: 0.88,
  });
  const rimMesh = new THREE.Mesh(rimGeo, goldMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 1.015;
  group.add(rimMesh);

  // 3. Savory rich broth disc
  const brothGeo = new THREE.CircleGeometry(1.26, 32);
  const brothMat = new THREE.MeshStandardMaterial({
    color: '#6C3B16',
    roughness: 0.18,
    metalness: 0.1,
  });
  const brothMesh = new THREE.Mesh(brothGeo, brothMat);
  brothMesh.rotation.x = -Math.PI / 2;
  brothMesh.position.y = 0.74;
  group.add(brothMesh);

  // 4. Intertwined wavy procedural Indomie noodles (16 TubeGeometries)
  const noodleMat = new THREE.MeshStandardMaterial({
    color: '#D59843',
    roughness: 0.36,
    metalness: 0.05,
  });
  const noodleGroup = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 10; s++) {
      const t = s / 10;
      const r = 0.2 + t * 0.92;
      const swirl = angle + t * 1.4 + Math.sin(t * 9 + i) * 0.18;
      const y = 0.75 + Math.sin(t * Math.PI) * 0.16 + Math.sin(t * 14 + i) * 0.035;
      pts.push(new THREE.Vector3(Math.cos(swirl) * r, y, Math.sin(swirl) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.036, 6, false);
    const strand = new THREE.Mesh(tubeGeo, noodleMat);
    strand.castShadow = !isSoftwareGl;
    noodleGroup.add(strand);
  }
  group.add(noodleGroup);

  // 5. Sunny-side-up egg (egg white + glossy amber-orange yolk)
  const eggWhiteShape = new THREE.Shape();
  eggWhiteShape.absellipse(0, 0, 0.44, 0.38, 0, Math.PI * 2, false, 0);
  const eggWhiteGeo = new THREE.ExtrudeGeometry(eggWhiteShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.04,
    bevelSegments: 4,
  });
  const eggWhiteMat = new THREE.MeshStandardMaterial({
    color: '#FAF4E8',
    roughness: 0.32,
    metalness: 0.02,
  });
  const eggWhite = new THREE.Mesh(eggWhiteGeo, eggWhiteMat);
  eggWhite.rotation.x = -Math.PI / 2;
  eggWhite.position.set(0.05, 0.9, 0.08);
  group.add(eggWhite);

  const yolkGeo = new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const yolkMat = new THREE.MeshStandardMaterial({
    color: '#F29C11',
    roughness: 0.12,
    metalness: 0.05,
  });
  const yolk = new THREE.Mesh(yolkGeo, yolkMat);
  yolk.position.set(0.06, 0.93, 0.09);
  yolk.scale.set(1.05, 0.72, 1.0);
  group.add(yolk);

  // 6. Vibrant Pak Choi / Sawi greens
  const greenMat = new THREE.MeshStandardMaterial({
    color: '#2F6F36',
    roughness: 0.42,
    metalness: 0.02,
  });
  for (let i = 0; i < 4; i++) {
    const leafGeo = new THREE.SphereGeometry(0.24, 12, 10);
    const leaf = new THREE.Mesh(leafGeo, greenMat);
    leaf.scale.set(1.4, 0.16, 0.7);
    const a = -2.2 + i * 0.35;
    leaf.position.set(Math.cos(a) * 0.74, 0.92 + (i % 2) * 0.04, Math.sin(a) * 0.74);
    leaf.rotation.set(0.18, -a, 0.12);
    group.add(leaf);
  }

  // 7. Sliced red chilies & bakso halves
  const chiliMat = new THREE.MeshStandardMaterial({
    color: '#CC2B1E',
    roughness: 0.28,
    metalness: 0.04,
  });
  const chiliPositions: [number, number, number][] = [
    [-0.18, 0.98, -0.22],
    [0.24, 0.97, -0.32],
    [-0.35, 0.94, 0.18],
    [0.12, 0.98, 0.46],
    [-0.08, 0.97, -0.05],
  ];
  chiliPositions.forEach(([x, y, z], idx) => {
    const ringGeo = new THREE.TorusGeometry(0.055, 0.02, 8, 16);
    const ring = new THREE.Mesh(ringGeo, chiliMat);
    ring.rotation.x = Math.PI / 2 + (idx % 2 === 0 ? 0.2 : -0.15);
    ring.position.set(x, y, z);
    group.add(ring);
  });

  const baksoMat = new THREE.MeshStandardMaterial({
    color: '#9C785E',
    roughness: 0.55,
    metalness: 0.02,
  });
  [
    [0.64, 0.9, 0.36],
    [0.78, 0.89, 0.06],
    [0.52, 0.9, 0.62],
  ].forEach(([x, y, z], idx) => {
    const baksoGeo = new THREE.SphereGeometry(0.14, 16, 12);
    const bakso = new THREE.Mesh(baksoGeo, baksoMat);
    bakso.scale.set(1, 0.65, 1);
    bakso.position.set(x, y, z);
    bakso.rotation.y = idx * 0.9;
    group.add(bakso);
  });

  // 8. Pair of dark Javanese wood chopsticks resting on rim
  const chopMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: woodTex,
    roughness: 0.35,
    metalness: 0.05,
  });
  for (let i = 0; i < 2; i++) {
    const chopGeo = new THREE.CylinderGeometry(0.022, 0.042, 3.1, 10);
    const chop = new THREE.Mesh(chopGeo, chopMat);
    chop.rotation.z = Math.PI / 2 - 0.03;
    chop.rotation.y = 0.26 + i * 0.055;
    chop.position.set(0.12, 1.07, -0.78 - i * 0.13);
    chop.castShadow = !isSoftwareGl;
    group.add(chop);
  }

  // 9. Rising translucent aromatic steam plumes
  const steamMat = new THREE.MeshBasicMaterial({
    color: '#F5EFE4',
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  for (let i = 0; i < 5; i++) {
    const sPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.sin(i * 1.4) * 0.14, 0.35, Math.cos(i) * 0.1),
      new THREE.Vector3(-Math.sin(i * 1.2) * 0.12, 0.78, Math.sin(i) * 0.12),
      new THREE.Vector3(Math.cos(i) * 0.09, 1.15, -Math.cos(i) * 0.08),
    ];
    const sCurve = new THREE.CatmullRomCurve3(sPts);
    const sGeo = new THREE.TubeGeometry(sCurve, 14, 0.025, 6, false);
    const plume = new THREE.Mesh(sGeo, steamMat.clone());
    plume.position.set((i - 2) * 0.24, 1.05, (i % 2 === 0 ? -1 : 1) * 0.18);
    plume.userData.phase = i * 1.3;
    steamPlumes.push(plume);
    group.add(plume);
  }

  return { group, steamPlumes };
}

function buildMagelanganModel(
  stonewareTex: THREE.CanvasTexture,
  magelanganTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
): THREE.Group {
  const group = new THREE.Group();

  // 1. Wide stoneware dinner plate (LatheGeometry)
  const plateProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1.05, 0),
    new THREE.Vector2(1.18, 0.08),
    new THREE.Vector2(1.62, 0.22),
    new THREE.Vector2(1.66, 0.28),
    new THREE.Vector2(1.58, 0.29),
    new THREE.Vector2(1.14, 0.14),
    new THREE.Vector2(0, 0.11),
  ];
  const plateGeo = new THREE.LatheGeometry(plateProfile, 40);
  const plateMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: stonewareTex,
    roughness: 0.65,
    metalness: 0.05,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.castShadow = !isSoftwareGl;
  plate.receiveShadow = !isSoftwareGl;
  group.add(plate);

  // 2. Sculpted Magelangan rice + noodle mound
  const moundGeo = new THREE.SphereGeometry(0.95, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.56);
  const moundMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: magelanganTex,
    roughness: 0.78,
    metalness: 0.02,
  });
  const mound = new THREE.Mesh(moundGeo, moundMat);
  mound.scale.set(1.05, 0.62, 1.0);
  mound.position.set(-0.08, 0.14, 0.06);
  mound.castShadow = !isSoftwareGl;
  group.add(mound);

  // 3. Fried egg crown atop the Magelangan
  const whiteGeo = new THREE.CylinderGeometry(0.46, 0.49, 0.045, 24);
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#FAF3E6', roughness: 0.36 });
  const white = new THREE.Mesh(whiteGeo, whiteMat);
  white.position.set(-0.06, 0.72, 0.06);
  white.rotation.z = 0.05;
  group.add(white);

  const yolkGeo = new THREE.SphereGeometry(0.18, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const yolkMat = new THREE.MeshStandardMaterial({ color: '#F59F12', roughness: 0.14 });
  const yolk = new THREE.Mesh(yolkGeo, yolkMat);
  yolk.position.set(-0.05, 0.74, 0.06);
  yolk.scale.set(1, 0.75, 1);
  group.add(yolk);

  // 4. Crispy golden Kerupuk crisps on right flank
  const kerupukMat = new THREE.MeshStandardMaterial({
    color: '#E5BC73',
    roughness: 0.82,
    metalness: 0.0,
  });
  [
    [0.98, 0.34, -0.32, 0.4, 0.3, 0.2],
    [1.06, 0.31, 0.08, -0.3, 0.8, 0.15],
    [0.86, 0.29, 0.44, 0.2, -0.5, -0.2],
  ].forEach(([x, y, z, rx, ry, rz]) => {
    const kGeo = new THREE.TorusGeometry(0.19, 0.065, 8, 18);
    const k = new THREE.Mesh(kGeo, kerupukMat);
    k.scale.set(1.2, 0.45, 0.9);
    k.position.set(x, y, z);
    k.rotation.set(rx, ry, rz);
    k.castShadow = !isSoftwareGl;
    group.add(k);
  });

  // 5. Fresh cucumber & tomato medallions + sambal scoop
  const cucumberMat = new THREE.MeshStandardMaterial({ color: '#589C4E', roughness: 0.35 });
  const tomatoMat = new THREE.MeshStandardMaterial({ color: '#D13B27', roughness: 0.25 });
  const sambalMat = new THREE.MeshStandardMaterial({ color: '#8F1D14', roughness: 0.22 });

  for (let i = 0; i < 2; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 18), cucumberMat);
    c.position.set(-0.78 + i * 0.28, 0.23 + i * 0.02, -0.78 - i * 0.08);
    c.rotation.x = 0.24;
    group.add(c);
  }
  const tomato = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.05, 18), tomatoMat);
  tomato.position.set(-0.22, 0.24, -0.92);
  tomato.rotation.x = 0.22;
  group.add(tomato);

  const sambal = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), sambalMat);
  sambal.scale.set(1.2, 0.48, 1.0);
  sambal.position.set(0.65, 0.22, 0.78);
  group.add(sambal);

  // 6. Brushed brass spoon resting alongside plate
  const brassMat = new THREE.MeshStandardMaterial({
    color: '#D8AD64',
    roughness: 0.22,
    metalness: 0.92,
  });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 1.45), brassMat);
  handle.position.set(-1.55, 0.06, 0.25);
  handle.rotation.y = 0.22;
  group.add(handle);

  const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), brassMat);
  scoop.scale.set(0.85, 0.25, 1.35);
  scoop.position.set(-1.38, 0.07, -0.52);
  scoop.rotation.y = 0.22;
  group.add(scoop);

  return group;
}

function buildKopiModel(
  woodTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
): THREE.Group {
  const group = new THREE.Group();

  // 1. Teak coaster with gold inlay ring
  const coasterGeo = new THREE.CylinderGeometry(0.86, 0.9, 0.09, 32);
  const coasterMat = new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: woodTex,
    roughness: 0.52,
    metalness: 0.05,
  });
  const coaster = new THREE.Mesh(coasterGeo, coasterMat);
  coaster.position.y = 0.045;
  coaster.castShadow = !isSoftwareGl;
  coaster.receiveShadow = !isSoftwareGl;
  group.add(coaster);

  const coasterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.018, 10, 36),
    new THREE.MeshStandardMaterial({ color: '#E6BC7B', roughness: 0.25, metalness: 0.9 }),
  );
  coasterRing.rotation.x = Math.PI / 2;
  coasterRing.position.y = 0.092;
  group.add(coasterRing);

  // 2. Layered Kopi Susu Gula Aren liquid core (3 distinct gourmet bands)
  // Bottom palm sugar layer
  const arenGeo = new THREE.CylinderGeometry(0.47, 0.41, 0.36, 28);
  const arenMat = new THREE.MeshStandardMaterial({
    color: '#4B220B',
    roughness: 0.18,
    metalness: 0.05,
  });
  const aren = new THREE.Mesh(arenGeo, arenMat);
  aren.position.y = 0.35;
  group.add(aren);

  // Middle creamy milk layer
  const milkGeo = new THREE.CylinderGeometry(0.54, 0.47, 0.78, 28);
  const milkMat = new THREE.MeshStandardMaterial({
    color: '#E9D8BE',
    roughness: 0.24,
    metalness: 0.02,
  });
  const milk = new THREE.Mesh(milkGeo, milkMat);
  milk.position.y = 0.92;
  group.add(milk);

  // Top espresso crema layer
  const espressoGeo = new THREE.CylinderGeometry(0.58, 0.54, 0.42, 28);
  const espressoMat = new THREE.MeshStandardMaterial({
    color: '#5C3016',
    roughness: 0.2,
    metalness: 0.04,
  });
  const espresso = new THREE.Mesh(espressoGeo, espressoMat);
  espresso.position.y = 1.52;
  group.add(espresso);

  // 3. Floating crystal ice cubes on top
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: '#F4F9FC',
    roughness: 0.08,
    metalness: 0.0,
    transparent: true,
    opacity: isSoftwareGl ? 0.55 : 0.75,
    clearcoat: 1.0,
  });
  [
    [-0.18, 1.78, 0.14, 0.3, 0.4, 0.1],
    [0.2, 1.76, -0.1, -0.25, 0.7, 0.3],
    [0.02, 1.84, -0.22, 0.4, -0.3, 0.2],
    [-0.22, 1.74, -0.18, -0.15, 0.2, -0.35],
  ].forEach(([x, y, z, rx, ry, rz]) => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), iceMat);
    cube.position.set(x, y, z);
    cube.rotation.set(rx, ry, rz);
    group.add(cube);
  });

  // 4. Outer ribbed tall glass vessel (LatheGeometry, transparent & depthWrite: false)
  const glassProfile = [
    new THREE.Vector2(0.45, 0.1),
    new THREE.Vector2(0.49, 0.22),
    new THREE.Vector2(0.64, 1.88),
    new THREE.Vector2(0.66, 1.94),
    new THREE.Vector2(0.61, 1.94),
    new THREE.Vector2(0.46, 0.26),
    new THREE.Vector2(0.0, 0.18),
  ];
  const glassGeo = new THREE.LatheGeometry(glassProfile, 24);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    roughness: 0.06,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.85,
    transparent: true,
    opacity: isSoftwareGl ? 0.28 : 0.92,
    ior: 1.5,
    thickness: 0.3,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.renderOrder = 5;
  group.add(glass);

  // 5. Curved brushed champagne-gold reusable straw
  const strawCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.06, 0.28, -0.04),
    new THREE.Vector3(0.18, 1.95, 0.04),
    new THREE.Vector3(0.28, 2.38, 0.08),
    new THREE.Vector3(0.64, 2.55, 0.16),
  ]);
  const strawGeo = new THREE.TubeGeometry(strawCurve, 28, 0.038, 12, false);
  const strawMat = new THREE.MeshStandardMaterial({
    color: '#E6BC7B',
    roughness: 0.2,
    metalness: 0.92,
  });
  const straw = new THREE.Mesh(strawGeo, strawMat);
  straw.castShadow = !isSoftwareGl;
  group.add(straw);

  // 6. Fresh pandan leaf garnish
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.11, 0.35, 0.02, 0.88);
  leafShape.quadraticCurveTo(-0.08, 0.35, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.015,
    bevelEnabled: false,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: '#347C3D',
    roughness: 0.38,
    metalness: 0.02,
  });
  const leaf = new THREE.Mesh(leafGeo, leafMat);
  leaf.position.set(-0.34, 1.55, 0.05);
  leaf.rotation.set(0.1, 0.35, 0.28);
  group.add(leaf);

  return group;
}

export function CulinaryShowcase3D({ activeDish }: CulinaryShowcase3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeDishRef = useRef<DishModelId>(activeDish);
  const presetRef = useRef<CameraPreset>('hero');
  const autoSpinRef = useRef<boolean>(true);
  const cameraMoveActiveRef = useRef<boolean>(false);
  const requestRenderRef = useRef<() => void>(() => {});

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    activeDishRef.current = activeDish;
    requestRenderRef.current();
  }, [activeDish]);

  useEffect(() => {
    presetRef.current = cameraPreset;
    cameraMoveActiveRef.current = true;
    requestRenderRef.current();
  }, [cameraPreset]);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
    requestRenderRef.current();
  }, [autoSpin]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 440;
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Studio PBR environment reflections (works on both GPU and software WebGL)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableZoom = false; // Never trap vertical scroll on mobile or desktop
    controls.enablePan = false;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.autoRotate = false;

    // 3-point warm/cool culinary studio lighting
    const hemiLight = new THREE.HemisphereLight('#A9D1C3', '#23160D', 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFE5BC', 2.2);
    keyLight.position.set(3.5, 6.2, 4.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -3.2;
    keyLight.shadow.camera.right = 3.2;
    keyLight.shadow.camera.top = 3.2;
    keyLight.shadow.camera.bottom = -3.2;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#E6BC7B', 1.1);
    rimLight.position.set(-4.2, 3.0, -3.5);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const woodTex = createWoodGrainTexture(maxAniso);
    const stonewareTex = createStonewareSpeckleTexture(maxAniso);
    const magelanganTex = createMagelanganTexture(maxAniso);
    const contactShadowTex = createContactShadowTexture();

    // Sculpted dark teak turntable pedestal
    const stageGroup = new THREE.Group();
    const plinthGeo = new THREE.CylinderGeometry(1.84, 1.98, 0.17, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: woodTex,
      roughness: 0.45,
      metalness: 0.08,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.085;
    plinth.receiveShadow = !isSoftwareGl;
    stageGroup.add(plinth);

    const goldBaseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.86, 0.02, 10, 64),
      new THREE.MeshStandardMaterial({ color: '#E6BC7B', roughness: 0.25, metalness: 0.9 }),
    );
    goldBaseRing.rotation.x = Math.PI / 2;
    goldBaseRing.position.y = -0.01;
    stageGroup.add(goldBaseRing);

    // Grounded contact shadow disc directly on pedestal surface
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(1.62, 36),
      new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.72,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.006;
    stageGroup.add(shadowPlane);

    // Build all 3 composite procedural dish models
    const nyemekBuilt = buildNyemekModel(woodTex, isSoftwareGl);
    const magelanganGroup = buildMagelanganModel(stonewareTex, magelanganTex, isSoftwareGl);
    const kopiGroup = buildKopiModel(woodTex, isSoftwareGl);

    const dishModels: Record<DishModelId, THREE.Group> = {
      nyemek: nyemekBuilt.group,
      magelangan: magelanganGroup,
      kopi: kopiGroup,
    };

    const dishScale: Record<DishModelId, number> = {
      nyemek: activeDishRef.current === 'nyemek' ? 1 : 0.001,
      magelangan: activeDishRef.current === 'magelangan' ? 1 : 0.001,
      kopi: activeDishRef.current === 'kopi' ? 1 : 0.001,
    };

    (Object.keys(dishModels) as DishModelId[]).forEach((id) => {
      const m = dishModels[id];
      m.position.y = 0.02;
      m.visible = id === activeDishRef.current;
      m.scale.setScalar(dishScale[id]);
      stageGroup.add(m);
    });

    scene.add(stageGroup);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Scratch vectors (zero GC in render loop)
    const _targetPos = new THREE.Vector3();
    const _targetLook = new THREE.Vector3();

    const onControlStart = () => {
      cameraMoveActiveRef.current = false;
      renderer.domElement.style.cursor = 'grabbing';
    };
    const onControlEnd = () => {
      renderer.domElement.style.cursor = 'grab';
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);

    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let isVisible = true;
    let contextLost = false;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible) requestRender();
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    const startMs = performance.now();
    let lastMs = startMs;

    function stepScene(dt: number, elapsed: number): boolean {
      let needsMore = false;

      // Smooth dish transition
      (Object.keys(dishModels) as DishModelId[]).forEach((id) => {
        const isCurrent = id === activeDishRef.current;
        const target = isCurrent ? 1 : 0.001;
        if (isSoftwareGl) {
          dishScale[id] = target;
        } else {
          dishScale[id] = THREE.MathUtils.damp(dishScale[id], target, 8, dt);
        }
        const model = dishModels[id];
        model.scale.setScalar(dishScale[id]);
        model.visible = dishScale[id] > 0.02;
        if (Math.abs(dishScale[id] - target) > 0.01) {
          needsMore = true;
        }
      });

      // Smooth camera preset transition
      if (cameraMoveActiveRef.current) {
        const preset = CAMERA_PRESETS[presetRef.current];
        _targetPos.set(...preset.pos);
        _targetLook.set(...preset.target);
        if (isSoftwareGl) {
          camera.position.copy(_targetPos);
          controls.target.copy(_targetLook);
          cameraMoveActiveRef.current = false;
        } else {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, 6, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, 6, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, 6, dt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLook.x, 6, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLook.y, 6, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLook.z, 6, dt);
          if (camera.position.distanceTo(_targetPos) < 0.03) {
            cameraMoveActiveRef.current = false;
          } else {
            needsMore = true;
          }
        }
      }

      // Gentle turntable rotation & steam float on GPU
      if (!isSoftwareGl && autoSpinRef.current) {
        stageGroup.rotation.y += dt * 0.34;
        needsMore = true;
      }

      if (!isSoftwareGl && activeDishRef.current === 'nyemek') {
        nyemekBuilt.steamPlumes.forEach((plume) => {
          const ph = (plume.userData.phase as number) || 0;
          plume.position.y = 1.05 + ((elapsed * 0.28 + ph) % 0.55);
          const mat = plume.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.sin(((elapsed * 0.28 + ph) % 0.55) / 0.55 * Math.PI) * 0.2;
        });
        needsMore = true;
      }

      controls.update();
      return needsMore;
    }

    function requestRender() {
      if (disposed || contextLost) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      rafId = requestAnimationFrame(() => {
        if (disposed || contextLost) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min((now - lastMs) / 1000, 0.05) || 0.016;
        lastMs = now;
        const elapsed = (now - startMs) / 1000;
        const needsMore = stepScene(dt, elapsed);
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (!disposed && isVisible && (renderDirty || needsMore)) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          scheduleAfterDraw(renderer, done, (id) => {
            timerId = id;
          });
        } else {
          done();
        }
      });
    }

    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    // Initial render
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      observer.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      envTarget.dispose();
      woodTex.dispose();
      stonewareTex.dispose();
      magelanganTex.dispose();
      contactShadowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnavailable) {
    return (
      <div className="flex h-[360px] w-full items-center justify-center rounded-2xl border border-[#E6BC7B]/20 bg-[#132920] p-6 text-center text-sm text-[#F5EFE4]/80 sm:h-[440px]">
        Pratinjau 3D tidak tersedia pada perangkat ini. Silakan lihat foto menu lengkap di katalog bawah.
      </div>
    );
  }

  return (
    <div
      className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-[#E6BC7B]/20 bg-[radial-gradient(circle_at_50%_40%,#1F4334_0%,#0E221A_72%)] sm:h-[440px] lg:h-[480px]"
      data-testid="culinary-3d-stage"
      data-active-dish={activeDish}
    >
      {/* Dedicated isolated WebGL canvas mount */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Subtle interaction hint top-right (no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-4 right-4 rounded-full border border-[#E6BC7B]/25 bg-[#0E221A]/90 px-3 py-1 text-xs font-medium text-[#E6BC7B]">
        Geser 360° untuk inspeksi
      </div>

      {/* Unified compact bottom camera control dock (no backdrop-filter over WebGL) */}
      <div className="absolute right-3 bottom-3 left-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6BC7B]/20 bg-[#0E221A]/92 px-3 py-2 sm:right-4 sm:bottom-4 sm:left-4">
        <div className="flex items-center gap-1" role="group" aria-label="Sudut kamera 3D">
          {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((presetKey) => {
            const active = cameraPreset === presetKey;
            return (
              <button
                key={presetKey}
                type="button"
                onClick={() => setCameraPreset(presetKey)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#E6BC7B] text-[#0E221A]'
                    : 'text-[#F5EFE4]/80 hover:bg-[#1B392C] hover:text-[#F5EFE4]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{CAMERA_PRESETS[presetKey].label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setAutoSpin((prev) => !prev)}
          aria-pressed={autoSpin}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            autoSpin
              ? 'border-[#E6BC7B]/40 bg-[#1B392C] text-[#E6BC7B]'
              : 'border-white/15 text-[#F5EFE4]/70 hover:text-[#F5EFE4]'
          }`}
        >
          {autoSpin ? (
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{autoSpin ? 'Putar Otomatis' : 'Putar Manual'}</span>
        </button>
      </div>
    </div>
  );
}
