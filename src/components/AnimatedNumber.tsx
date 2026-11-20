import { useEffect, useRef, useState } from 'react';
import { interpolateNumber } from '../utils/motionCraft';

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  format?: (val: number) => string;
  countUpOnView?: boolean;
  className?: string;
}

export function AnimatedNumber({
  value,
  durationMs = 850,
  format = (v) => String(Math.round(v)),
  countUpOnView = false,
  className = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(countUpOnView ? 0 : value);
  const currentRef = useRef<number>(countUpOnView ? 0 : value);
  const hasTriggeredRef = useRef<boolean>(!countUpOnView);
  const elRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      currentRef.current = value;
      setDisplay(value);
      return;
    }

    const animateTo = (target: number) => {
      const startValue = currentRef.current;
      if (startValue === target) return;
      const startTime = performance.now();
      let rafId = 0;

      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const next = interpolateNumber(startValue, target, progress);
        currentRef.current = next;
        setDisplay(next);
        if (progress < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          currentRef.current = target;
          setDisplay(target);
        }
      };

      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    };

    if (!countUpOnView || hasTriggeredRef.current) {
      return animateTo(value);
    }

    const node = elRef.current;
    if (!node) {
      hasTriggeredRef.current = true;
      return animateTo(value);
    }

    let cancelAnim: (() => void) | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          cancelAnim = animateTo(value);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnim?.();
    };
  }, [value, durationMs, countUpOnView]);

  return (
    <span ref={elRef} className={`tabular-nums ${className}`}>
      {format(display)}
    </span>
  );
}
