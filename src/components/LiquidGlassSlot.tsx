import { type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LiquidGlass } from './ui/LiquidGlass';
import type { RefractionMode } from '../lib/liquidGlassEngine';

export interface LiquidGlassSlotProps {
  children: ReactNode;
  width?: number;
  height?: number;
  overLight?: boolean;
  displacementScale?: number;
  blurAmount?: number;
  preBlur?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  padding?: string;
  mode?: RefractionMode;
  interactive?: boolean;
  allowOverflow?: boolean;
  chromaticRim?: boolean;
  className?: string;
  glassClassName?: string;
  onClick?: () => void;
}

/**
 * Wraps the custom iOS 26 optical LiquidGlass component with interruptible
 * Motion UI spring jelly-press feedback and strict reduced-motion support.
 */
export function LiquidGlassSlot({
  children,
  width,
  height,
  overLight = false,
  displacementScale = 82,
  blurAmount = 0.08,
  preBlur = 11,
  saturation = 152,
  aberrationIntensity = 2.4,
  elasticity = 0.16,
  cornerRadius = 999,
  padding = '0px',
  mode = 'standard',
  interactive = true,
  allowOverflow = false,
  chromaticRim = false,
  className = '',
  glassClassName = '',
  onClick,
}: LiquidGlassSlotProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative inline-flex shrink-0 select-none ${className}`}
      style={{
        width: width !== undefined ? `${width}px` : undefined,
        height: height !== undefined ? `${height}px` : undefined,
      }}
      whileHover={interactive && !reducedMotion ? { scale: 1.03 } : undefined}
      whileTap={interactive && !reducedMotion ? { scaleX: 1.06, scaleY: 0.92 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 430,
        damping: 17,
        mass: 0.72,
      }}
    >
      <LiquidGlass
        displacementScale={displacementScale}
        blurAmount={blurAmount}
        preBlur={preBlur}
        saturation={saturation}
        aberrationIntensity={aberrationIntensity}
        elasticity={reducedMotion ? 0 : elasticity}
        cornerRadius={cornerRadius}
        padding={padding}
        overLight={overLight}
        mode={mode}
        allowOverflow={allowOverflow}
        chromaticRim={chromaticRim}
        onClick={onClick}
        className={`h-full w-full ${glassClassName}`}
        contentClassName="flex h-full w-full items-center justify-center font-sans leading-normal text-[#141210] dark:text-[#F7F3EC]"
      >
        {children}
      </LiquidGlass>
    </motion.div>
  );
}
