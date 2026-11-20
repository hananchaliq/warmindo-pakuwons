import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

export const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
      className="fixed top-0 right-0 left-0 z-50 h-[2px] origin-left bg-gradient-to-r from-[#C59143] via-[#E6BC7B] to-[#F3D8A4]"
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
  yOffset = 20,
}: RevealBlockProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0.9, y: Math.min(yOffset, 14) }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={{ duration: 0.45, delay, ease: LUXURY_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GoldLeafOrnament({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 108C36 82 64 56 106 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M36 84C28 66 36 46 56 40C54 60 48 76 36 84Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M58 62C74 58 92 64 98 80C80 82 66 74 58 62Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M66 54C60 36 68 20 86 14C86 32 78 46 66 54Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export function BrandEmblem({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 19H30C30 25.2 24.8 30 18 30C11.2 30 6 25.2 6 19Z"
        stroke="#E6BC7B"
        strokeWidth="1.6"
        fill="#E6BC7B"
        fillOpacity="0.14"
      />
      <path
        d="M12 31.5H24"
        stroke="#E6BC7B"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M13 14.5C13 12 15 11 15 8.5M18 14C18 11 20 9.5 20 6.5M23 14.5C23 12 25 11 25 8.5"
        stroke="#E6BC7B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
