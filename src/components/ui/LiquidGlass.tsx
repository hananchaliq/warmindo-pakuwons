import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useReducedMotion } from 'motion/react';
import { buildLiquidGlassMap, type RefractionMode } from '../../lib/liquidGlassEngine';

export interface LiquidGlassProps {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  /** Intensity of edge lens displacement (iOS 26 default: 70) */
  displacementScale?: number;
  /** Internal post-refraction frost blur level 0..1 (iOS 26 default: 0.0625) */
  blurAmount?: number;
  /** Optional pre-refraction frosted backdrop blur in px so blur & curved edge refraction coexist */
  preBlur?: number;
  /** Background color saturation percentage (default: 140) */
  saturation?: number;
  /** RGB chromatic aberration split along curved edges (default: 2) */
  aberrationIntensity?: number;
  /** Magnetic liquid pull & squash/stretch on pointer hover (default: 0.15) */
  elasticity?: number;
  /** Corner radius in px (default: 999 for pill) */
  cornerRadius?: number;
  /** Refraction lens profile */
  mode?: RefractionMode;
  /** Enhances glass contrast & rim definition over light backgrounds */
  overLight?: boolean;
  /** Optional padding shorthand */
  padding?: string;
  /**
   * Renders the backdrop-filter and specular rim on a sibling background layer
   * instead of an ancestor isolation container so nested Liquid Glass droplets
   * can refract real backdrop content and swell beyond the inner edge without clipping.
   */
  allowOverflow?: boolean;
  /** Intensifies prismatic RGB chromatic rim & liquid specular gleam (e.g., on click/morph) */
  chromaticRim?: boolean;
  as?: 'div' | 'nav' | 'button' | 'header' | 'section' | 'span';
  onClick?: () => void;
}

export function LiquidGlass({
  children,
  className = '',
  contentClassName = '',
  style,
  displacementScale = 70,
  blurAmount = 0.0625,
  preBlur = 8,
  saturation = 145,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 999,
  mode = 'standard',
  overLight = false,
  padding,
  allowOverflow = false,
  chromaticRim = false,
  as: Component = 'div',
  onClick,
}: LiquidGlassProps) {
  const rawId = useId();
  const filterId = `ios-liquid-glass-${rawId.replace(/:/g, '')}`;
  const containerRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [mapUrl, setMapUrl] = useState<string>('');
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
    mx: '50%',
    my: '22%',
    active: false,
  });

  // Detect Chromium SVG backdrop-filter capability safely on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isChromium =
      Boolean((window as unknown as { chrome?: unknown }).chrome) ||
      /Chrome|Chromium|Edg|Brave|Arc|HeadlessChrome/i.test(navigator.userAgent);
    const notFirefox = !/Firefox/i.test(navigator.userAgent);
    setSupportsSvgBackdrop(isChromium && notFirefox);
  }, []);

  // Recompute SDF displacement map whenever element dimensions, radius, or mode change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const recalc = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w <= 0 || h <= 0) return;

      setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      const bezelRatio = mode === 'prominent' ? 0.46 : mode === 'polar' ? 0.48 : 0.36;
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

  const effectiveElasticity = reducedMotion ? 0 : elasticity;

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!containerRef.current || effectiveElasticity <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    const pull = effectiveElasticity * 16;
    const stretch = effectiveElasticity * 0.085;

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
    if (effectiveElasticity <= 0 && !elasticOffset.active) return;
    setElasticOffset({
      tx: 0,
      ty: 0,
      sx: 1,
      sy: 1,
      mx: '50%',
      my: '22%',
      active: false,
    });
  };

  const blurPx = Math.max(1.5, preBlur > 0 ? preBlur : blurAmount * 48);
  const effectiveRadius = Math.min(
    cornerRadius,
    dims.w > 0 ? dims.w / 2 : cornerRadius,
    dims.h > 0 ? dims.h / 2 : cornerRadius,
  );

  // Direct inline backdropFilter guarantees SVG url(#id) + rich blur are never stripped
  // Single-pass order (url -> blur -> saturate) preserves crisp lens refraction at 60fps
  const activeBackdropFilter =
    supportsSvgBackdrop && mapUrl
      ? `url(#${filterId}) blur(${blurPx.toFixed(1)}px) saturate(${saturation}%) contrast(1.08) brightness(${overLight ? 0.99 : 1.06})`
      : `blur(${Math.max(16, blurPx * 2.2).toFixed(0)}px) saturate(${Math.max(175, saturation)}%) brightness(${overLight ? 0.98 : 1.06})`;

  const surfaceBackground = overLight
    ? chromaticRim
      ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.72) 0%, rgba(250, 246, 239, 0.34) 48%, rgba(255, 255, 255, 0.64) 100%)'
      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.58) 0%, rgba(245, 241, 234, 0.36) 52%, rgba(255, 255, 255, 0.50) 100%)'
    : chromaticRim
      ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.30) 0%, rgba(232, 198, 150, 0.12) 48%, rgba(255, 255, 255, 0.22) 100%)'
      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.20) 0%, rgba(16, 14, 12, 0.28) 52%, rgba(255, 255, 255, 0.14) 100%)';

  const surfaceShadow = overLight
    ? chromaticRim
      ? `0 14px 32px -8px rgba(20, 18, 16, 0.22),
         0 4px 12px -2px rgba(154, 107, 56, 0.16),
         inset 0 2px 1.5px 0 rgba(255, 255, 255, 0.98),
         inset 0 -2px 3px 0 rgba(20, 18, 16, 0.12),
         inset 0 0 24px 0 rgba(255, 255, 255, 0.48)`
      : `0 14px 34px -10px rgba(20, 18, 16, 0.18),
         0 4px 12px -2px rgba(20, 18, 16, 0.08),
         inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.94),
         inset 0 -1.5px 2px 0 rgba(20, 18, 16, 0.10),
         inset 0 0 20px 0 rgba(255, 255, 255, 0.36)`
    : chromaticRim
      ? `0 18px 38px -8px rgba(0, 0, 0, 0.52),
         0 4px 16px -2px rgba(232, 198, 150, 0.22),
         inset 0 2px 1.5px 0 rgba(255, 255, 255, 0.92),
         inset 0 -2px 3px 0 rgba(232, 198, 150, 0.34),
         inset 0 0 24px 0 rgba(255, 255, 255, 0.22)`
      : `0 18px 42px -12px rgba(0, 0, 0, 0.44),
         0 4px 14px -2px rgba(0, 0, 0, 0.22),
         inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.72),
         inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.22),
         inset 0 0 18px 0 rgba(255, 255, 255, 0.14)`;

  const rimGradient = chromaticRim
    ? overLight
      ? 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(125,211,252,0.52) 24%, rgba(255,255,255,0.45) 48%, rgba(216,176,122,0.62) 74%, rgba(255,255,255,0.94) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(186,230,253,0.55) 26%, rgba(255,255,255,0.16) 50%, rgba(232,198,150,0.72) 76%, rgba(255,255,255,0.86) 100%)'
    : overLight
      ? 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.40) 35%, rgba(20,18,16,0.10) 70%, rgba(255,255,255,0.80) 100%)'
      : 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.28) 32%, rgba(255,255,255,0.06) 68%, rgba(255,255,255,0.52) 100%)';

  const elasticTransform =
    effectiveElasticity > 0
      ? `translate3d(${elasticOffset.tx.toFixed(2)}px, ${elasticOffset.ty.toFixed(2)}px, 0) scale(${elasticOffset.sx.toFixed(4)}, ${elasticOffset.sy.toFixed(4)})`
      : undefined;

  const backdropLayerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: `${effectiveRadius}px`,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
    backdropFilter: activeBackdropFilter,
    WebkitBackdropFilter: activeBackdropFilter,
    background: surfaceBackground,
    boxShadow: surfaceShadow,
  };

  const containerStyle: CSSProperties = allowOverflow
    ? {
        position: 'relative',
        overflow: 'visible',
        borderRadius: `${effectiveRadius}px`,
        padding,
        transform: elasticTransform,
        transition: elasticOffset.active
          ? 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'transform 0.48s cubic-bezier(0.22, 1.4, 0.36, 1)',
        willChange: effectiveElasticity > 0 ? 'transform' : undefined,
        ...style,
      }
    : {
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        borderRadius: `${effectiveRadius}px`,
        padding,
        backdropFilter: activeBackdropFilter,
        WebkitBackdropFilter: activeBackdropFilter,
        background: surfaceBackground,
        boxShadow: surfaceShadow,
        transform: elasticTransform,
        transition: elasticOffset.active
          ? 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease'
          : 'transform 0.48s cubic-bezier(0.22, 1.4, 0.36, 1), box-shadow 0.3s ease',
        willChange: effectiveElasticity > 0 ? 'transform' : undefined,
        ...style,
      };

  const specularLayers = (
    <>
      {/* Outer Dual-Layer Specular Rim Light */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: chromaticRim ? '1.75px' : '1.25px',
          pointerEvents: 'none',
          zIndex: 2,
          background: rimGradient,
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Dynamic Pointer Caustic Sheen & Top Liquid Meniscus Reflection */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: elasticOffset.active ? 1 : chromaticRim ? 0.72 : 0.48,
          background: `radial-gradient(170px circle at ${elasticOffset.mx} ${elasticOffset.my}, rgba(255, 255, 255, ${overLight ? 0.58 : 0.36}), rgba(255, 255, 255, 0.05) 55%, transparent 80%)`,
          transition: 'opacity 0.25s ease',
        }}
      />
    </>
  );

  return (
    <>
      {mapUrl && dims.w > 0 && dims.h > 0 && (
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{
            position: 'fixed',
            top: -9999,
            left: -9999,
            width: 0,
            height: 0,
            pointerEvents: 'none',
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
        style={containerStyle}
        className={className}
      >
        {allowOverflow ? (
          <span aria-hidden="true" style={backdropLayerStyle}>
            {specularLayers}
          </span>
        ) : (
          specularLayers
        )}

        <div
          className={contentClassName}
          style={{ position: 'relative', zIndex: 3, width: '100%', height: '100%' }}
        >
          {children}
        </div>
      </Component>
    </>
  );
}
