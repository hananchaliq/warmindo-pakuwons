import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createGlowParticleTexture,
  detectSoftwareWebGL,
  scheduleAfterDraw,
} from './webglUtils';

export function HeroEmberCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 680;
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 60);
    camera.position.set(0, 0, 9);

    // Floating warm lantern ember / aroma motes
    const particleCount = 68;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    let seed = 91;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (rand() - 0.5) * 14;
      positions[i * 3 + 1] = (rand() - 0.5) * 7.5;
      positions[i * 3 + 2] = (rand() - 0.5) * 4.5;
      speeds[i] = 0.14 + rand() * 0.24;
      phases[i] = rand() * Math.PI * 2;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleTexture = createGlowParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      size: 0.28,
      map: particleTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color('#F2CE8E'),
    });
    const embers = new THREE.Points(particleGeo, particleMat);
    scene.add(embers);

    // Subtle golden aroma silk ribbon
    const ribbonPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      ribbonPoints.push(
        new THREE.Vector3(
          -6.5 + t * 13,
          Math.sin(t * Math.PI * 2.2) * 0.8 - 0.6,
          -1.5 + Math.cos(t * Math.PI * 1.5) * 0.7,
        ),
      );
    }
    const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPoints);
    const ribbonGeo = new THREE.TubeGeometry(ribbonCurve, 48, 0.018, 6, false);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: '#E6BC7B',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    scene.add(ribbonMesh);

    // Second fine ribbon
    const ribbonMesh2 = ribbonMesh.clone();
    ribbonMesh2.position.set(0.6, 1.2, -0.8);
    ribbonMesh2.rotation.z = 0.08;
    ribbonMesh2.scale.set(0.95, 0.7, 1);
    scene.add(ribbonMesh2);

    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      pointerTarget.x = nx * 0.5;
      pointerTarget.y = ny * 0.28;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 680;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    let contextLost = false;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
    };
    const onContextRestored = () => {
      contextLost = false;
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const startMs = performance.now();
    let lastMs = startMs;

    const renderFrame = () => {
      if (disposed || contextLost) return;
      if (!isVisible) {
        timerId = window.setTimeout(renderFrame, 300);
        return;
      }

      const now = performance.now();
      const dt = Math.min((now - lastMs) / 1000, 0.08) || 0.016;
      lastMs = now;
      const elapsed = (now - startMs) / 1000;

      if (!prefersReduced) {
        const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          let y = posAttr.getY(i) + speeds[i] * dt;
          if (y > 4.0) y = -3.8;
          const x = posAttr.getX(i) + Math.sin(elapsed * 0.6 + phases[i]) * 0.0022;
          posAttr.setXY(i, x, y);
        }
        posAttr.needsUpdate = true;

        ribbonMesh.position.y = Math.sin(elapsed * 0.55) * 0.16;
        ribbonMesh2.position.y = 1.2 + Math.cos(elapsed * 0.45) * 0.14;
      }

      pointerCurrent.x = THREE.MathUtils.damp(pointerCurrent.x, pointerTarget.x, 4, dt || 0.016);
      pointerCurrent.y = THREE.MathUtils.damp(pointerCurrent.y, pointerTarget.y, 4, dt || 0.016);
      camera.position.x = pointerCurrent.x;
      camera.position.y = pointerCurrent.y;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      if (prefersReduced) return;

      if (isSoftwareGl) {
        scheduleAfterDraw(
          renderer,
          renderFrame,
          (id) => {
            timerId = id;
          },
          180,
        );
      } else {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      observer.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      ribbonGeo.dispose();
      ribbonMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="hero-three-canvas"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    />
  );
}
