export type ThemeMode = 'light' | 'dark';

export function easeOutCubic(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  return 1 - Math.pow(1 - p, 3);
}

export function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * easeOutCubic(progress);
}

export function computeCircularRevealRadius(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  return Math.hypot(
    Math.max(x, viewportWidth - x),
    Math.max(y, viewportHeight - y),
  );
}

interface ViewTransitionLike {
  ready: Promise<void>;
}

type DocumentWithTransition = Document & {
  startViewTransition?: (cb: () => void) => ViewTransitionLike;
};

export function toggleThemeWithReveal(
  event: { clientX?: number; clientY?: number } | null,
  applyTheme: () => void,
): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    applyTheme();
    return;
  }

  const doc = document as DocumentWithTransition;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!doc.startViewTransition || reducedMotion) {
    applyTheme();
    return;
  }

  const x =
    typeof event?.clientX === 'number' && event.clientX > 0
      ? event.clientX
      : window.innerWidth - 48;
  const y =
    typeof event?.clientY === 'number' && event.clientY > 0
      ? event.clientY
      : 32;
  const radius = computeCircularRevealRadius(x, y, window.innerWidth, window.innerHeight);

  try {
    const transition = doc.startViewTransition(() => {
      applyTheme();
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 750,
            easing: 'cubic-bezier(0.6, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        // Ignore transition abort on rapid consecutive toggles
      });
  } catch {
    applyTheme();
  }
}

export function attachGlobalSpotlightTracker(): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastTiltedCard: HTMLElement | null = null;

  const resetCardTilt = (card: HTMLElement | null) => {
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  const handlePointerMove = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    const card = target?.closest?.('.spotlight-card, .tilt-spotlight-card') as HTMLElement | null;

    if (lastTiltedCard && lastTiltedCard !== card) {
      resetCardTilt(lastTiltedCard);
      lastTiltedCard = null;
    }

    if (!card) return;

    const rect = card.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    card.style.setProperty('--mx', `${relX}px`);
    card.style.setProperty('--my', `${relY}px`);

    if (
      !reducedMotion &&
      e.pointerType === 'mouse' &&
      card.classList.contains('tilt-spotlight-card') &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      const nx = (relX / rect.width - 0.5) * 2; // -1..1
      const ny = (relY / rect.height - 0.5) * 2; // -1..1
      const maxTilt = 3.2;
      const rx = (-ny * maxTilt).toFixed(2);
      const ry = (nx * maxTilt).toFixed(2);
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
      lastTiltedCard = card;
    }
  };

  const handlePointerLeave = () => {
    if (lastTiltedCard) {
      resetCardTilt(lastTiltedCard);
      lastTiltedCard = null;
    }
  };

  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  return () => {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerleave', handlePointerLeave);
  };
}

export type SectionId = 'beranda' | 'studio-3d' | 'menu' | 'cerita' | 'lokasi';

export function computeActiveSectionId(
  scrollY: number,
  viewportHeight: number,
  docHeight: number,
  sections: { id: SectionId; top: number }[],
): SectionId {
  if (sections.length === 0) return 'beranda';
  if (scrollY <= 40) return 'beranda';
  if (scrollY + viewportHeight >= docHeight - 40) {
    return sections[sections.length - 1].id;
  }

  const probeY = scrollY + Math.min(220, viewportHeight * 0.28);
  let active: SectionId = sections[0].id;
  for (const sec of sections) {
    if (sec.top <= probeY) {
      active = sec.id;
    } else {
      break;
    }
  }
  return active;
}
