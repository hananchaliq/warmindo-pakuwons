import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { STORE_INFO } from '../data/menu';
import { BrandEmblem, LUXURY_EASE } from './MotionPrimitives';

interface NavbarProps {
  totalItems: number;
  onOpenCart: () => void;
}

const NAV_LINKS = [
  { href: '#menu', label: 'Menu' },
  { href: '#studio-3d', label: '3D Studio' },
  { href: '#cerita', label: 'Cerita' },
  { href: '#lokasi', label: 'Lokasi' },
];

export function Navbar({ totalItems, onOpenCart }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-40 transition-colors duration-200 ${
        scrolled || mobileOpen
          ? 'bg-[#0E221A] border-b border-[#E6BC7B]/18 shadow-sm'
          : 'bg-[#0E221A]/85 border-b border-[#E6BC7B]/10'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3.5 sm:h-[72px] sm:gap-6 sm:px-6 md:gap-8 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#beranda"
          className="inline-flex min-w-0 items-center gap-2 text-[#F8F4EC] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E6BC7B] sm:gap-2.5"
        >
          <BrandEmblem className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
          <span className="font-display text-base font-semibold tracking-tight sm:text-xl">
            {STORE_INFO.name}
          </span>
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#F5EFE4]/85"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 transition-colors hover:text-[#E6BC7B] whitespace-nowrap shrink-0 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[1px] after:origin-left after:scale-x-0 after:bg-[#E6BC7B] after:transition-transform hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Action (Cart & WA Checkout) + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Buka keranjang belanja, ${totalItems} item`}
            data-testid="navbar-cart-button"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#E6BC7B] px-3 py-1.5 text-xs font-semibold text-[#0E221A] transition-transform duration-200 hover:bg-[#EFC98D] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer sm:min-h-[42px] sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Pesan WA</span>
            {totalItems > 0 && (
              <span
                data-testid="navbar-cart-count"
                className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#0E221A] px-1.5 py-0.5 text-[11px] font-bold text-[#E6BC7B] tabular-nums"
              >
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F5EFE4]/25 text-[#F5EFE4] transition-colors hover:border-[#E6BC7B]/60 hover:text-[#E6BC7B] md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Navigasi seluler"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: LUXURY_EASE }}
            className="overflow-hidden border-t border-[#E6BC7B]/15 bg-[#0E221A] md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center rounded-xl px-3 text-base font-medium text-[#F5EFE4]/90 transition-colors hover:bg-[#173529] hover:text-[#E6BC7B]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
