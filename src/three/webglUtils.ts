import * as THREE from 'three';

let cachedSoftwareGl: boolean | null = null;

export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = true;
    return true;
  }
}

export function scheduleAfterDraw(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  registerTimer: (id: number) => void,
  pauseMs = 80,
): void {
  const gl = renderer.getContext();
  if ('fenceSync' in gl && typeof gl.fenceSync === 'function') {
    const gl2 = gl as WebGL2RenderingContext;
    const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl2.flush();
    const poll = () => {
      if (!sync) {
        registerTimer(window.setTimeout(cb, pauseMs));
        return;
      }
      const state = gl2.getSyncParameter(sync, gl2.SYNC_STATUS);
      if (state === gl2.UNSIGNALED) {
        registerTimer(window.setTimeout(poll, 5));
      } else {
        gl2.deleteSync(sync);
        registerTimer(window.setTimeout(cb, pauseMs));
      }
    };
    registerTimer(window.setTimeout(poll, 5));
  } else {
    registerTimer(window.setTimeout(cb, pauseMs));
  }
}

export function createWoodGrainTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3B2516';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.045) * 14 + Math.cos(y * 0.11) * 6;
    const alpha = 0.08 + (Math.sin(y * 0.17) * 0.5 + 0.5) * 0.16;
    ctx.strokeStyle = y % 4 === 0 ? `rgba(22, 12, 6, ${alpha})` : `rgba(116, 76, 44, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + wave, 340, y - wave, 512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createStonewareSpeckleTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#DFD5C3';
  ctx.fillRect(0, 0, 512, 512);

  // Concentric potter's wheel subtle striations
  for (let r = 10; r < 256; r += 4) {
    ctx.strokeStyle = `rgba(140, 125, 102, ${0.04 + (r % 8 === 0 ? 0.04 : 0)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ceramic speckles (deterministic pseudo-random)
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 650; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const radius = 0.7 + rand() * 1.6;
    ctx.fillStyle = rand() > 0.3 ? 'rgba(65, 52, 38, 0.35)' : 'rgba(120, 92, 62, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createMagelanganTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7F4B24';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Rice grains
  const grainPalette = ['#9E6230', '#B6773B', '#6A3A19', '#C88D48', '#8A5124'];
  for (let i = 0; i < 1800; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const angle = rand() * Math.PI * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = grainPalette[Math.floor(rand() * grainPalette.length)];
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Green scallion and chili flecks
  for (let i = 0; i < 180; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.fillStyle = rand() > 0.38 ? '#3D7A38' : '#C83724';
    ctx.beginPath();
    ctx.arc(x, y, 2.2 + rand() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(4, 10, 7, 0.65)');
  grad.addColorStop(0.55, 'rgba(4, 10, 7, 0.28)');
  grad.addColorStop(1, 'rgba(4, 10, 7, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createGlowParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 232, 184, 1)');
  grad.addColorStop(0.35, 'rgba(230, 188, 123, 0.65)');
  grad.addColorStop(1, 'rgba(230, 188, 123, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}
