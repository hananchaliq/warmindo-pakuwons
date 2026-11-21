---
name: liquid-glass-ios
description: Implement Apple iOS 26 Liquid Glass UI effects in React using rdev/liquid-glass-react (v1.1.1) with accurate optical refraction, chromatic aberration, elastic hover tracking, tactile jelly-squish press animations, and smooth draggable glass physics.
version: 1.0.0
library: liquid-glass-react@1.1.1
repository: https://github.com/rdev/liquid-glass-react
---

# Apple iOS 26 Liquid Glass Skill (`liquid-glass-react`)

Use this skill whenever the user asks to build Apple iOS 26 / macOS Tahoe **Liquid Glass** UI components (buttons, pills, cards, floating navbars, docks, sliders, or draggable glass lenses) in React.

This skill is strictly based on **`rdev/liquid-glass-react` (v1.1.1)** — the most starred open-source Liquid Glass React library (~6.7k+ GitHub stars, MIT license). Follow every rule below precisely to avoid layout bugs, import errors, or broken transforms.

---

## 1. Installation & Environment Setup

### Standard Installation (React 19+)
`liquid-glass-react@1.1.1` declares `peerDependencies` for `react >= 19` and `react-dom >= 19`.

```bash
npm install liquid-glass-react
# or
pnpm add liquid-glass-react
# or
yarn add liquid-glass-react
```

### React 18 Compatibility
If the project uses **React 18**, do NOT let `npm install` fail with `ERESOLVE`:
- **Option A (Keep official repo):** Install with legacy peer deps:
  ```bash
  npm install liquid-glass-react --legacy-peer-deps
  ```
- **Option B (Community fork for React 18+):** Use `@nkzw/liquid-glass` (official fork with React 18 peer support and identical rendering model).

### Optional: Spring Physics for Enhanced Jelly Press & Drag
If the user requests bouncy jelly squish on press or momentum dragging, install `motion` (Framer Motion):
```bash
npm install motion
```

---

## 2. Exact Import & Core API Reference

### CRITICAL Import Rule
`liquid-glass-react` uses a **DEFAULT export**. NEVER use a named import.

```tsx
// ✅ CORRECT
import LiquidGlass from 'liquid-glass-react'

// ❌ WRONG — Will cause runtime/TypeScript error
import { LiquidGlass } from 'liquid-glass-react'
```

### Complete Props Reference (`liquid-glass-react@1.1.1`)

| Prop | Type | Default | Behavior & Tuning Guide |
| :--- | :--- | :--- | :--- |
| `children` | `React.ReactNode` | *(required)* | Content rendered inside the glass surface. |
| `displacementScale` | `number` | `70` | Strength of SVG `feDisplacementMap` edge bending/refraction. Typical range: `40`–`100`. |
| `blurAmount` | `number` | `0.0625` | Frostiness level. Internally computes `blur(${(overLight ? 12 : 4) + blurAmount * 32}px)`. Keep low (`0.05`–`0.12`) for crisp Apple liquid clarity; raise (`0.2`–`0.4`) for heavy frost. |
| `saturation` | `number` | `140` | Backdrop color vibrancy percentage (`saturate(${saturation}%)`). `130`–`180` makes colors pop through the glass like iOS 26. |
| `aberrationIntensity` | `number` | `2` | RGB chromatic aberration edge color-splitting via 3-pass `feColorMatrix` + `feDisplacementMap`. `0` disables RGB split; `2`–`4` gives authentic optical prism edges. |
| `elasticity` | `number` | `0.15` | Controls liquid stretch & pull toward the cursor (`0` = rigid, `0.15` = subtle card, `0.3`–`0.45` = playful jelly/liquid button). |
| `cornerRadius` | `number` | `999` | Border radius in **pixels**. Defaults to `999` (full pill). Set explicitly (e.g., `24` or `32`) for cards/panels! |
| `padding` | `string` | `"24px 32px"` | CSS padding string inside the glass container (e.g., `"8px 16px"` for compact buttons). |
| `overLight` | `boolean` | `false` | Set `true` when placed over bright/white backgrounds. Raises minimum blur floor (`12px` vs `4px`) and adapts border/shadow contrast so glass stays legible. |
| `mode` | `"standard" \| "polar" \| "prominent" \| "shader"` | `"standard"` | Refraction displacement map profile (see Section 4). |
| `mouseContainer` | `React.RefObject<HTMLElement \| null> \| null` | `null` | Parent container ref used to expand the cursor-tracking activation zone beyond the glass element itself. |
| `globalMousePos` | `{ x: number; y: number }` | `undefined` | Manual global pointer coordinates (`clientX`, `clientY`) for controlled hover/drag interactions. |
| `mouseOffset` | `{ x: number; y: number }` | `undefined` | Offset `{ x, y }` applied to pointer tracking for fine-tuning elastic center alignment. |
| `onClick` | `() => void` | `undefined` | Click handler. Passing `onClick` activates interactive cursor styling and built-in press feedback. |
| `className` | `string` | `""` | Additional CSS classes applied to the glass element. |
| `style` | `React.CSSProperties` | `undefined` | Inline styles (commonly used for `position`, `top`, `left`, `zIndex`). |

---

## 3. CRITICAL Layout Rule (Avoid the `translate(-50%, -50%)` Bug)

> **Known Library Behavior (GitHub Issue #20):** Internally, `liquid-glass-react` applies `transform: translate(-50%, -50%)` to center itself around its anchor coordinate.

### What Goes Wrong If Ignored
If you drop `<LiquidGlass>` directly inside a normal Flexbox or Grid container without an anchor wrapper, the component will visually shift **up and left by 50% of its own width and height**, overlapping sibling elements.

### Rule 1: Floating / Fixed Elements
When placing `<LiquidGlass>` as a fixed or absolute element, set `top` and `left` to the **center point** where you want it to appear:

```tsx
<LiquidGlass
  style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
  }}
>
  <span className="text-white font-medium">Centered Glass</span>
</LiquidGlass>
```

### Rule 2: Normal Flow (Flex / Grid / Inline Layouts)
Always wrap `<LiquidGlass>` inside a `relative` sizing container and pin the glass to `top: '50%', left: '50%'` so its internal `translate(-50%, -50%)` lands dead-center inside the reserved box:

```tsx
interface GlassSlotProps {
  width: number | string
  height: number | string
  children: React.ReactNode
}

function GlassSlot({ width, height, children }: GlassSlotProps) {
  return (
    <div
      className="relative inline-block shrink-0"
      style={{ width, height }}
    >
      {children}
    </div>
  )
}

// Usage inside any flex/grid layout:
<GlassSlot width={160} height={48}>
  <LiquidGlass
    cornerRadius={999}
    padding="12px 24px"
    elasticity={0.35}
    style={{ position: 'absolute', top: '50%', left: '50%' }}
    onClick={() => console.log('Clicked!')}
  >
    <span className="whitespace-nowrap text-white font-medium">Get Started</span>
  </LiquidGlass>
</GlassSlot>
```

### Rule 3: NEVER Override `style.transform` Directly on `<LiquidGlass>`
Because `liquid-glass-react` dynamically writes `transform` on every mouse move (for `translate(-50%, -50%)` + elastic stretch + directional scaling), setting `transform` via `style` or Tailwind `scale-*` / `translate-*` directly on `<LiquidGlass>` will **break elasticity and centering**. Always apply external animations (jelly squish, entrance animations, drag offsets) to an **outer wrapper** or **inner child wrapper**.

---

## 4. Refraction Modes (`mode`)

Choose the right `mode` based on the UI role:

1. **`"standard"` (Default):** Smooth edge refraction with balanced performance. Best for general buttons, pills, toolbars, and cards.
2. **`"polar"`:** Radial/polar distortion curve. Great for circular icon buttons, floating action buttons (FABs), and round volume/media controls.
3. **`"prominent"`:** Stronger, thicker optical edge bending. Ideal for hero badges, floating docks, and showcase cards over colorful photography.
4. **`"shader"`:** Mathematically most accurate liquid refraction map, but heaviest and noted by the author as *"the most accurate but not the most stable"*. Use only for hero demos or single focal elements — never for lists of 10+ items.

---

## 5. Interaction Patterns (Hover, Jelly Press, & Dragging)

### A. Rich Hover & Wide-Area Elastic Pull (`mouseContainer`)
To make the glass feel "alive" even as the cursor approaches it (not only when directly on top), bind a parent ref to `mouseContainer` and tune `elasticity` between `0.25` and `0.4`:

```tsx
import { useRef } from 'react'
import LiquidGlass from 'liquid-glass-react'

export function HoverElasticCard() {
  const stageRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={stageRef}
      className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl bg-cover bg-center"
      style={{ backgroundImage: 'url(/wallpaper.jpg)' }}
    >
      <LiquidGlass
        mouseContainer={stageRef}
        displacementScale={72}
        blurAmount={0.08}
        saturation={150}
        aberrationIntensity={2.5}
        elasticity={0.32}
        cornerRadius={28}
        padding="24px 32px"
        mode="standard"
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      >
        <div className="min-w-[260px] text-white select-none">
          <h3 className="text-lg font-semibold tracking-tight">Liquid Glass</h3>
          <p className="mt-1 text-sm text-white/80">
            Move your cursor around the container to see elastic refraction.
          </p>
        </div>
      </LiquidGlass>
    </div>
  )
}
```

### B. Tactile "Jelly Squish" on Press (Spring Wobble Effect)
Native `liquid-glass-react` handles hover/click subtly, but to achieve the iconic **iOS 26 bouncy jelly wobble** when pressed (`pointerdown` squishes wide & flat, `pointerup` rebounds with elastic overshoot), animate a **dedicated wrapper** with spring physics so you never clash with `<LiquidGlass>`'s internal `transform`.

#### Option 1: Pure CSS Spring Jelly (Zero Extra Dependencies)
Add this keyframe to `globals.css`:

```css
@keyframes liquid-jelly-release {
  0%   { transform: scale(1.07, 0.90); }
  30%  { transform: scale(0.95, 1.06); }
  55%  { transform: scale(1.03, 0.97); }
  75%  { transform: scale(0.99, 1.015); }
  100% { transform: scale(1, 1); }
}

.liquid-jelly-wrapper {
  display: inline-block;
  position: relative;
  transform-origin: center center;
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.liquid-jelly-wrapper:hover {
  transform: scale(1.035);
}

.liquid-jelly-wrapper[data-pressed="true"] {
  transform: scale(1.07, 0.90);
  transition: transform 110ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.liquid-jelly-wrapper[data-bouncing="true"] {
  animation: liquid-jelly-release 520ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

Component usage:

```tsx
import { useState } from 'react'
import LiquidGlass from 'liquid-glass-react'

interface JellyGlassButtonProps {
  children: React.ReactNode
  onClick?: () => void
  overLight?: boolean
}

export function JellyGlassButton({
  children,
  onClick,
  overLight = false,
}: JellyGlassButtonProps) {
  const [pressed, setPressed] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  const handlePointerDown = () => {
    setBouncing(false)
    setPressed(true)
  }

  const handlePointerUp = () => {
    if (!pressed) return
    setPressed(false)
    setBouncing(true)
  }

  const handlePointerLeave = () => {
    if (pressed) {
      setPressed(false)
      setBouncing(true)
    }
  }

  return (
    <div
      className="liquid-jelly-wrapper select-none cursor-pointer"
      style={{ width: 170, height: 52 }}
      data-pressed={pressed}
      data-bouncing={bouncing}
      onAnimationEnd={() => setBouncing(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <LiquidGlass
        displacementScale={64}
        blurAmount={0.08}
        saturation={145}
        aberrationIntensity={2.5}
        elasticity={0.38}
        cornerRadius={999}
        padding="12px 28px"
        overLight={overLight}
        onClick={onClick}
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      >
        <span className="whitespace-nowrap font-medium text-white drop-shadow-sm">
          {children}
        </span>
      </LiquidGlass>
    </div>
  )
}
```

#### Option 2: `motion/react` Spring Jelly (Smoothest Interruptible Wobble)
If `motion` is installed, prefer real spring physics because rapid consecutive taps stay fluid and interruptible:

```tsx
import { motion } from 'motion/react'
import LiquidGlass from 'liquid-glass-react'

export function SpringJellyGlassButton({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) {
  return (
    <motion.div
      className="relative inline-block cursor-pointer select-none"
      style={{ width: 170, height: 52 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scaleX: 1.08, scaleY: 0.89 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 14,
        mass: 0.75,
      }}
    >
      <LiquidGlass
        displacementScale={64}
        blurAmount={0.08}
        saturation={145}
        aberrationIntensity={2}
        elasticity={0.35}
        cornerRadius={999}
        padding="12px 28px"
        onClick={onClick}
        style={{ position: 'absolute', top: '50%', left: '50%' }}
      >
        <span className="whitespace-nowrap font-medium text-white">
          {label}
        </span>
      </LiquidGlass>
    </motion.div>
  )
}
```

---

### C. Draggable ("Geser-geser") Liquid Glass with Live Velocity Jelly Stretch
Because `liquid-glass-react` centers itself via `translate(-50%, -50%)`, setting `style={{ position: 'fixed', left: pos.x, top: pos.y }}` makes the glass center follow the pointer directly! Combine this with `globalMousePos` and velocity-based jelly deformation for an authentic Apple iOS 26 draggable glass lens/pill:

```tsx
import { useRef, useState } from 'react'
import LiquidGlass from 'liquid-glass-react'

export function DraggableLiquidGlass() {
  const [pos, setPos] = useState({ x: 320, y: 260 })
  const [mousePos, setMousePos] = useState({ x: 320, y: 260 })
  const [dragging, setDragging] = useState(false)
  const [stretch, setStretch] = useState({ sx: 1, sy: 1 })

  const dragOffset = useRef({ x: 0, y: 0 })
  const lastPointer = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
    lastPointer.current = { x: e.clientX, y: e.clientY }
    // Subtle initial jelly squish on grab
    setStretch({ sx: 1.06, sy: 0.94 })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY })
    if (!dragging) return

    const dx = e.clientX - lastPointer.current.x
    const dy = e.clientY - lastPointer.current.y
    lastPointer.current = { x: e.clientX, y: e.clientY }

    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })

    // Velocity-based liquid jelly stretch (clamped so it never distorts text)
    const speedX = Math.min(Math.abs(dx) * 0.008, 0.14)
    const speedY = Math.min(Math.abs(dy) * 0.008, 0.14)
    setStretch({
      sx: 1 + speedX - speedY * 0.5,
      sy: 1 + speedY - speedX * 0.5,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    // Snap back with springy CSS cubic-bezier
    setStretch({ sx: 1, sy: 1 })
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 50,
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
        transform: `scale(${stretch.sx}, ${stretch.sy})`,
        transition: dragging
          ? 'transform 70ms ease-out'
          : 'transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <LiquidGlass
        globalMousePos={mousePos}
        displacementScale={dragging ? 85 : 68}
        blurAmount={0.07}
        saturation={150}
        aberrationIntensity={dragging ? 3 : 2}
        elasticity={0.35}
        cornerRadius={999}
        padding="14px 28px"
        mode="prominent"
      >
        <div className="pointer-events-none select-none whitespace-nowrap font-medium text-white">
          Drag Me Around
        </div>
      </LiquidGlass>
    </div>
  )
}
```

---

## 6. Recommended Visual Presets (Copy-Paste Ready)

| Preset | `displacementScale` | `blurAmount` | `saturation` | `aberrationIntensity` | `elasticity` | `cornerRadius` | `mode` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **iOS 26 Pill Button** | `64` | `0.08` | `140` | `2` | `0.35` | `999` | `"standard"` |
| **Circular Icon / FAB** | `75` | `0.06` | `150` | `2.5` | `0.40` | `999` | `"polar"` |
| **Floating Dock / Navbar** | `70` | `0.10` | `145` | `2` | `0.12` | `32` | `"standard"` |
| **Hero Glass Card** | `80` | `0.08` | `155` | `3` | `0.18` | `28` | `"prominent"` |
| **Light-Mode Surface** (`overLight={true}`) | `60` | `0.12` | `130` | `1.5` | `0.20` | `24` | `"standard"` |

---

## 7. Background, Browser Support & Performance Rules

### 1. Backdrop Content Matters
Liquid Glass refraction is **invisible over a solid flat color** (`#000` or `#fff`). Always place `<LiquidGlass>` over rich visual backgrounds: high-contrast photography, mesh gradients, colorful UI cards, or scrolling content so the edge refraction and RGB chromatic aberration shine.

### 2. Browser Compatibility Reality
- **Chromium (Chrome, Edge, Brave, Arc):** Full SVG `feDisplacementMap` backdrop refraction + 3-pass chromatic aberration + frosted blur.
- **Safari & Firefox:** Partially supported — SVG backdrop displacement is not rendered; the component automatically falls back to frosted `backdrop-filter: blur()`.
- **Rule:** Ensure text contrast (`text-white` over dark backdrops or `overLight={true}` with dark text over bright backdrops) remains crisp even in flat-blur fallback mode.

### 3. Performance & Accessibility Guardrails
- **Limit simultaneous instances:** Each `<LiquidGlass>` runs multi-pass SVG filters (`feDisplacementMap` + `feColorMatrix`). Keep active visible instances to **1–6 per viewport** (e.g., navbar, 1–2 primary CTAs, floating dock). Avoid rendering 50 glass items in a scrolling feed.
- **Respect `prefers-reduced-motion`:** When reduced motion is preferred, set `elasticity={0}` and disable jelly CSS/spring animations.
- **Never clip the elastic travel:** Avoid `overflow: hidden` on tight immediate parents of `<LiquidGlass>`, or the elastic pull & jelly overshoot will get clipped at the edges.

---

## 8. Verification Checklist for Agents

Before finalizing any implementation using this skill, verify:
- [ ] Imported via default export: `import LiquidGlass from 'liquid-glass-react'`
- [ ] Every prop name & type matches Section 2 (no hallucinated props)
- [ ] Layout accounts for internal `translate(-50%, -50%)` (anchored via `position: absolute/fixed` at `top: '50%', left: '50%'` inside a sized `relative` wrapper, or positioned directly by center coordinates)
- [ ] External jelly press / drag transforms are applied to a **wrapper**, never overwriting `<LiquidGlass style={{ transform }} />`
- [ ] `overLight={true}` is set if the background behind the glass is light/white
- [ ] `cornerRadius` is explicitly set when rendering rectangular cards (since default is `999`)
- [ ] Draggable elements include `touchAction: 'none'` and pointer capture (`setPointerCapture`) so mobile/trackpad dragging never drops mid-gesture