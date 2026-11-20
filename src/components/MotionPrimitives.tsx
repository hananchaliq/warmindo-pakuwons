import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

export const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const SPRING_POP_EASE: [number, number, number, number] = [0.3, 1.5, 0.5, 1];
export const FLUID_EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

export function ScrollProgressLine() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2px] origin-left bg-gradient-to-r from-[#9A6B38] via-[#D8B07A] to-[#F3DAB2]"
    />
  );
}

interface RevealBlockProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}

export function RevealBlock({
  children,
  className = '',
  delay = 0,
  yOffset = 18,
}: RevealBlockProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.92, y: Math.min(yOffset, 14) }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.5, delay, ease: LUXURY_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MaskedLineProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function MaskedLine({ children, delay = 0, className = '' }: MaskedLineProps) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <span className={`block ${className}`}>{children}</span>;
  }

  return (
    <span className="block overflow-hidden pb-1">
      <motion.span
        initial={{ y: '100%', opacity: 0.2 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 0.72, delay, ease: LUXURY_EASE }}
        className={`block ${className}`}
      >
        {children}
      </motion.span>
    </span>
  );
}

interface MagneticWrapProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticWrap({
  children,
  className = 'inline-block',
  strength = 6,
}: MagneticWrapProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 320, damping: 22, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 320, damping: 22, mass: 0.4 });

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    rawX.set(dx * strength);
    rawY.set(dy * strength);
  };

  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxFrameProps {
  children: ReactNode;
  className?: string;
  distance?: number;
}

export function ParallaxFrame({
  children,
  className = '',
  distance = 22,
}: ParallaxFrameProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={className}>
      <motion.div style={{ y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

export function BrandEmblem({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className={className}>
      <circle
        cx="18"
        cy="18"
        r="16"
        stroke="#D8B07A"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      <path
        d="M8.5 19.5H27.5C27.5 24.4 23.4 28.2 18 28.2C12.6 28.2 8.5 24.4 8.5 19.5Z"
        stroke="#D8B07A"
        strokeWidth="1.5"
        fill="#D8B07A"
        fillOpacity="0.16"
      />
      <path
        d="M13 29.8H23"
        stroke="#D8B07A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 15.2C14 13.1 15.6 12.2 15.6 10.2M18 14.8C18 12.3 19.6 11.1 19.6 8.8M22 15.2C22 13.1 23.6 12.2 23.6 10.2"
        stroke="#E8C696"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
