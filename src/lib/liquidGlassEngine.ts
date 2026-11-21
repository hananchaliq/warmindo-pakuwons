export type RefractionMode = 'standard' | 'polar' | 'prominent';

export interface DisplacementMapOptions {
  width: number;
  height: number;
  cornerRadius: number;
  bezelRatio?: number;
  mode?: RefractionMode;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const mapCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 48;

export function isChromiumBackdropSvgSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /Chrome|Chromium|Edg|Brave|Arc|HeadlessChrome/i.test(navigator.userAgent) &&
    !/Firefox/i.test(navigator.userAgent)
  );
}

/**
 * Generates the exact iOS 26 spherical convex-bezel SDF displacement map PNG
 * (Red = X shift, Green = Y shift, 128 = 0) matching the reference Liquid Glass navbar.
 */
export function buildIosSdfMap(width: number, height: number, bezel: number): string {
  if (typeof document === 'undefined' || width <= 0 || height <= 0) {
    return '';
  }

  const w = Math.max(8, Math.round(width));
  const h = Math.max(8, Math.round(height));
  const b = Math.max(6, Math.round(bezel));

  const cacheKey = `ios:${w}x${h}:${b}`;
  const cached = mapCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(w, h);
  const d = img.data;
  const r = Math.min(w, h) / 2;
  const hw = w / 2;
  const hh = h / 2;

  for (let y = 0; y < h; y++) {
    const py = y + 0.5 - hh;
    const qy = Math.abs(py) - (hh - r);
    const oy = Math.max(qy, 0);

    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hw;
      const qx = Math.abs(px) - (hw - r);
      const ox = Math.max(qx, 0);
      const len = Math.hypot(ox, oy);

      const depth = -(len + Math.min(Math.max(qx, qy), 0) - r);

      let nx = 0;
      let ny = 0;
      if (len > 0) {
        nx = (ox / len) * Math.sign(px);
        ny = (oy / len) * Math.sign(py);
      } else if (qx > qy) {
        nx = Math.sign(px);
      } else {
        ny = Math.sign(py);
      }

      const t = Math.max(0, Math.min(1, 1 - depth / b));
      const f = 1 - Math.sqrt(1 - t * t);
      const idx = (y * w + x) * 4;

      d[idx] = Math.max(0, Math.min(255, Math.round(128 + nx * f * 127)));
      d[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + ny * f * 127)));
      d[idx + 2] = 128;
      d[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();

  if (mapCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = mapCache.keys().next().value;
    if (oldest) mapCache.delete(oldest);
  }
  mapCache.set(cacheKey, url);

  return url;
}

/**
 * Injects a 3-channel RGB chromatic-aberration SVG <filter> into `defsEl`
 * and binds it directly to `el.style.backdropFilter` on Chromium browsers.
 */
export function applyIosGlassFilter(
  defsEl: SVGDefsElement | null,
  el: HTMLElement | null,
  id: string,
  bezel: number,
  scale: number,
  ab: number,
  tail: string,
): void {
  if (!defsEl || !el || !isChromiumBackdropSvgSupported()) return;

  const w = Math.round(el.offsetWidth);
  const h = Math.round(el.offsetHeight);
  if (w <= 0 || h <= 0) return;

  const mapUrl = buildIosSdfMap(w, h, bezel);
  if (!mapUrl) return;

  const existing = defsEl.querySelector(`#${CSS.escape(id)}`);
  if (existing) existing.remove();

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.id = id;
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '100%');
  filter.setAttribute('height', '100%');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const ch = (name: string, s: number, matrix: string) =>
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="G" result="d${name}"/>` +
    `<feColorMatrix in="d${name}" type="matrix" values="${matrix}" result="c${name}"/>`;

  filter.innerHTML =
    `<feImage href="${mapUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
    ch('r', -scale, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0') +
    ch('g', -(scale + ab), '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0') +
    ch('b', -(scale + ab * 2), '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0') +
    `<feBlend in="cr" in2="cg" mode="screen" result="rg"/>` +
    `<feBlend in="rg" in2="cb" mode="screen"/>`;

  defsEl.appendChild(filter);
  const fullFilter = `url(#${id}) ${tail}`;
  el.style.backdropFilter = fullFilter;
  (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter =
    fullFilter;
}

/** Backwards-compatible export for generic LiquidGlass callers */
export function buildLiquidGlassMap({
  width,
  height,
  bezelRatio = 0.36,
}: DisplacementMapOptions): string {
  const bezel = Math.max(10, Math.min(width, height) * 0.5 * bezelRatio);
  return buildIosSdfMap(width, height, bezel);
}
