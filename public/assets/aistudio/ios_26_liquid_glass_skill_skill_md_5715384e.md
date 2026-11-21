---
name: ios-liquid-glass
description: Implement authentic iOS 26 Liquid Glass optical UI in React, Next.js, and Tailwind CSS using the exact default optical parameters from rdev/liquid-glass-react and shuding/liquid-glass (displacementScale=70, saturation=140, aberrationIntensity=2, elasticity=0.15, dual specular border rings, and direct inline backdrop-filter injection).
---

# iOS 26 Liquid Glass Engineering Guide (Repo Default Calibration)

## 1. Root Cause of "Flat Transparent Glass" & How This Fixes It

When implementing iOS 26 Liquid Glass on the web, elements often appear flat or transparent for three technical reasons:
1. **CSS `@supports (backdrop-filter: url("#test"))` Failure:** Browsers reject `@supports` checks referencing a non-existent `#test` ID or CSS custom properties inside `url()`, falling back to plain `blur()` instead of activating the SVG refraction pipeline. **Fix:** Apply `backdropFilter: \`url(#${filterId}) blur(...) saturate(140%) contrast(1.12) brightness(1.06)\`` directly via React inline styles on Chromium, and detect browser capability cleanly.
2. **Low `displacementScale` (`28` instead of `70`):** In `rdev/liquid-glass-react`, the default `displacementScale` is **`70`** (with `70–120` for prominent pills/docks). Anything below `35` barely bends background pixels.
3. **Missing Dual-Layer Specular Rim & Inner Frost Body:** Real iOS 26 Liquid Glass combines a physical translucent glass body (`rgba(255, 255, 255, 0.22)` with `mix-blend-mode: screen` + `overlay` specular rings) so it remains tactile and visible even over light or low-contrast backgrounds (`overLight` mode).

## 2. Official Default Parameters (from `rdev/liquid-glass-react` & `shuding/liquid-glass`)

Always start with these exact calibrated defaults before tuning:

| Parameter | Repo Default | Range | Optical Effect |
| :--- | :--- | :--- | :--- |
| **`displacementScale`** | **`70`** | `50 – 140` | Intensity of edge lens refraction & background magnification |
| **`blurAmount`** | **`0.0625`** (`~4px`) | `0.0 – 0.25` | Micro-frosting inside the glass (`0.0625` keeps background shapes recognizable while refracting) |
| **`saturation`** | **`140`** (`140%`) | `120 – 180` | Boosts refracted background color vibrancy like thick optical crown glass |
| **`aberrationIntensity`** | **`2`** | `0 – 5` | RGB chromatic dispersion offset along high-contrast bezel edges |
| **`elasticity`** | **`0.15`** | `0.0 – 0.35` | Magnetic cursor pull & liquid squash-and-stretch factor |
| **`cornerRadius`** | **`999`** (pill) / **`28`** (card) | `12 – 999` | Must match the visual `border-radius` so the SDF bezel aligns with the border |
| **`overLight`** | **`false`** | `boolean` | Darkens glass tint & increases contrast when placed over bright white pages |

## 3. Squircle SDF & Liquid Lens Displacement Engine (`liquidGlassEngine.ts`)

This engine implements the exact Signed Distance Field (SDF) lens math from `shuding/liquid-glass` and `rdev/liquid-glass-react` (`standard`, `polar`, `prominent` modes). It computes the smoothed rounded-box distance field, applies the convex bezel refraction curve, and encodes horizontal (`R`) and vertical (`G`) displacement vectors into an offscreen `<canvas>` PNG.

```typescript
// lib/liquidGlassEngine.ts

export type RefractionMode = "standard" | "polar" | "prominent";

export interface DisplacementMapOptions {
  width: number;
  height: number;
  cornerRadius: number;
  bezelRatio?: number; // Portion of half-dimension occupied by curved bezel (default: 0.34)
  mode?: RefractionMode;
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Generates the RGBA displacement texture for SVG <feDisplacementMap>.
 * Encodes X-axis refraction into Red (128 = 0) and Y-axis refraction into Green (128 = 0).
 */
export function buildLiquidGlassMap({
  width,
  height,
  cornerRadius,
  bezelRatio = 0.34,
  mode = "standard",
}: DisplacementMapOptions): string {
  if (typeof document === "undefined" || width <= 0 || height <= 0) {
    return "";
  }

  const w = Math.max(8, Math.round(width));
  const h = Math.max(8, Math.round(height));
  const r = Math.min(cornerRadius, w / 2, h / 2);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  const halfW = w / 2;
  const halfH = h / 2;
  const minHalf = Math.min(halfW, halfH);
  const bezelPx = Math.max(10, minHalf * bezelRatio);

  const innerHalfW = Math.max(0, halfW - r);
  const innerHalfH = Math.max(0, halfH - r);

  for (let y = 0; y < h; y++) {
    const py = y + 0.5 - halfH;
    const ay = Math.abs(py);
    const dy = Math.max(ay - innerHalfH, 0);

    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - halfW;
      const ax = Math.abs(px);
      const dx = Math.max(ax - innerHalfW, 0);

      // Exact Euclidean SDF to rounded rectangle perimeter
      const cornerDist = Math.hypot(dx, dy);
      const sdf =
        cornerDist > 0
          ? cornerDist - r
          : Math.max(ax - halfW, ay - halfH);

      const depthInside = -sdf; // 0 at outer border, > 0 inside element
      const idx = (y * w + x) * 4;

      if (depthInside <= 0) {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
        continue;
      }

      // Normalized distance from outer rim (0 = rim, 1 = inner flat core)
      const t = Math.min(1, depthInside / bezelPx);

      // Outward unit normal vector
      let nx = 0;
      let ny = 0;
      if (cornerDist > 0.0001) {
        nx = (dx / cornerDist) * Math.sign(px);
        ny = (dy / cornerDist) * Math.sign(py);
      } else if (halfW - ax < halfH - ay) {
        nx = Math.sign(px);
      } else {
        ny = Math.sign(py);
      }

      // Refraction profile curve based on mode
      let bendStrength = 0;
      if (mode === "prominent") {
        // Thick convex dome lens across wider bezel
        bendStrength = Math.pow(1 - t, 1.65) * smoothStep(0, 0.08, t + 0.04);
      } else if (mode === "polar") {
        // Radial spherical magnification toward center
        const radial = Math.hypot(px / halfW, py / halfH);
        bendStrength = Math.pow(Math.min(1, radial), 1.8) * (1 - t * 0.65);
      } else {
        // "standard" iOS 26 Squircle glass bezel curve
        bendStrength = Math.pow(1 - t, 2.1) * Math.cos(t * Math.PI * 0.5);
      }

      // Pull background pixels inward toward center (negative normal direction)
      const shiftX = -nx * bendStrength * 127;
      const shiftY = -ny * bendStrength * 127;

      data[idx] = Math.max(0, Math.min(255, Math.round(128 + shiftX)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + shiftY)));
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}
```

## 4. Production `LiquidGlass.tsx` Component (With Default iOS Settings)

This component directly mirrors `rdev/liquid-glass-react`'s exact prop defaults (`displacementScale = 70`, `blurAmount = 0.0625`, `saturation = 140`, `aberrationIntensity = 2`, `elasticity = 0.15`, `cornerRadius = 999`) and injects the SVG `<filter>` URL directly into inline `backdropFilter` so it never renders flat or empty in Chrome, Edge, Arc, or Brave—while automatically falling back to rich frosted Apple glass on Safari/Firefox.

```tsx
// components/ui/LiquidGlass.tsx
"use client";

import React, {
  useEffect,
  useId,
  useRef,
  useState,
  CSSProperties,
  ReactNode,
} from "react";
import { buildLiquidGlassMap, RefractionMode } from "@/lib/liquidGlassEngine";

export interface LiquidGlassProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  /** Controls the intensity of edge lens displacement (repo default: 70) */
  displacementScale?: number;
  /** Controls internal frost blur level 0..1 (repo default: 0.0625) */
  blurAmount?: number;
  /** Controls background color saturation % (repo default: 140) */
  saturation?: number;
  /** Controls RGB chromatic aberration split at edges (repo default: 2) */
  aberrationIntensity?: number;
  /** Controls magnetic liquid elasticity on pointer move 0..0.35 (repo default: 0.15) */
  elasticity?: number;
  /** Corner radius in pixels (repo default: 999 for pill) */
  cornerRadius?: number;
  /** Refraction lens profile (repo default: "standard") */
  mode?: RefractionMode;
  /** Boosts glass contrast & rim definition when placed over bright white backgrounds */
  overLight?: boolean;
  /** Optional padding shorthand */
  padding?: string;
  as?: "div" | "nav" | "button" | "header" | "section";
  onClick?: () => void;
}

export function LiquidGlass({
  children,
  className = "",
  contentClassName = "",
  style,
  displacementScale = 70,
  blurAmount = 0.0625,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 999,
  mode = "standard",
  overLight = false,
  padding,
  as: Component = "div",
  onClick,
}: LiquidGlassProps) {
  const rawId = useId();
  const filterId = `ios-liquid-glass-${rawId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLElement | null>(null);

  const [mapUrl, setMapUrl] = useState<string>("");
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [supportsSvgBackdrop, setSupportsSvgBackdrop] = useState<boolean>(false);
  const [elasticOffset, setElasticOffset] = useState<{
    tx: number;
    ty: number;
    sx: number;
    sy: number;
    mx: string;
    my: string;
    active: boolean;
  }>({
    tx: 0,
    ty: 0,
    sx: 1,
    sy: 1,
    mx: "50%",
    my: "20%",
    active: false,
  });

  // Detect Chromium SVG backdrop-filter capability safely on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isChromium =
      Boolean((window as unknown as { chrome?: unknown }).chrome) ||
      /Chrome|Chromium|Edg|Brave|Arc/i.test(navigator.userAgent);
    const notFirefoxOrSafariOnly = !/Firefox/i.test(navigator.userAgent);
    setSupportsSvgBackdrop(isChromium && notFirefoxOrSafariOnly);
  }, []);

  // Recompute SDF displacement map whenever element dimensions or radius change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const recalc = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w <= 0 || h <= 0) return;

      setDims({ w, h });
      const bezelRatio = mode === "prominent" ? 0.44 : 0.34;
      const url = buildLiquidGlassMap({
        width: w,
        height: h,
        cornerRadius,
        bezelRatio,
        mode,
      });
      setMapUrl(url);
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cornerRadius, mode]);

  // Magnetic liquid pull + squash/stretch elasticity
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. +0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 .. +0.5

    const pull = elasticity * 18;
    const stretch = elasticity * 0.08;

    setElasticOffset({
      tx: relX * pull,
      ty: relY * pull,
      sx: 1 + Math.abs(relX) * stretch - Math.abs(relY) * (stretch * 0.4),
      sy: 1 + Math.abs(relY) * stretch - Math.abs(relX) * (stretch * 0.4),
      mx: `${((relX + 0.5) * 100).toFixed(1)}%`,
      my: `${((relY + 0.5) * 100).toFixed(1)}%`,
      active: true,
    });
  };

  const handlePointerLeave = () => {
    setElasticOffset({
      tx: 0,
      ty: 0,
      sx: 1,
      sy: 1,
      mx: "50%",
      my: "20%",
      active: false,
    });
  };

  const blurPx = Math.max(0.5, blurAmount * 48);
  const effectiveRadius = Math.min(
    cornerRadius,
    dims.w > 0 ? dims.w / 2 : cornerRadius,
    dims.h > 0 ? dims.h / 2 : cornerRadius
  );

  // Direct inline backdropFilter ensures SVG url(#id) is never stripped by CSS parsers
  const activeBackdropFilter =
    supportsSvgBackdrop && mapUrl
      ? `url(#${filterId}) blur(${blurPx.toFixed(2)}px) saturate(${saturation}%) contrast(1.08) brightness(${overLight ? 0.98 : 1.04})`
      : `blur(${Math.max(18, blurPx * 4).toFixed(0)}px) saturate(${Math.max(175, saturation)}%) brightness(${overLight ? 0.96 : 1.05})`;

  const glassStyle: CSSProperties = {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderRadius: `${effectiveRadius}px`,
    padding,
    backdropFilter: activeBackdropFilter,
    WebkitBackdropFilter: activeBackdropFilter,
    background: overLight
      ? "linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(242, 244, 248, 0.36) 55%, rgba(255, 255, 255, 0.48) 100%)"
      : "linear-gradient(145deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.08) 52%, rgba(255, 255, 255, 0.18) 100%)",
    boxShadow: overLight
      ? `0 16px 38px -10px rgba(15, 23, 42, 0.18),
         0 4px 12px -2px rgba(15, 23, 42, 0.08),
         inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.92),
         inset 0 -1.5px 2px 0 rgba(15, 23, 42, 0.12),
         inset 0 0 22px 0 rgba(255, 255, 255, 0.35)`
      : `0 20px 44px -12px rgba(0, 0, 0, 0.32),
         0 4px 14px -2px rgba(0, 0, 0, 0.16),
         inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.78),
         inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.24),
         inset 0 0 20px 0 rgba(255, 255, 255, 0.16)`,
    transform: `translate3d(${elasticOffset.tx.toFixed(2)}px, ${elasticOffset.ty.toFixed(2)}px, 0) scale(${elasticOffset.sx.toFixed(4)}, ${elasticOffset.sy.toFixed(4)})`,
    transition: elasticOffset.active
      ? "transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease"
      : "transform 0.48s cubic-bezier(0.22, 1.4, 0.36, 1), box-shadow 0.3s ease",
    willChange: "transform",
    ...style,
  };

  return (
    <>
      {mapUrl && dims.w > 0 && dims.h > 0 && (
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{
            position: "fixed",
            top: -9999,
            left: -9999,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        >
          <defs>
            <filter
              id={filterId}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={mapUrl}
                x="0"
                y="0"
                width={dims.w}
                height={dims.h}
                preserveAspectRatio="none"
                result="dispMap"
              />

              {/* Red Channel with Chromatic Aberration */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale={displacementScale + aberrationIntensity * 3}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispR"
              />
              <feColorMatrix
                in="dispR"
                type="matrix"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="chanR"
              />

              {/* Green Channel (Base Refraction) */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispG"
              />
              <feColorMatrix
                in="dispG"
                type="matrix"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="chanG"
              />

              {/* Blue Channel with Opposite Chromatic Aberration */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale={Math.max(0, displacementScale - aberrationIntensity * 3)}
                xChannelSelector="R"
                yChannelSelector="G"
                result="dispB"
              />
              <feColorMatrix
                in="dispB"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="chanB"
              />

              {/* Additive RGB Screen Recombination */}
              <feBlend in="chanR" in2="chanG" mode="screen" result="rg" />
              <feBlend in="rg" in2="chanB" mode="screen" result="rgbOut" />
            </filter>
          </defs>
        </svg>
      )}

      <Component
        ref={containerRef as never}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={glassStyle}
        className={className}
      >
        {/* Outer Specular Rim Light (Top-Left Sky Reflection + Bottom-Right Bounce) */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: "1.5px",
            pointerEvents: "none",
            zIndex: 2,
            background: overLight
              ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 35%, rgba(15,23,42,0.08) 70%, rgba(255,255,255,0.75) 100%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.28) 30%, rgba(255,255,255,0.04) 68%, rgba(255,255,255,0.52) 100%)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Dynamic Pointer Caustic Sheen */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 1,
            opacity: elasticOffset.active ? 1 : 0.45,
            background: `radial-gradient(180px circle at ${elasticOffset.mx} ${elasticOffset.my}, rgba(255, 255, 255, ${overLight ? 0.55 : 0.34}), rgba(255, 255, 255, 0.04) 55%, transparent 80%)`,
            transition: "opacity 0.25s ease",
          }}
        />

        {/* Foreground Content */}
        <div
          className={contentClassName}
          style={{ position: "relative", zIndex: 3 }}
        >
          {children}
        </div>
      </Component>
    </>
  );
}
```

## 5. Ready-to-Use Examples with Default iOS Settings

### A. Default iOS 26 Floating Pill / Button (`rdev/liquid-glass-react` Default Look)
```tsx
import { LiquidGlass } from "@/components/ui/LiquidGlass";

export function LiquidGlassPillExample() {
  return (
    <LiquidGlass
      displacementScale={70}
      blurAmount={0.0625}
      saturation={140}
      aberrationIntensity={2}
      elasticity={0.15}
      cornerRadius={999}
      padding="14px 28px"
      onClick={() => console.log("Liquid Glass clicked")}
      className="cursor-pointer select-none"
    >
      <span className="font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        iOS 26 Liquid Glass
      </span>
    </LiquidGlass>
  );
}
```

### B. Over Light / White Background (`overLight={true}`)
If the background behind your Liquid Glass component is light gray or pure white (like a clean dashboard), always pass `overLight={true}` so the glass rim, inner frost, and shadow remain distinctly sculpted instead of vanishing into white:
```tsx
<LiquidGlass
  overLight={true}
  displacementScale={75}
  blurAmount={0.08}
  saturation={140}
  aberrationIntensity={2.5}
  cornerRadius={28}
  padding="20px 24px"
>
  <h4 className="font-semibold text-slate-900">Control Center Card</h4>
  <p className="text-sm text-slate-700">Visible rim & refraction even on light UI</p>
</LiquidGlass>
```

## 6. Why It Might Still Look Plain If Tested Improperly (Quick Checklist)
1. **Background Content Requirement:** `backdrop-filter` refracts **what is positioned behind the element in the DOM**. If you test `<LiquidGlass>` on top of a solid single-color `div` (`#ffffff` or `#000000`), bending a solid color produces the exact same solid color. Always place a colorful mesh gradient, photo, map, or text grid behind the glass to see the lens warp.
2. **`overLight` Mode:** On light-mode pages (`bg-white` / `bg-slate-50`), set `overLight={true}` so the glass specular border and frosted body have proper contrast.
3. **Browser Engine:** Full SVG pixel displacement (`feDisplacementMap` on `backdrop-filter`) runs natively in **Chrome, Edge, Brave, and Arc**. Safari and Firefox automatically use the built-in high-saturation frosted glass fallback.