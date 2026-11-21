import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Box,
  Flame,
  Home,
  MapPin,
  Moon,
  ShoppingBag,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';
import { STORE_INFO } from '../data/menu';
import { BrandEmblem, SPRING_POP_EASE } from './MotionPrimitives';
import { applyIosGlassFilter } from '../lib/liquidGlassEngine';
import { computeActiveSectionId, type SectionId, type ThemeMode } from '../utils/motionCraft';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  theme: ThemeMode;
  onToggleTheme: (event: MouseEvent<HTMLButtonElement>) => void;
}

interface IOSNavItem {
  id: SectionId;
  label: string;
  shortLabel: string;
  icon: ReactNode;
}

const IOS_NAV_ITEMS: IOSNavItem[] = [
  {
    id: 'beranda',
    label: 'Beranda',
    shortLabel: 'Beranda',
    icon: <Home className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />,
  },
  {
    id: 'studio-3d',
    label: 'Studio 3D',
    shortLabel: '3D',
    icon: <Box className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />,
  },
  {
    id: 'menu',
    label: 'Katalog',
    shortLabel: 'Katalog',
    icon: <UtensilsCrossed className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />,
  },
  {
    id: 'cerita',
    label: 'Kisah',
    shortLabel: 'Kisah',
    icon: <Flame className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />,
  },
  {
    id: 'lokasi',
    label: 'Lokasi',
    shortLabel: 'Lokasi',
    icon: <MapPin className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden="true" />,
  },
];

function useViewportMetrics() {
  const [metrics, setMetrics] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1280, isDesktop: true };
    }
    return {
      width: window.innerWidth,
      isDesktop: window.innerWidth >= 1024,
    };
  });

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setMetrics((prev) => {
        const isDesktop = width >= 1024;
        if (prev.width === width && prev.isDesktop === isDesktop) return prev;
        return { width, isDesktop };
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return metrics;
}

/**
 * Attaches the reference magnetic cursor elasticity + dynamic directional
 * specular rim variables (--ang, --lo, --hi, --p1, --p2, --gx, --gy) and
 * press-squish (k = 0.96) to any `.lg-bar` element.
 */
function useLiquidGlassMagnetism(
  anchorRef: React.RefObject<HTMLElement | null>,
  barRef: React.RefObject<HTMLElement | null>,
  reducedMotion: boolean,
  elasticity = 0.35,
  zone = 200,
) {
  useEffect(() => {
    const anchor = anchorRef.current;
    const bar = barRef.current;
    if (!anchor || !bar) return;

    const cu = { x: 0, y: 0, sx: 1, sy: 1, k: 1 };
    const tg = { x: 0, y: 0, sx: 1, sy: 1, k: 1 };
    let eraf = 0;

    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

    const etick = () => {
      let diff = 0;
      (['x', 'y', 'sx', 'sy', 'k'] as const).forEach((key) => {
        const df = tg[key] - cu[key];
        cu[key] += df * 0.14;
        diff += Math.abs(df);
      });
      if (!reducedMotion) {
        bar.style.transform = `translate(${cu.x}px, ${cu.y}px) scale(${cu.sx * cu.k}, ${cu.sy * cu.k})`;
      } else {
        bar.style.transform = '';
      }
      eraf = diff > 0.002 ? window.requestAnimationFrame(etick) : 0;
    };

    const kick = () => {
      if (!eraf) eraf = window.requestAnimationFrame(etick);
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = anchor.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;

      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const gap = Math.hypot(
        Math.max(0, Math.abs(dx) - r.width / 2),
        Math.max(0, Math.abs(dy) - r.height / 2),
      );
      const fade = gap > zone ? 0 : 1 - gap / zone;

      if (!reducedMotion) {
        tg.x = dx * elasticity * 0.1 * fade;
        tg.y = dy * elasticity * 0.1 * fade;
        tg.sx = 1 + Math.min(Math.abs(dx) / r.width, 1) * elasticity * 0.35 * fade;
        tg.sy = 1 + Math.min(Math.abs(dy) / r.height, 2) * elasticity * 0.15 * fade;
        kick();
      }

      const px = clamp((dx / r.width) * 100, 50);
      const py = clamp((dy / r.height) * 100, 50);
      const br = bar.getBoundingClientRect();
      const s = bar.style;
      s.setProperty('--ang', `${(135 + px * 1.2).toFixed(1)}deg`);
      s.setProperty('--lo', (0.12 + Math.abs(px) * 0.008).toFixed(3));
      s.setProperty('--hi', (0.4 + Math.abs(px) * 0.012).toFixed(3));
      s.setProperty('--p1', `${Math.max(10, 33 + py * 0.3).toFixed(1)}%`);
      s.setProperty('--p2', `${Math.min(90, 66 + py * 0.4).toFixed(1)}%`);
      s.setProperty('--gx', `${(((e.clientX - br.left) / br.width) * 100).toFixed(1)}%`);
      s.setProperty('--gy', `${(((e.clientY - br.top) / br.height) * 100).toFixed(1)}%`);
    };

    const onDown = () => {
      bar.classList.add('down');
      if (!reducedMotion) {
        tg.k = 0.96;
        kick();
      }
    };

    const onUp = () => {
      bar.classList.remove('down');
      if (!reducedMotion) {
        tg.k = 1;
        kick();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    bar.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      if (eraf) window.cancelAnimationFrame(eraf);
      window.removeEventListener('pointermove', onPointerMove);
      bar.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [anchorRef, barRef, reducedMotion, elasticity, zone]);
}

interface IosLiquidCapsuleProps {
  children: ReactNode;
  theme: ThemeMode;
  defsRef: React.RefObject<SVGDefsElement | null>;
  className?: string;
  barClassName?: string;
  bezel?: number;
  scale?: number;
  ab?: number;
  elasticity?: number;
  recalcKey?: string | number;
}

/**
 * Compact floating iOS 26 Liquid Glass capsule (Brand pill, Theme Toggle, Cart WA pill)
 * using the exact same SDF refraction filter, dynamic specular rim, and magnetic pull.
 */
function IosLiquidCapsule({
  children,
  theme,
  defsRef,
  className = '',
  barClassName = '',
  bezel = 18,
  scale = 64,
  ab = 5,
  elasticity = 0.32,
  recalcKey,
}: IosLiquidCapsuleProps) {
  const uid = useId().replace(/:/g, '');
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = Boolean(useReducedMotion());

  useLiquidGlassMagnetism(anchorRef, barRef, reducedMotion, elasticity, 180);

  useEffect(() => {
    const bar = barRef.current;
    const defs = defsRef.current;
    if (!bar || !defs) return;

    const tail =
      theme === 'dark'
        ? 'blur(3px) saturate(180%) brightness(1.1)'
        : 'blur(3.5px) saturate(185%) brightness(1.03)';

    const rebuild = () => {
      applyIosGlassFilter(defs, bar, `lg-cap-${uid}`, bezel, scale, ab, tail);
    };

    rebuild();
    const ro = new ResizeObserver(rebuild);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [theme, defsRef, uid, bezel, scale, ab, recalcKey]);

  return (
    <div ref={anchorRef} className={`pointer-events-auto inline-flex shrink-0 ${className}`}>
      <div ref={barRef} className={`lg-bar ${barClassName}`}>
        <span className="lg-glow" aria-hidden="true" />
        <div className="relative z-[1] flex h-full w-full items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

interface IosLiquidTabBarProps {
  activeIndex: number;
  onSelect: (id: SectionId) => void;
  theme: ThemeMode;
  defsRef: React.RefObject<SVGDefsElement | null>;
  isDesktop: boolean;
  viewportWidth: number;
  ariaLabel: string;
  testId: string;
}

/**
 * 1:1 Faithful iOS 26 Liquid Glass Segmented Tab Bar from Navbar_Liquid_Glass_iOS.html:
 * - Real-time rAF spring position & velocity squash-and-stretch
 * - Press / click / drag inflation to 1.2x crystal-clear liquid droplet (.lg-pill.press)
 * - Dual SVG SDF chromatic refraction filters (#lg-bar + #lg-pill)
 * - Whole-bar magnetic cursor elasticity + dynamic specular rim lighting
 */
function IosLiquidTabBar({
  activeIndex,
  onSelect,
  theme,
  defsRef,
  isDesktop,
  viewportWidth,
  ariaLabel,
  testId,
}: IosLiquidTabBarProps) {
  const uid = useId().replace(/:/g, '');
  const anchorRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const reducedMotion = Boolean(useReducedMotion());
  const [visualIndex, setVisualIndex] = useState(activeIndex);
  const [isPressedVisual, setIsPressedVisual] = useState(false);

  // Mutable spring physics state (verbatim from reference HTML)
  const physRef = useRef({
    cur: activeIndex,
    x: 0,
    v: 0,
    tx: 0,
    w: 0,
    pressed: false,
    press: 1,
    pv: 0,
    dragging: false,
    downAt: 0,
    last: 0,
    raf: 0,
    releaseTimer: 0,
    go: () => {},
    tabLeft: (i: number) => 6 + i * 76,
    buildFilters: () => {},
  });

  useLiquidGlassMagnetism(anchorRef, barRef, reducedMotion, 0.35, 200);

  // Responsive tab width matching reference (76px standard, 66px <=400px, 58px <=355px, 90px desktop)
  const tabWidth = isDesktop
    ? viewportWidth >= 1220
      ? 92
      : 82
    : viewportWidth <= 355
      ? 58
      : viewportWidth <= 400
        ? 66
        : 76;
  const tabHeight = isDesktop ? 54 : 58;

  // Rebuild SVG SDF filters whenever size or theme changes
  useEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    const defs = defsRef.current;
    if (!bar || !pill || !defs) return;

    const barTail =
      theme === 'dark'
        ? 'blur(3px) saturate(180%) brightness(1.1)'
        : 'blur(3.5px) saturate(185%) brightness(1.03)';
    const pillTail =
      theme === 'dark'
        ? 'blur(0.5px) saturate(190%) brightness(1.2)'
        : 'blur(0.5px) saturate(195%) brightness(1.06)';

    const buildFilters = () => {
      applyIosGlassFilter(defs, bar, `lg-bar-${uid}`, 22, 70, 6, barTail);
      applyIosGlassFilter(defs, pill, `lg-pill-${uid}`, 24, 80, 8, pillTail);
    };

    physRef.current.buildFilters = buildFilters;

    const layout = () => {
      const firstTab = tabRefs.current[0];
      if (!firstTab) return;
      const p = physRef.current;
      p.w = firstTab.offsetWidth;
      pill.style.width = `${p.w}px`;
      p.x = p.tx = p.tabLeft(p.cur);
      p.v = 0;
      pill.style.transform = `translateX(${p.x}px) scale(${p.press}, ${p.press})`;
      buildFilters();
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(bar);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(layout);
    }

    return () => ro.disconnect();
  }, [theme, defsRef, uid, tabWidth, tabHeight]);

  // Core rAF spring physics + pointer scrubbing/click-pulse engine
  useEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    if (!bar || !pill) return;

    const p = physRef.current;

    p.tabLeft = (i: number) => {
      const t = tabRefs.current[i];
      return t ? t.offsetLeft : 6 + i * p.w;
    };

    const draw = () => {
      const st = reducedMotion ? 0 : Math.min(0.4, Math.abs(p.v) / 2200);
      const effectivePress = reducedMotion ? 1 : p.press;
      const sx = effectivePress * (1 + st);
      const sy = effectivePress * (1 - st * 0.55);
      pill.style.transform = `translateX(${p.x}px) scale(${sx}, ${sy})`;
    };

    const nearest = (centerX: number) => {
      let best = 0;
      let bd = 1e9;
      tabRefs.current.forEach((t, i) => {
        if (!t) return;
        const d = Math.abs(t.offsetLeft + t.offsetWidth / 2 - centerX);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    };

    const tick = (t: number) => {
      const dt = Math.min(0.032, (t - p.last) / 1000 || 0.016);
      p.last = t;

      // Position spring
      const k = p.dragging ? 420 : 260;
      const c = p.dragging ? 30 : 21;
      p.v += ((p.tx - p.x) * k - p.v * c) * dt;
      p.x += p.v * dt;

      // Press liquid-droplet inflation spring (1.0 -> 1.2)
      const target = p.pressed ? 1.2 : 1;
      p.pv += ((target - p.press) * 380 - p.pv * 20) * dt;
      p.press += p.pv * dt;

      draw();

      if (
        Math.abs(p.tx - p.x) > 0.1 ||
        Math.abs(p.v) > 0.5 ||
        Math.abs(target - p.press) > 0.001 ||
        Math.abs(p.pv) > 0.01
      ) {
        p.raf = window.requestAnimationFrame(tick);
      } else {
        p.x = p.tx;
        p.v = 0;
        p.press = target;
        p.pv = 0;
        draw();
        p.raf = 0;
      }
    };

    p.go = () => {
      if (!p.raf) {
        p.last = performance.now();
        p.raf = window.requestAnimationFrame(tick);
      }
    };

    const localX = (e: PointerEvent) => e.clientX - bar.getBoundingClientRect().left;
    const clampX = (px: number) => Math.max(6, Math.min(bar.offsetWidth - 6 - p.w, px));

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (p.releaseTimer) {
        window.clearTimeout(p.releaseTimer);
        p.releaseTimer = 0;
      }
      bar.setPointerCapture(e.pointerId);
      p.pressed = true;
      p.dragging = true;
      p.downAt = performance.now();
      pill.classList.add('press');
      setIsPressedVisual(true);
      p.tx = clampX(localX(e) - p.w / 2);
      setVisualIndex(nearest(p.tx + p.w / 2));
      p.go();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!p.dragging) return;
      p.tx = clampX(localX(e) - p.w / 2);
      setVisualIndex(nearest(p.tx + p.w / 2));
      p.go();
    };

    const onPointerEnd = (e: PointerEvent) => {
      if (!p.dragging) return;
      if (bar.hasPointerCapture(e.pointerId)) {
        bar.releasePointerCapture(e.pointerId);
      }
      p.dragging = false;
      const chosenIdx = nearest(p.tx + p.w / 2);
      p.cur = chosenIdx;
      setVisualIndex(chosenIdx);
      p.tx = p.tabLeft(chosenIdx);

      const chosen = IOS_NAV_ITEMS[chosenIdx];
      if (chosen) {
        onSelectRef.current(chosen.id);
      }

      // If this was a quick tap, hold the 1.2x crystal liquid droplet pulse briefly so it's clearly felt
      const heldMs = performance.now() - p.downAt;
      const holdExtra = heldMs < 160 ? 220 : 0;

      const finishRelease = () => {
        p.pressed = false;
        pill.classList.remove('press');
        setIsPressedVisual(false);
        p.go();
      };

      if (holdExtra > 0) {
        p.go();
        p.releaseTimer = window.setTimeout(() => {
          p.releaseTimer = 0;
          finishRelease();
        }, holdExtra);
      } else {
        finishRelease();
      }
    };

    bar.addEventListener('pointerdown', onPointerDown);
    bar.addEventListener('pointermove', onPointerMove);
    bar.addEventListener('pointerup', onPointerEnd);
    bar.addEventListener('pointercancel', onPointerEnd);

    return () => {
      if (p.raf) window.cancelAnimationFrame(p.raf);
      if (p.releaseTimer) window.clearTimeout(p.releaseTimer);
      bar.removeEventListener('pointerdown', onPointerDown);
      bar.removeEventListener('pointermove', onPointerMove);
      bar.removeEventListener('pointerup', onPointerEnd);
      bar.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [reducedMotion]);

  // Synchronize external scroll-spy updates cleanly into the spring target
  useEffect(() => {
    const p = physRef.current;
    if (p.dragging) return;
    p.cur = activeIndex;
    setVisualIndex(activeIndex);
    p.tx = p.tabLeft(activeIndex);
    p.go();
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const next =
      e.key === 'ArrowRight' ? idx + 1 : e.key === 'ArrowLeft' ? idx - 1 : null;
    if (next === null || next < 0 || next >= IOS_NAV_ITEMS.length) return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    const p = physRef.current;
    p.cur = next;
    setVisualIndex(next);
    p.tx = p.tabLeft(next);
    p.go();
    onSelect(IOS_NAV_ITEMS[next].id);
  };

  const handleKeyboardClick = (e: React.MouseEvent<HTMLButtonElement>, idx: number) => {
    // Keyboard activation (detail === 0); pointer clicks are handled by pointerdown/up on the bar
    if (e.detail === 0) {
      const p = physRef.current;
      p.cur = idx;
      setVisualIndex(idx);
      p.tx = p.tabLeft(idx);
      p.go();
      onSelect(IOS_NAV_ITEMS[idx].id);
    }
  };

  return (
    <nav
      ref={anchorRef}
      aria-label={ariaLabel}
      data-testid={testId}
      className="pointer-events-auto inline-flex"
    >
      <div ref={barRef} className="lg-bar p-[6px]">
        <span className="lg-glow" aria-hidden="true" />
        <div
          ref={pillRef}
          data-testid="ios-active-liquid-pill"
          data-liquid-pressed={isPressedVisual ? 'true' : 'false'}
          className="lg-pill"
          aria-hidden="true"
        />
        {IOS_NAV_ITEMS.map((item, idx) => {
          const isOn = idx === visualIndex;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              data-no-active-scale="true"
              aria-current={idx === activeIndex ? 'page' : 'false'}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={(e) => handleKeyboardClick(e, idx)}
              style={{ width: `${tabWidth}px`, height: `${tabHeight}px` }}
              className={`lg-tab ${isOn ? 'on' : ''}`}
            >
              {item.icon}
              <span className="truncate max-w-full px-0.5">
                {isDesktop ? item.label : item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Navbar({ cartCount, onOpenCart, theme, onToggleTheme }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('beranda');
  const manualNavLockUntilRef = useRef<number>(0);
  const defsRef = useRef<SVGDefsElement | null>(null);

  const { width: viewportWidth, isDesktop } = useViewportMetrics();

  // Synchronize active section monotonically on scroll
  useEffect(() => {
    let rafId = 0;

    const syncScrollState = () => {
      rafId = 0;
      if (performance.now() < manualNavLockUntilRef.current) {
        return;
      }

      const scrollY = window.scrollY;
      const sectionMetrics: { id: SectionId; top: number }[] = [];
      for (const link of IOS_NAV_ITEMS) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY;
          sectionMetrics.push({ id: link.id, top });
        }
      }

      const nextActive = computeActiveSectionId(
        scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
        sectionMetrics,
      );
      setActiveSection(nextActive);
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(syncScrollState);
      }
    };

    syncScrollState();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const navigateToSection = useCallback((id: SectionId) => {
    setActiveSection(id);
    manualNavLockUntilRef.current = performance.now() + 850;

    if (id === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(id);
    if (!target) return;

    const offset = window.innerWidth >= 1024 ? 92 : 72;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  const activeIndex = useMemo(() => {
    const idx = IOS_NAV_ITEMS.findIndex((item) => item.id === activeSection);
    return idx >= 0 ? idx : 0;
  }, [activeSection]);

  return (
    <>
      {/* Shared hidden SVG <defs> container for Chromium Liquid Glass displacement filters */}
      <svg className="lg-defs" aria-hidden="true">
        <defs ref={defsRef} />
      </svg>

      {isDesktop ? (
        /* ================================================================
           DESKTOP (lg+): APPLE iOS 26 LIQUID GLASS 3-ISLAND HEADER
           ================================================================ */
        <header className="pointer-events-none fixed top-3.5 right-0 left-0 z-40 px-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            {/* Island 1: Brand Liquid Glass Capsule */}
            <IosLiquidCapsule
              theme={theme}
              defsRef={defsRef}
              barClassName="h-[54px] px-4"
              bezel={18}
              scale={62}
              ab={5}
            >
              <a
                href="#beranda"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToSection('beranda');
                }}
                aria-label={STORE_INFO.name}
                className="group flex h-full items-center gap-2.5 focus:outline-none"
              >
                <BrandEmblem className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:rotate-6" />
                <span className="font-display whitespace-nowrap text-[20px] font-semibold tracking-tight text-[#141210] drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] dark:text-white dark:drop-shadow-[0_1px_6px_rgba(10,5,20,0.45)]">
                  {STORE_INFO.name}
                </span>
              </a>
            </IosLiquidCapsule>

            {/* Island 2: Center iOS 26 Liquid Glass Segmented Tab Bar */}
            <IosLiquidTabBar
              activeIndex={activeIndex}
              onSelect={navigateToSection}
              theme={theme}
              defsRef={defsRef}
              isDesktop={true}
              viewportWidth={viewportWidth}
              ariaLabel="Navigasi utama"
              testId="desktop-sliding-nav"
            />

            {/* Island 3: Theme Toggle + Pesan WA Liquid Glass Capsules */}
            <div className="pointer-events-auto flex items-center gap-2.5">
              <IosLiquidCapsule
                theme={theme}
                defsRef={defsRef}
                barClassName="h-[50px] w-[50px]"
                bezel={18}
                scale={68}
                ab={6}
                elasticity={0.38}
              >
                <button
                  type="button"
                  data-no-active-scale="true"
                  onClick={onToggleTheme}
                  data-testid="theme-toggle-button"
                  aria-label={theme === 'dark' ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
                  title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                  className="flex h-full w-full items-center justify-center rounded-full text-[#141210] cursor-pointer focus:outline-none dark:text-white"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-[19px] w-[19px] text-[#F5D6A8]" aria-hidden="true" />
                  ) : (
                    <Moon className="h-[19px] w-[19px] text-[#141210]" aria-hidden="true" />
                  )}
                </button>
              </IosLiquidCapsule>

              <IosLiquidCapsule
                theme={theme}
                defsRef={defsRef}
                barClassName="h-[50px] px-4"
                bezel={18}
                scale={64}
                ab={5}
                recalcKey={cartCount > 0 ? 'has' : 'empty'}
              >
                <button
                  type="button"
                  data-no-active-scale="true"
                  onClick={onOpenCart}
                  data-testid="nav-cart-button"
                  aria-label={`Buka keranjang pesanan (${cartCount} item)`}
                  className="flex h-full items-center justify-center gap-2 rounded-full text-[13px] font-semibold text-[#141210] whitespace-nowrap cursor-pointer focus:outline-none drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] dark:text-white dark:drop-shadow-[0_1px_6px_rgba(10,5,20,0.45)]"
                >
                  <ShoppingBag
                    className="h-4 w-4 shrink-0 text-[#8A5A28] dark:text-[#F5D6A8]"
                    aria-hidden="true"
                  />
                  <span>Pesan WA</span>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: SPRING_POP_EASE }}
                      data-testid="nav-cart-count"
                      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#141210] px-1.5 text-[11px] font-bold text-[#F7F3EC] tabular-nums dark:bg-[#D8B07A] dark:text-[#0A0908]"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>
              </IosLiquidCapsule>
            </div>
          </div>
        </header>
      ) : (
        /* ================================================================
           MOBILE & TABLET (< lg): TOP LIQUID PILLS + BOTTOM iOS 26 DOCK
           ================================================================ */
        <>
          <header className="pointer-events-none fixed top-2.5 right-0 left-0 z-40 px-3">
            <div className="mx-auto flex max-w-2xl flex-nowrap items-center justify-between gap-2">
              <IosLiquidCapsule
                theme={theme}
                defsRef={defsRef}
                className="min-w-0 max-w-[60vw]"
                barClassName="h-[44px] max-w-full px-3"
                bezel={16}
                scale={58}
                ab={5}
              >
                <a
                  href="#beranda"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToSection('beranda');
                  }}
                  aria-label={STORE_INFO.name}
                  className="flex h-full min-w-0 items-center gap-2 focus:outline-none"
                >
                  <BrandEmblem className="h-6 w-6 shrink-0" />
                  <span className="font-display truncate text-[15px] font-semibold tracking-tight text-[#141210] drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] sm:text-[18px] dark:text-white dark:drop-shadow-[0_1px_6px_rgba(10,5,20,0.45)]">
                    {STORE_INFO.name}
                  </span>
                </a>
              </IosLiquidCapsule>

              <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                <IosLiquidCapsule
                  theme={theme}
                  defsRef={defsRef}
                  barClassName="h-[44px] w-[44px]"
                  bezel={16}
                  scale={64}
                  ab={6}
                  elasticity={0.36}
                >
                  <button
                    type="button"
                    data-no-active-scale="true"
                    onClick={onToggleTheme}
                    data-testid="theme-toggle-button"
                    aria-label={theme === 'dark' ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
                    title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                    className="flex h-full w-full items-center justify-center rounded-full text-[#141210] cursor-pointer focus:outline-none dark:text-white"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-[17px] w-[17px] text-[#F5D6A8]" aria-hidden="true" />
                    ) : (
                      <Moon className="h-[17px] w-[17px] text-[#141210]" aria-hidden="true" />
                    )}
                  </button>
                </IosLiquidCapsule>

                <IosLiquidCapsule
                  theme={theme}
                  defsRef={defsRef}
                  barClassName="h-[44px] px-3 sm:px-3.5"
                  bezel={16}
                  scale={60}
                  ab={5}
                  recalcKey={cartCount > 0 ? 'has' : 'empty'}
                >
                  <button
                    type="button"
                    data-no-active-scale="true"
                    onClick={onOpenCart}
                    data-testid="nav-cart-button"
                    aria-label={`Buka keranjang pesanan (${cartCount} item)`}
                    className="flex h-full items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-[#141210] whitespace-nowrap cursor-pointer focus:outline-none drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] sm:text-[13px] dark:text-white dark:drop-shadow-[0_1px_6px_rgba(10,5,20,0.45)]"
                  >
                    <ShoppingBag
                      className="h-3.5 w-3.5 shrink-0 text-[#8A5A28] sm:h-4 sm:w-4 dark:text-[#F5D6A8]"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Pesan WA</span>
                    <span className="sm:hidden">WA</span>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: SPRING_POP_EASE }}
                        data-testid="nav-cart-count"
                        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#141210] px-1 text-[10px] font-bold text-[#F7F3EC] tabular-nums dark:bg-[#D8B07A] dark:text-[#0A0908]"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </button>
                </IosLiquidCapsule>
              </div>
            </div>
          </header>

          {/* Iconic Floating iOS 26 Liquid Glass Bottom Dock */}
          <div
            className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2"
            style={{ bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))' }}
          >
            <IosLiquidTabBar
              activeIndex={activeIndex}
              onSelect={navigateToSection}
              theme={theme}
              defsRef={defsRef}
              isDesktop={false}
              viewportWidth={viewportWidth}
              ariaLabel="Navigasi utama"
              testId="ios-bottom-tab-bar"
            />
          </div>
        </>
      )}
    </>
  );
}
