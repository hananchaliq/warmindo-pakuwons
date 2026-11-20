import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react';
import { STORE_INFO } from '../data/menu';
import { BrandEmblem, SPRING_POP_EASE } from './MotionPrimitives';
import { SlidingPillNav, type PillNavItem } from './SlidingPillNav';
import { computeActiveSectionId, type SectionId, type ThemeMode } from '../utils/motionCraft';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  theme: ThemeMode;
  onToggleTheme: (event: MouseEvent<HTMLButtonElement>) => void;
}

const NAV_LINKS: PillNavItem<SectionId>[] = [
  { id: 'beranda', label: 'Beranda', href: '#beranda' },
  { id: 'studio-3d', label: 'Studio 3D', href: '#studio-3d' },
  { id: 'menu', label: 'Katalog', href: '#menu' },
  { id: 'cerita', label: 'Kisah', href: '#cerita' },
  { id: 'lokasi', label: 'Lokasi', href: '#lokasi' },
];

export function Navbar({ cartCount, onOpenCart, theme, onToggleTheme }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>('beranda');

  const topBarRef = useRef<HTMLDivElement | null>(null);
  const manualNavLockUntilRef = useRef<number>(0);

  useEffect(() => {
    let rafId = 0;

    const syncScrollState = () => {
      rafId = 0;
      const scrollY = window.scrollY;
      setScrolled(scrollY > 36);

      if (performance.now() < manualNavLockUntilRef.current) {
        return;
      }

      const sectionMetrics: { id: SectionId; top: number }[] = [];
      for (const link of NAV_LINKS) {
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
    setMobileMenuOpen(false);
    manualNavLockUntilRef.current = performance.now() + 800;

    if (id === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.getElementById(id);
    if (!target) return;

    const barHeight = topBarRef.current?.offsetHeight ?? 68;
    const extraOffset = window.innerWidth >= 1024 ? 24 : 10;
    const top = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - barHeight - extraOffset,
    );
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 z-40 px-0 pt-0 lg:px-6 lg:pt-3.5">
      {/* Detached Floating Capsule on Desktop, Crisp Full-Width Bar on Mobile (zero backdrop-filter over WebGL) */}
      <div
        ref={topBarRef}
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 transition-all duration-300 sm:px-6 lg:h-[62px] lg:rounded-full lg:border lg:px-5 ${
          scrolled
            ? 'border-b border-[#141210]/10 bg-[#FAF8F4]/96 shadow-[0_14px_38px_-14px_rgba(0,0,0,0.16)] lg:border-[#141210]/12 dark:border-[#D8B07A]/22 dark:bg-[#110F0D]/96 dark:shadow-[0_18px_46px_-14px_rgba(0,0,0,0.78)]'
            : 'border-b border-[#141210]/8 bg-[#FAF8F4]/94 lg:border-[#141210]/10 dark:border-[#D8B07A]/16 dark:bg-[#100E0C]/92'
        }`}
      >
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            navigateToSection('beranda');
          }}
          className="group flex min-w-0 flex-1 items-center gap-2 focus:outline-none sm:flex-initial sm:gap-2.5"
          aria-label={STORE_INFO.name}
        >
          <BrandEmblem className="h-7 w-7 shrink-0 transition-transform duration-300 group-hover:rotate-6 sm:h-8 sm:w-8" />
          <div className="min-w-0 leading-none">
            <span className="font-display block truncate text-[15px] font-semibold tracking-tight text-[#141210] sm:text-[21px] dark:text-[#F7F3EC]">
              {STORE_INFO.name}
            </span>
          </div>
        </a>

        {/* Zone 2: Desktop Elastic Sliding Pill Nav */}
        <div className="hidden lg:block">
          <SlidingPillNav
            items={NAV_LINKS}
            activeId={activeSection}
            onSelect={navigateToSection}
            ariaLabel="Navigasi utama"
            variant="header"
            testId="desktop-sliding-nav"
          />
        </div>

        {/* Zone 3: Theme Circular Reveal + Cart WA CTA + Mobile Drawer Trigger */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            data-testid="theme-toggle-button"
            aria-label={theme === 'dark' ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#141210]/14 bg-[#F2ECE2] text-[#141210] hover:border-[#9A6B38] hover:text-[#9A6B38] cursor-pointer sm:h-10 sm:w-10 dark:border-[#D8B07A]/24 dark:bg-[#1B1713] dark:text-[#E8C696] dark:hover:border-[#D8B07A]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[#E8C696]" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-[#141210]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            data-testid="nav-cart-button"
            aria-label={`Buka keranjang pesanan (${cartCount} item)`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#141210] px-2.5 text-xs font-semibold text-[#F7F3EC] shadow-sm hover:bg-[#29241F] whitespace-nowrap cursor-pointer sm:min-h-[40px] sm:gap-2 sm:px-5 sm:text-sm dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Pesan WA</span>
            <span className="sm:hidden">WA</span>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: SPRING_POP_EASE }}
                data-testid="nav-cart-count"
                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D8B07A] px-1.5 text-[11px] font-bold text-[#0A0908] tabular-nums dark:bg-[#0A0908] dark:text-[#E8C696]"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#141210]/14 bg-[#F2ECE2] text-[#141210] hover:border-[#9A6B38] cursor-pointer sm:h-10 sm:w-10 lg:hidden dark:border-[#D8B07A]/24 dark:bg-[#1B1713] dark:text-[#F7F3EC]"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer — pure GPU transform/opacity exit so AnimatePresence unmounts reliably */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
            aria-label="Navigasi seluler"
            className="overflow-hidden border-b border-[#141210]/12 bg-[#FAF8F4] shadow-xl lg:hidden dark:border-[#D8B07A]/18 dark:bg-[#12100E]"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV_LINKS.map((link, idx) => {
                const isActive = activeSection === link.id;
                return (
                  <motion.a
                    key={link.id}
                    href={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToSection(link.id);
                    }}
                    className={`flex min-h-[44px] items-center justify-between rounded-2xl px-4 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#141210] text-[#E8C696] dark:bg-[#D8B07A] dark:text-[#0A0908]'
                        : 'text-[#4F473E] hover:bg-[#ECE6DC] hover:text-[#141210] dark:text-[#D4CBBF] dark:hover:bg-[#1E1A16] dark:hover:text-[#F7F3EC]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-current"
                      />
                    )}
                  </motion.a>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
