import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface PillNavItem<T extends string = string> {
  id: T;
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface SlidingPillNavProps<T extends string> {
  items: PillNavItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  ariaLabel: string;
  variant?: 'header' | 'surface' | 'obsidian' | 'compact-dark' | 'compact-surface';
  className?: string;
  testId?: string;
  fullWidth?: boolean;
}

export function SlidingPillNav<T extends string>({
  items,
  activeId,
  onSelect,
  ariaLabel,
  variant = 'surface',
  className = '',
  testId,
  fullWidth = false,
}: SlidingPillNavProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeEl = itemRefs.current[activeId];
    if (!container || !activeEl) return;

    const left = activeEl.offsetLeft;
    const width = activeEl.offsetWidth;
    setIndicator({ left, width, ready: width > 0 });
  }, [activeId]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, items]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateIndicator());
      ro.observe(container);
    }
    window.addEventListener('resize', updateIndicator);
    const fontReady = document.fonts?.ready;
    fontReady?.then(() => updateIndicator()).catch(() => {});

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [updateIndicator]);

  const containerStyle =
    variant === 'header'
      ? 'border border-[#141210]/10 bg-[#ECE6DC]/85 p-1 dark:border-[#D8B07A]/16 dark:bg-[#191613]'
      : variant === 'obsidian'
        ? 'border border-[#D8B07A]/18 bg-[#151210] p-1'
        : variant === 'compact-dark'
          ? 'border border-[#D8B07A]/16 bg-[#13100E] p-1'
          : variant === 'compact-surface'
            ? 'border border-[#141210]/10 bg-[#F2ECE2] p-1 dark:border-[#D8B07A]/16 dark:bg-[#161310]'
            : 'border border-[#141210]/10 bg-[#ECE6DC]/90 p-1 dark:border-[#D8B07A]/16 dark:bg-[#161310]';

  const pillStyle =
    variant === 'header'
      ? 'bg-[#141210] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.3)] dark:bg-[#D8B07A]'
      : variant === 'obsidian' || variant === 'compact-dark'
        ? 'bg-[#D8B07A] shadow-[0_6px_18px_-6px_rgba(216,176,122,0.45)]'
        : 'bg-[#141210] shadow-[0_6px_18px_-6px_rgba(20,18,16,0.28)] dark:bg-[#D8B07A]';

  const getItemTextStyle = (isActive: boolean) => {
    if (variant === 'header') {
      return isActive
        ? 'text-[#F6F3EE] dark:text-[#0A0908]'
        : 'text-[#4F473E] hover:text-[#141210] dark:text-[#CFC6B8] dark:hover:text-[#F7F3EC]';
    }
    if (variant === 'obsidian' || variant === 'compact-dark') {
      return isActive
        ? 'text-[#0A0908]'
        : 'text-[#CFC6B8] hover:text-[#F7F3EC]';
    }
    return isActive
      ? 'text-[#F6F3EE] dark:text-[#0A0908]'
      : 'text-[#5A5147] hover:text-[#141210] dark:text-[#C5BBA9] dark:hover:text-[#F7F3EC]';
  };

  const itemSizeStyle =
    variant === 'compact-dark' || variant === 'compact-surface'
      ? 'min-h-[34px] px-1.5 py-1.5 text-[11px] sm:px-3 sm:text-xs'
      : variant === 'header'
        ? 'min-h-[36px] px-3.5 py-1.5 text-[13px] xl:px-4'
        : 'min-h-[38px] px-3.5 py-1.5 text-xs sm:min-h-[40px] sm:px-4 sm:py-2 sm:text-sm';

  return (
    <div
      ref={containerRef}
      role={variant === 'header' ? 'navigation' : 'tablist'}
      aria-label={ariaLabel}
      data-testid={testId}
      className={`relative ${fullWidth ? 'flex w-full' : 'inline-flex'} items-center gap-1 rounded-full ${containerStyle} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`nav-pill-indicator pointer-events-none absolute top-1 bottom-1 rounded-full ${pillStyle}`}
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />

      {items.map((item) => {
        const isActive = item.id === activeId;
        const sharedClass = `relative z-10 inline-flex ${fullWidth ? 'flex-1 justify-center' : ''} items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer ${itemSizeStyle} ${getItemTextStyle(isActive)}`;

        if (item.href) {
          return (
            <a
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                onSelect(item.id);
              }}
              className={sharedClass}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          );
        }

        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[item.id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(item.id)}
            className={sharedClass}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
