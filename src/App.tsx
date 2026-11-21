import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Clock,
  ExternalLink,
  Flame,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Utensils,
} from 'lucide-react';
import {
  CATEGORY_TABS,
  EXPERIENCE_IMAGE,
  HERO_IMAGE,
  ORDER_METHODS,
  PRODUCTS,
  SHOWCASE_DISHES,
  SPICE_LEVELS,
  STORE_INFO,
  STORY_IMAGE,
  type OrderMethod,
  type Product,
  type ProductCategory,
  type SpiceLevel,
  type ToppingOption,
} from './data/menu';
import {
  addOrMergeCartItem,
  computeCartTotals,
  filterProducts,
  formatRupiah,
  removeCartItem,
  updateCartItemQuantity,
  type CartItem,
  type CheckoutFormState,
} from './utils/orderLogic';
import {
  attachGlobalSpotlightTracker,
  toggleThemeWithReveal,
  type ThemeMode,
} from './utils/motionCraft';
import { Navbar } from './components/Navbar';
import {
  BrandEmblem,
  FLUID_EASE,
  MagneticWrap,
  MaskedLine,
  ParallaxFrame,
  RevealBlock,
  ScrollProgressLine,
  SPRING_POP_EASE,
} from './components/MotionPrimitives';
import { SlidingPillNav, type PillNavItem } from './components/SlidingPillNav';
import { AnimatedNumber } from './components/AnimatedNumber';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { HeroEmberCanvas } from './three/HeroEmberCanvas';
import { CulinaryShowcase3D, type DishModelId } from './three/CulinaryShowcase3D';

const CART_STORAGE_KEY = 'warmindo_pakuwons_cart_v1';
const THEME_STORAGE_KEY = 'warmindo_pakuwons_theme_v2';

type CatalogViewMode = 'grid' | 'list';

interface ToastState {
  id: number;
  message: string;
  undoSnapshot?: CartItem[];
}

const DISH_CRAFT_METRICS: Record<
  DishModelId,
  { label: string; score: number }[]
> = {
  nyemek: [
    { label: 'Kedalaman Rempah', score: 94 },
    { label: 'Aroma Wajan', score: 88 },
    { label: 'Tingkat Kehangatan', score: 96 },
  ],
  magelangan: [
    { label: 'Aroma Smokey Wok', score: 97 },
    { label: 'Kepadatan Porsi', score: 95 },
    { label: 'Tekstur Renyah', score: 89 },
  ],
  kopi: [
    { label: 'Keseimbangan Aren', score: 93 },
    { label: 'Intensitas Kopi', score: 86 },
    { label: 'Kesegaran Dingin', score: 98 },
  ],
};

const MARQUEE_PHRASES = [
  'Indomie Nyemek Wajan Besi',
  'Magelangan Smokey Pakuwon',
  'Es Kopi Susu Gula Aren',
  'Pesan Instan Chat WhatsApp',
  'Buka 16.00 – 03.00 WIB',
  'Depok · Sleman · Yogyakarta',
];

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore storage restriction
  }
  return 'dark';
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Category & View-mode Blur-Out -> Staggered Blur-In morph states
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [displayedCategory, setDisplayedCategory] = useState<ProductCategory>('all');
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');
  const [displayedViewMode, setDisplayedViewMode] = useState<CatalogViewMode>('grid');
  const [isMorphing, setIsMorphing] = useState(false);
  const [morphKey, setMorphKey] = useState(0);
  const morphTimerRef = useRef<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDishId, setActiveDishId] = useState<DishModelId>('nyemek');
  const [heroShowcaseIndex, setHeroShowcaseIndex] = useState(0);
  const [defaultSpice, setDefaultSpice] = useState<SpiceLevel>('Sedang');
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number>(0);

  const [showBackToTop, setShowBackToTop] = useState(false);

  // Viewport-triggered Craft Story SVG curve & KPI count-up
  const craftRef = useRef<HTMLDivElement | null>(null);
  const [craftVisible, setCraftVisible] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    customerName: '',
    orderMethod: 'Makan di Tempat',
    tableNumber: '',
    deliveryAddress: '',
    generalNote: '',
    whatsappTarget: STORE_INFO.defaultWhatsapp,
  });

  // Sync Tailwind v4 class-based dark mode on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage quota errors
    }
  }, [theme]);

  // Global spotlight & 3D tilt pointer tracking
  useEffect(() => {
    return attachGlobalSpotlightTracker();
  }, []);

  // Back-to-top visibility listener
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 560);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Observe Craft Story bento for SVG draw-in & animated numbers
  useEffect(() => {
    const el = craftRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCraftVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCraftVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (morphTimerRef.current) window.clearTimeout(morphTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleToggleTheme = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    toggleThemeWithReveal(event, () => {
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      setTheme(nextTheme);
    });
  }, [theme]);

  const triggerCatalogMorph = useCallback(
    (nextCat: ProductCategory, nextView: CatalogViewMode) => {
      setSelectedCategory(nextCat);
      setViewMode(nextView);
      setIsMorphing(true);
      if (morphTimerRef.current) window.clearTimeout(morphTimerRef.current);
      morphTimerRef.current = window.setTimeout(() => {
        setDisplayedCategory(nextCat);
        setDisplayedViewMode(nextView);
        setMorphKey((k) => k + 1);
        setIsMorphing(false);
      }, 210);
    },
    [],
  );

  const handleSelectCategory = useCallback(
    (nextCategory: ProductCategory) => {
      if (nextCategory === selectedCategory) return;
      triggerCatalogMorph(nextCategory, viewMode);
    },
    [selectedCategory, viewMode, triggerCatalogMorph],
  );

  const handleSelectViewMode = useCallback(
    (nextView: CatalogViewMode) => {
      if (nextView === viewMode) return;
      triggerCatalogMorph(selectedCategory, nextView);
    },
    [selectedCategory, viewMode, triggerCatalogMorph],
  );

  const showToast = useCallback((message: string, undoSnapshot?: CartItem[]) => {
    setToast({ id: Date.now(), message, undoSnapshot });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3800);
  }, []);

  const handleUndoToast = useCallback(() => {
    if (!toast?.undoSnapshot) return;
    setCart(toast.undoSnapshot);
    setToast(null);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, [toast]);

  const handleQuickAdd = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const snapshot = prev;
        showToast(`${product.name} masuk keranjang`, snapshot);
        return addOrMergeCartItem(prev, {
          product,
          spiceLevel: product.supportsSpice ? defaultSpice : undefined,
          toppings: [],
          note: '',
          quantity: 1,
        });
      });
    },
    [defaultSpice, showToast],
  );

  const handleConfirmCustomAdd = useCallback(
    (payload: {
      product: Product;
      spiceLevel?: SpiceLevel;
      toppings: ToppingOption[];
      note: string;
      quantity: number;
    }) => {
      setCart((prev) => {
        const snapshot = prev;
        showToast(`${payload.quantity}x ${payload.product.name} ditambahkan`, snapshot);
        return addOrMergeCartItem(prev, payload);
      });
    },
    [showToast],
  );

  const handleUpdateQty = useCallback((cartKey: string, delta: number) => {
    setCart((prev) => updateCartItemQuantity(prev, cartKey, delta));
  }, []);

  const handleRemoveItem = useCallback(
    (cartKey: string) => {
      setCart((prev) => {
        const removed = prev.find((i) => i.cartKey === cartKey);
        if (removed) {
          showToast(`${removed.name} dihapus`, prev);
        }
        return removeCartItem(prev, cartKey);
      });
    },
    [showToast],
  );

  const handleClearCart = useCallback(() => {
    setCart((prev) => {
      if (prev.length > 0) {
        showToast('Keranjang dikosongkan', prev);
      }
      return [];
    });
  }, [showToast]);

  const { totalItems, subtotal } = useMemo(() => computeCartTotals(cart), [cart]);

  const cartQtyByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.productId] = (map[item.productId] || 0) + item.quantity;
    }
    return map;
  }, [cart]);

  const filteredProducts = useMemo(
    () =>
      filterProducts(PRODUCTS, {
        category: displayedCategory,
        query: searchQuery,
      }),
    [displayedCategory, searchQuery],
  );

  const activeShowcase =
    SHOWCASE_DISHES.find((d) => d.id === activeDishId) ?? SHOWCASE_DISHES[0];
  const activeShowcaseProduct =
    PRODUCTS.find((p) => p.id === activeShowcase.productId) ?? PRODUCTS[0];

  const heroSignatureDish = SHOWCASE_DISHES[heroShowcaseIndex % SHOWCASE_DISHES.length];
  const heroSignatureProduct =
    PRODUCTS.find((p) => p.id === heroSignatureDish.productId) ?? PRODUCTS[0];

  const categoryNavItems = useMemo<PillNavItem<ProductCategory>[]>(
    () => CATEGORY_TABS.map((tab) => ({ id: tab.id, label: tab.label })),
    [],
  );

  const viewModeNavItems = useMemo<PillNavItem<CatalogViewMode>[]>(
    () => [
      { id: 'grid', label: 'Galeri', icon: <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" /> },
      { id: 'list', label: 'Daftar', icon: <List className="h-3.5 w-3.5" aria-hidden="true" /> },
    ],
    [],
  );

  const dishNavItems = useMemo<PillNavItem<DishModelId>[]>(
    () => SHOWCASE_DISHES.map((d) => ({ id: d.id, label: d.label })),
    [],
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = window.innerWidth >= 1024 ? 92 : 66;
    const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen overflow-x-clip bg-[#F6F3EE] text-[#141210] transition-colors duration-300 dark:bg-[#0A0908] dark:text-[#F7F3EC]">
        <ScrollProgressLine />

        <Navbar
          cartCount={totalItems}
          onOpenCart={() => setCartOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* ============================================================
            SECTION 1: ASYMMETRIC SPLIT ATELIER HERO (TRUE DUAL-THEME)
           ============================================================ */}
        <section
          id="beranda"
          className="relative overflow-hidden bg-[#F6F3EE] pt-20 pb-14 text-[#141210] transition-colors duration-300 sm:pt-28 sm:pb-20 lg:min-h-[90vh] lg:pt-32 lg:pb-20 dark:bg-[#0A0908] dark:text-[#F7F3EC]"
        >
          {/* Theme-aware atmospheric light wash + Three.js Embers */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_18%_22%,rgba(154,107,56,0.12),transparent_68%),radial-gradient(50%_50%_at_84%_72%,rgba(216,176,122,0.14),transparent_70%)] dark:bg-[radial-gradient(60%_55%_at_18%_22%,rgba(216,176,122,0.14),transparent_68%),radial-gradient(50%_50%_at_84%_72%,rgba(154,107,56,0.12),transparent_70%)]"
          />
          <HeroEmberCanvas theme={theme} />

          <div className="relative z-20 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
            {/* Left Column: Monumental Editorial Typography + Magnetic CTAs */}
            <div className="min-w-0 lg:col-span-7">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: FLUID_EASE }}
                className="text-[11px] font-semibold tracking-[0.2em] text-[#9A6B38] uppercase sm:text-xs dark:text-[#D8B07A]"
              >
                Depok · Sleman · Yogyakarta — 16.00 – 03.00 WIB
              </motion.p>

              <h1 className="mt-3.5 font-display text-[clamp(2.45rem,9vw,4.65rem)] leading-[0.98] font-medium tracking-tight text-[#141210] dark:text-[#F7F3EC]">
                <MaskedLine delay={0.05}>Seni Hangat</MaskedLine>
                <MaskedLine delay={0.14} className="italic text-[#9A6B38] dark:text-[#D8B07A]">
                  Dapur Malam
                </MaskedLine>
                <MaskedLine delay={0.23}>Pakuwon&apos;s</MaskedLine>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.3, ease: FLUID_EASE }}
                className="mt-5 max-w-xl text-sm leading-relaxed text-[#574F46] sm:mt-6 sm:text-lg dark:text-[#CFC6B8]"
              >
                Indomie Nyemek berbumbu wajan besi, Magelangan smokey, dan Es Kopi Susu Gula Aren.
                Inspeksi hidangan 3D interaktif lalu pesan seketika via chat WhatsApp.
              </motion.p>

              {/* Magnetic Primary CTA + Secondary Outline */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.38, ease: FLUID_EASE }}
                className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-3.5"
              >
                <MagneticWrap strength={6}>
                  <button
                    type="button"
                    onClick={() => scrollToSection('menu')}
                    className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-[#141210] px-6 py-3 text-sm font-semibold text-[#F7F3EC] shadow-[0_14px_32px_-12px_rgba(20,18,16,0.38)] hover:bg-[#29241F] cursor-pointer sm:min-h-[50px] sm:px-7 dark:bg-[#D8B07A] dark:text-[#0A0908] dark:shadow-[0_14px_34px_-10px_rgba(216,176,122,0.55)] dark:hover:bg-[#E8C696]"
                  >
                    <span>Jelajahi Katalog</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </MagneticWrap>

                <button
                  type="button"
                  onClick={() => scrollToSection('studio-3d')}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#141210]/18 bg-white/90 px-5 py-3 text-sm font-semibold text-[#141210] hover:border-[#9A6B38] hover:text-[#9A6B38] cursor-pointer sm:min-h-[50px] sm:px-6 dark:border-[#D8B07A]/32 dark:bg-[#161310]/85 dark:text-[#F7F3EC] dark:hover:border-[#D8B07A] dark:hover:text-[#E8C696]"
                >
                  <Sparkles className="h-4 w-4 text-[#9A6B38] dark:text-[#D8B07A]" aria-hidden="true" />
                  <span>Buka Studio 3D</span>
                </button>
              </motion.div>

              {/* Architectural Inline Order Preference Strip */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.46, ease: FLUID_EASE }}
                className="mt-8 grid grid-cols-1 gap-3 rounded-[24px] border border-[#141210]/12 bg-white p-3.5 shadow-[0_14px_36px_-22px_rgba(20,18,16,0.2)] sm:mt-10 md:grid-cols-3 md:items-center dark:border-[#D8B07A]/18 dark:bg-[#141210]/94 dark:shadow-none"
              >
                <div className="flex items-center gap-3 border-b border-[#141210]/8 px-2 pb-2.5 md:border-r md:border-b-0 md:py-1 dark:border-[#D8B07A]/14">
                  <Utensils className="h-4 w-4 shrink-0 text-[#9A6B38] dark:text-[#D8B07A]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="hero-order-method"
                      className="block text-[10px] font-semibold tracking-wider text-[#73695E] uppercase dark:text-[#9D9488]"
                    >
                      Layanan
                    </label>
                    <select
                      id="hero-order-method"
                      value={checkoutForm.orderMethod}
                      onChange={(e) =>
                        setCheckoutForm((prev) => ({
                          ...prev,
                          orderMethod: e.target.value as OrderMethod,
                        }))
                      }
                      className="w-full cursor-pointer bg-transparent text-xs font-semibold text-[#141210] focus:outline-none sm:text-sm dark:text-[#F7F3EC]"
                    >
                      {ORDER_METHODS.map((m) => (
                        <option key={m} value={m} className="bg-white text-[#141210] dark:bg-[#141210] dark:text-[#F7F3EC]">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-[#141210]/8 px-2 pb-2.5 md:border-r md:border-b-0 md:py-1 dark:border-[#D8B07A]/14">
                  <Flame className="h-4 w-4 shrink-0 text-[#9A6B38] dark:text-[#D8B07A]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="hero-spice-level"
                      className="block text-[10px] font-semibold tracking-wider text-[#73695E] uppercase dark:text-[#9D9488]"
                    >
                      Kepedasan
                    </label>
                    <select
                      id="hero-spice-level"
                      value={defaultSpice}
                      onChange={(e) => setDefaultSpice(e.target.value as SpiceLevel)}
                      className="w-full cursor-pointer bg-transparent text-xs font-semibold text-[#141210] focus:outline-none sm:text-sm dark:text-[#F7F3EC]"
                    >
                      {SPICE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl} className="bg-white text-[#141210] dark:bg-[#141210] dark:text-[#F7F3EC]">
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (totalItems > 0) {
                      setCartOpen(true);
                    } else {
                      scrollToSection('menu');
                    }
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#ECE6DC] px-4 py-2 text-xs font-semibold text-[#141210] hover:bg-[#141210] hover:text-[#F7F3EC] whitespace-nowrap cursor-pointer dark:bg-[#241E18] dark:text-[#E8C696] dark:hover:bg-[#D8B07A] dark:hover:text-[#0A0908]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>{totalItems > 0 ? `Chat WA (${totalItems})` : 'Mulai Pesan WA'}</span>
                </button>
              </motion.div>
            </div>

            {/* Right Column: Sculptural Parallax Frame + Interactive Signature Switcher */}
            <div className="min-w-0 lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: FLUID_EASE }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-[28px] border border-[#141210]/12 bg-[#ECE6DC] shadow-[0_28px_64px_-26px_rgba(20,18,16,0.3)] sm:rounded-[32px] dark:border-[#D8B07A]/24 dark:bg-[#141210] dark:shadow-[0_32px_72px_-24px_rgba(0,0,0,0.9)]">
                  <ParallaxFrame distance={18} className="h-[360px] w-full sm:h-[460px]">
                    <img
                      src={HERO_IMAGE}
                      alt="Suasana malam hangat Warmindo Pakuwon's Sleman Yogyakarta"
                      referrerPolicy="no-referrer"
                      className="h-[112%] w-full -translate-y-4 object-cover"
                    />
                  </ParallaxFrame>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141210]/72 via-[#141210]/12 to-transparent dark:from-[#0A0908]/94 dark:via-[#0A0908]/25" />

                  {/* Interactive Floating Signature Tasting Card (Dual-theme & responsive mobile stack) */}
                  <div className="absolute right-3 bottom-3 left-3 rounded-[20px] border border-[#141210]/10 bg-white/96 p-3.5 text-[#141210] shadow-lg sm:right-4 sm:bottom-4 sm:left-4 sm:rounded-[22px] sm:p-4 dark:border-[#D8B07A]/24 dark:bg-[#12100E]/95 dark:text-[#F7F3EC]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.2em] text-[#9A6B38] uppercase dark:text-[#D8B07A]">
                        Signature Pilihan
                      </span>
                      <div className="flex items-center gap-1.5">
                        {SHOWCASE_DISHES.map((dish, idx) => (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() => setHeroShowcaseIndex(idx)}
                            aria-label={`Lihat pratinjau ${dish.label}`}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              idx === heroShowcaseIndex
                                ? 'w-6 bg-[#9A6B38] dark:bg-[#D8B07A]'
                                : 'w-2 bg-[#141210]/20 hover:bg-[#141210]/40 dark:bg-[#D8B07A]/30 dark:hover:bg-[#D8B07A]/60'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={heroSignatureDish.id}
                        initial={{ opacity: 0, filter: 'blur(6px)', y: 6 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        exit={{ opacity: 0, filter: 'blur(6px)', y: -6 }}
                        transition={{ duration: 0.28, ease: FLUID_EASE }}
                        className="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <h2 className="truncate font-display text-lg font-semibold text-[#141210] sm:text-xl dark:text-[#F7F3EC]">
                            {heroSignatureProduct.name}
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-[#574F46] dark:text-[#A9A093]">
                            {heroSignatureDish.subtitle}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDishId(heroSignatureDish.id);
                              scrollToSection('studio-3d');
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-full border border-[#141210]/18 px-3.5 text-xs font-semibold text-[#141210] hover:bg-[#141210] hover:text-[#F7F3EC] cursor-pointer sm:h-10 dark:border-[#D8B07A]/35 dark:text-[#E8C696] dark:hover:bg-[#D8B07A] dark:hover:text-[#0A0908]"
                          >
                            3D
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(heroSignatureProduct)}
                            className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[#141210] px-3.5 text-xs font-semibold text-[#F7F3EC] hover:bg-[#2A2520] cursor-pointer tabular-nums sm:h-10 sm:flex-initial dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
                          >
                            +{formatRupiah(heroSignatureProduct.price)}
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================================
            EDITORIAL INFINITE CULINARY RIBBON
           ============================================================ */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-y border-[#141210]/10 bg-[#ECE6DC] py-3.5 text-[#141210] dark:border-[#D8B07A]/16 dark:bg-[#110F0D] dark:text-[#D8B07A]"
        >
          <div className="marquee-track">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center gap-8 pr-8">
                {MARQUEE_PHRASES.map((phrase) => (
                  <span
                    key={`${dup}-${phrase}`}
                    className="flex items-center gap-8 font-display text-base italic tracking-wide sm:text-xl"
                  >
                    <span>{phrase}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9A6B38] dark:bg-[#D8B07A]/60" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            SECTION 2: THREE.JS 3D TASTING STUDIO (TRUE DUAL-THEME)
           ============================================================ */}
        <section
          id="studio-3d"
          className="relative scroll-mt-24 overflow-hidden bg-[#EFEAE1] py-16 text-[#141210] transition-colors duration-300 sm:py-24 dark:bg-[#0D0B09] dark:text-[#F7F3EC]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Gallery Header + Dish Sliding Pill Selector */}
            <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end lg:gap-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.22em] text-[#9A6B38] uppercase dark:text-[#D8B07A]">
                  Studio Hidangan 3D Interaktif
                </p>
                <h2 className="mt-2 font-display text-3xl leading-tight font-medium text-[#141210] sm:text-5xl dark:text-[#F7F3EC]">
                  Inspeksi <span className="italic text-[#9A6B38] dark:text-[#D8B07A]">360°</span> Sebelum Memesan
                </h2>
              </div>

              <div className="no-scrollbar max-w-full overflow-x-auto pb-1">
                <SlidingPillNav
                  items={dishNavItems}
                  activeId={activeDishId}
                  onSelect={(id) => setActiveDishId(id)}
                  ariaLabel="Pilih model hidangan 3D"
                  variant="surface"
                  testId="dish-3d-pill-nav"
                />
              </div>
            </div>

            {/* 12-Column Theatrical Stage + Tasting Dossier */}
            <div className="mt-8 grid items-stretch gap-6 sm:mt-10 lg:grid-cols-12 lg:gap-8">
              {/* Interactive Three.js Stage (7 cols) */}
              <div className="min-w-0 lg:col-span-7">
                <CulinaryShowcase3D activeDish={activeDishId} onSelectDish={setActiveDishId} />
              </div>

              {/* Atelier Tasting Dossier (5 cols) */}
              <div className="flex min-w-0 flex-col justify-between rounded-[26px] border border-[#141210]/10 bg-white p-5 shadow-[0_16px_42px_-24px_rgba(20,18,16,0.18)] sm:rounded-[28px] sm:p-7 lg:col-span-5 dark:border-[#D8B07A]/18 dark:bg-[#151210] dark:shadow-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDishId}
                    initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }}
                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    exit={{ opacity: 0, filter: 'blur(8px)', y: -8 }}
                    transition={{ duration: 0.34, ease: FLUID_EASE }}
                  >
                    <p className="text-xs font-medium text-[#73695E] dark:text-[#9D9488]">
                      {activeShowcaseProduct.categoryLabel} · Estimasi{' '}
                      {activeShowcaseProduct.prepMinutes} menit masak
                    </p>

                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-display text-2xl font-semibold text-[#141210] sm:text-3xl dark:text-[#F7F3EC]">
                        {activeShowcaseProduct.name}
                      </h3>
                      <AnimatedNumber
                        value={activeShowcaseProduct.price}
                        durationMs={420}
                        format={formatRupiah}
                        className="font-display text-2xl font-semibold text-[#9A6B38] dark:text-[#D8B07A]"
                      />
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#574F46] dark:text-[#CFC6B8]">
                      {activeShowcaseProduct.fullDesc}
                    </p>

                    {/* Clean unboxed tasting notes */}
                    <p className="mt-4 text-xs font-semibold text-[#9A6B38] dark:text-[#D8B07A]">
                      {activeShowcase.tastingNotes.join('  ·  ')}
                    </p>

                    {/* Animated Progress Bar Craft Metrics */}
                    <div className="mt-6 space-y-3 border-t border-[#141210]/10 pt-5 dark:border-[#D8B07A]/14">
                      {DISH_CRAFT_METRICS[activeDishId].map((metric, idx) => (
                        <div key={`${activeDishId}-${metric.label}`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#574F46] dark:text-[#CFC6B8]">{metric.label}</span>
                            <span className="font-semibold text-[#9A6B38] tabular-nums dark:text-[#D8B07A]">
                              {metric.score}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#ECE6DC] dark:bg-[#241F1A]">
                            <div
                              style={
                                {
                                  width: `${metric.score}%`,
                                  '--i': idx,
                                } as CSSProperties
                              }
                              className="progress-fill-bar h-full rounded-full bg-gradient-to-r from-[#9A6B38] to-[#D8B07A] dark:to-[#E8C696]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-4 sm:mt-7 sm:gap-3">
                  <MagneticWrap strength={5} className="min-w-[180px] flex-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(activeShowcaseProduct)}
                      className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#141210] px-5 py-2.5 text-sm font-semibold text-[#F7F3EC] hover:bg-[#2A2520] whitespace-nowrap cursor-pointer sm:min-h-[48px] dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
                    >
                      <span>Tambah ke Keranjang</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </MagneticWrap>
                  {(activeShowcaseProduct.supportsSpice ||
                    activeShowcaseProduct.supportsToppings) && (
                    <button
                      type="button"
                      onClick={() => setCustomizingProduct(activeShowcaseProduct)}
                      className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-full border border-[#141210]/18 px-5 py-2.5 text-sm font-semibold text-[#141210] hover:border-[#141210] hover:bg-[#ECE6DC] whitespace-nowrap cursor-pointer sm:min-h-[48px] dark:border-[#D8B07A]/32 dark:text-[#F7F3EC] dark:hover:border-[#D8B07A] dark:hover:bg-[#1E1A16] dark:hover:text-[#E8C696]"
                    >
                      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                      <span>Racik</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 3: DUAL-VIEW MORPHING CATALOG (GALERI / DAFTAR)
           ============================================================ */}
        <section
          id="menu"
          className="scroll-mt-24 bg-[#F6F3EE] py-16 transition-colors duration-300 sm:py-24 dark:bg-[#0A0908]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <RevealBlock className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-semibold tracking-[0.22em] text-[#9A6B38] uppercase dark:text-[#D8B07A]">
                  Katalog Kurasi &amp; Pesan WhatsApp
                </p>
                <h2 className="mt-2 font-display text-3xl leading-tight font-medium text-[#141210] sm:text-5xl dark:text-[#F7F3EC]">
                  Hidangan Pilihan <span className="italic text-[#9A6B38] dark:text-[#D8B07A]">Malam Ini</span>
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[#574F46] dark:text-[#A9A093]">
                  Atur level pedas, tambah topping favorit, lalu kirim rincian pesanan otomatis ke
                  WhatsApp Warmindo Pakuwon&apos;s.
                </p>
              </div>

              {/* Search + View Mode Switcher */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:w-64">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#73695E] dark:text-[#9D9488]"
                    aria-hidden="true"
                  />
                  <label htmlFor="menu-search" className="sr-only">
                    Cari menu warmindo
                  </label>
                  <input
                    id="menu-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nyemek, kopi, roti..."
                    className="min-h-[44px] w-full rounded-full border border-[#141210]/14 bg-white py-2 pr-4 pl-10 text-sm text-[#141210] placeholder:text-[#73695E]/70 focus:border-[#141210] focus:outline-none dark:border-[#D8B07A]/20 dark:bg-[#141210] dark:text-[#F7F3EC] dark:placeholder:text-[#9D9488]/70 dark:focus:border-[#D8B07A]"
                  />
                </div>

                <div className="self-start sm:self-auto">
                  <SlidingPillNav
                    items={viewModeNavItems}
                    activeId={viewMode}
                    onSelect={handleSelectViewMode}
                    ariaLabel="Mode tampilan katalog"
                    variant="surface"
                    testId="catalog-view-pill-nav"
                  />
                </div>
              </div>
            </RevealBlock>

            {/* Elastic Category Sliding Pill Bar */}
            <div className="no-scrollbar mt-6 max-w-full overflow-x-auto pb-1.5 sm:mt-7">
              <SlidingPillNav
                items={categoryNavItems}
                activeId={selectedCategory}
                onSelect={handleSelectCategory}
                ariaLabel="Kategori menu"
                variant="surface"
                testId="category-sliding-nav"
              />
            </div>

            {/* Dual-View Morphing Product Grid / Tasting List */}
            <div className={`morph-container mt-7 sm:mt-9 ${isMorphing ? 'morph-out' : ''}`}>
              {filteredProducts.length === 0 ? (
                <div className="rounded-[26px] border border-[#141210]/10 bg-white p-10 text-center sm:p-12 dark:border-[#D8B07A]/16 dark:bg-[#141210]">
                  <p className="font-display text-2xl font-semibold text-[#141210] dark:text-[#F7F3EC]">
                    Menu tidak ditemukan
                  </p>
                  <p className="mt-1.5 text-sm text-[#574F46] dark:text-[#A9A093]">
                    Coba kata kunci lain atau tampilkan kembali seluruh kategori menu.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleSelectCategory('all');
                    }}
                    className="mt-5 inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#141210] px-5 py-2 text-xs font-semibold text-[#F7F3EC] cursor-pointer dark:bg-[#D8B07A] dark:text-[#0A0908]"
                  >
                    Tampilkan Semua Menu
                  </button>
                </div>
              ) : displayedViewMode === 'list' ? (
                <div
                  key={`list-${displayedCategory}-${morphKey}`}
                  data-testid="catalog-list-view"
                  className="mx-auto max-w-4xl space-y-3.5"
                >
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      cartQty={cartQtyByProduct[product.id] ?? 0}
                      viewMode="list"
                      onQuickAdd={handleQuickAdd}
                      onCustomize={setCustomizingProduct}
                    />
                  ))}
                </div>
              ) : (
                <div
                  key={`grid-${displayedCategory}-${morphKey}`}
                  data-testid="catalog-grid-view"
                  className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
                >
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      cartQty={cartQtyByProduct[product.id] ?? 0}
                      viewMode="grid"
                      onQuickAdd={handleQuickAdd}
                      onCustomize={setCustomizingProduct}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 4: ASYMMETRIC EDITORIAL CRAFT BENTO (#cerita)
           ============================================================ */}
        <section
          id="cerita"
          ref={craftRef}
          className="scroll-mt-24 border-t border-[#141210]/8 bg-[#EFEAE1] py-16 transition-colors duration-300 sm:py-24 dark:border-[#D8B07A]/12 dark:bg-[#0F0D0B]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-stretch gap-6 sm:gap-8 lg:grid-cols-12">
              {/* Left 5 cols: Sculpted Parallax Wok Photography */}
              <RevealBlock className="min-w-0 lg:col-span-5">
                <div className="relative h-full min-h-[310px] overflow-hidden rounded-[26px] border border-[#141210]/12 bg-[#ECE6DC] shadow-[0_22px_52px_-24px_rgba(20,18,16,0.28)] sm:min-h-[380px] sm:rounded-[30px] dark:border-[#D8B07A]/20 dark:bg-[#141210]">
                  <ParallaxFrame distance={20} className="h-full w-full">
                    <img
                      src={STORY_IMAGE}
                      alt="Proses memasak wajan besi hangat Warmindo Pakuwon's"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-[114%] w-full -translate-y-4 object-cover"
                    />
                  </ParallaxFrame>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141210]/84 via-transparent to-transparent" />
                  <div className="absolute right-5 bottom-5 left-5 text-[#F7F3EC] sm:right-6 sm:bottom-6 sm:left-6">
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-[#E8C696] uppercase">
                      Filosofi Wajan Besi
                    </p>
                    <p className="mt-1 font-display text-xl italic sm:text-2xl">
                      Dimasak per porsi, disajikan mengepul.
                    </p>
                  </div>
                </div>
              </RevealBlock>

              {/* Right 7 cols: Story Narrative + Bento KPI Grid + SVG Draw-In Curve */}
              <div className="flex min-w-0 flex-col justify-between gap-5 sm:gap-6 lg:col-span-7">
                <RevealBlock delay={0.05}>
                  <p className="text-xs font-semibold tracking-[0.22em] text-[#9A6B38] uppercase dark:text-[#D8B07A]">
                    Kisah Dapur Pakuwon&apos;s
                  </p>
                  <h2 className="mt-2 font-display text-3xl leading-tight font-medium text-[#141210] sm:text-5xl dark:text-[#F7F3EC]">
                    Tradisi Warmindo Jogja dalam{' '}
                    <span className="italic text-[#9A6B38] dark:text-[#D8B07A]">Sentuhan Modern</span>
                  </h2>
                  <p className="mt-3.5 text-sm leading-relaxed text-[#574F46] sm:mt-4 sm:text-base dark:text-[#B5AC9E]">
                    Berdiri di kawasan hidup Pakuwon Mall &amp; Seturan, kami menjaga standar rasa
                    klasik Jogja: bumbu bawang dan cabai segar yang diulek setiap sore, api wajan
                    terjaga untuk aroma smokey alami, serta antrean praktis lewat pesan WhatsApp.
                  </p>
                </RevealBlock>

                {/* Bento Metrics */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
                  <div className="spotlight-card rounded-[22px] border border-[#141210]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 dark:border-[#D8B07A]/15 dark:bg-[#151210]">
                    <p className="text-xs font-medium text-[#73695E] dark:text-[#9D9488]">
                      Koleksi Menu
                    </p>
                    <p className="mt-1.5 font-display text-3xl font-semibold text-[#141210] whitespace-nowrap sm:mt-2 sm:text-4xl dark:text-[#E8C696]">
                      <AnimatedNumber
                        value={craftVisible ? PRODUCTS.length : 0}
                        durationMs={850}
                        format={(n) => `${Math.round(n)}+`}
                      />
                    </p>
                    <p className="mt-1 text-xs text-[#574F46] dark:text-[#A9A093]">
                      Mie, nasi, camilan &amp; kopi
                    </p>
                  </div>

                  <div className="spotlight-card rounded-[22px] border border-[#141210]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 dark:border-[#D8B07A]/15 dark:bg-[#151210]">
                    <p className="text-xs font-medium text-[#73695E] dark:text-[#9D9488]">
                      Jam Dapur
                    </p>
                    <p className="mt-1.5 font-display text-3xl font-semibold text-[#141210] whitespace-nowrap sm:mt-2 sm:text-4xl dark:text-[#E8C696]">
                      <AnimatedNumber
                        value={craftVisible ? 11 : 0}
                        durationMs={900}
                        format={(n) => `${Math.round(n)} Jam`}
                      />
                    </p>
                    <p className="mt-1 text-xs text-[#574F46] dark:text-[#A9A093]">
                      Sore hingga dini hari WIB
                    </p>
                  </div>

                  <div className="spotlight-card rounded-[22px] border border-[#141210]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 dark:border-[#D8B07A]/15 dark:bg-[#151210]">
                    <p className="text-xs font-medium text-[#73695E] dark:text-[#9D9488]">
                      Rata-rata Saji
                    </p>
                    <p className="mt-1.5 font-display text-3xl font-semibold text-[#141210] whitespace-nowrap sm:mt-2 sm:text-4xl dark:text-[#E8C696]">
                      <AnimatedNumber
                        value={craftVisible ? 7 : 0}
                        durationMs={800}
                        format={(n) => `~${Math.round(n)} mnt`}
                      />
                    </p>
                    <p className="mt-1 text-xs text-[#574F46] dark:text-[#A9A093]">
                      Hangat langsung dari wajan
                    </p>
                  </div>
                </div>

                {/* Viewport-triggered SVG Path Draw-In Craft Curve */}
                <div className="spotlight-card rounded-[22px] border border-[#141210]/10 bg-white p-4 sm:rounded-[24px] sm:p-5 dark:border-[#D8B07A]/15 dark:bg-[#151210]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-[#9A6B38] uppercase dark:text-[#D8B07A]">
                        Kurva Karakter Wajan Besi
                      </p>
                      <p className="mt-0.5 text-xs text-[#574F46] dark:text-[#A9A093]">
                        Tumis Rempah → Karamelisasi Kecap → Saji Nyemek Kental
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#141210] tabular-nums dark:text-[#E8C696]">
                      215°C Puncak Api
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 420 74"
                    fill="none"
                    aria-hidden="true"
                    className="mt-4 h-16 w-full"
                  >
                    <defs>
                      <linearGradient id="heatCurveGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#9A6B38" />
                        <stop offset="55%" stopColor="#D8B07A" />
                        <stop offset="100%" stopColor="#F3DAB2" />
                      </linearGradient>
                    </defs>
                    <line
                      x1="0"
                      y1="62"
                      x2="420"
                      y2="62"
                      stroke="currentColor"
                      strokeOpacity="0.12"
                      strokeDasharray="3 4"
                    />
                    {craftVisible && (
                      <path
                        d="M 8 56 C 68 52, 92 22, 165 26 C 232 30, 265 10, 326 14 C 364 16, 392 30, 412 24"
                        stroke="url(#heatCurveGrad)"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        pathLength={1}
                        className="svg-draw-path"
                      />
                    )}
                    <circle cx="165" cy="26" r="4" fill="#D8B07A" />
                    <circle cx="326" cy="14" r="4.5" fill="#E8C696" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION 5: PANORAMIC VISIT & WHATSAPP CONCIERGE (DUAL-THEME)
           ============================================================ */}
        <section
          id="lokasi"
          className="scroll-mt-24 bg-[#F6F3EE] py-16 transition-colors duration-300 sm:py-24 dark:bg-[#0A0908]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <RevealBlock className="overflow-hidden rounded-[28px] border border-[#141210]/10 bg-white text-[#141210] shadow-[0_24px_60px_-24px_rgba(20,18,16,0.18)] sm:rounded-[32px] dark:border-[#D8B07A]/20 dark:bg-[#141210] dark:text-[#F7F3EC] dark:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.55)]">
              <div className="grid lg:grid-cols-12">
                {/* Atmospheric Night Photo */}
                <div className="relative min-h-[240px] overflow-hidden sm:min-h-[300px] lg:col-span-6 lg:min-h-[420px]">
                  <img
                    src={EXPERIENCE_IMAGE}
                    alt="Suasana nongkrong malam di Warmindo Pakuwon's Sleman Yogyakarta"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/15 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white dark:from-[#141210] dark:via-[#141210]/20 dark:lg:from-transparent dark:lg:to-[#141210]" />
                </div>

                {/* Architectural Concierge Panel */}
                <div className="flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:col-span-6 lg:p-12">
                  <p className="text-xs font-semibold tracking-[0.22em] text-[#9A6B38] uppercase dark:text-[#D8B07A]">
                    Lokasi &amp; Layanan Chat WA
                  </p>
                  <h2 className="mt-2 font-display text-3xl leading-tight font-medium text-[#141210] sm:text-5xl dark:text-[#F7F3EC]">
                    Singgah atau <span className="italic text-[#9A6B38] dark:text-[#D8B07A]">Pesan dari Kos</span>
                  </h2>
                  <p className="mt-3.5 text-sm leading-relaxed text-[#574F46] sm:mt-4 sm:text-base dark:text-[#CFC6B8]">
                    Berlokasi strategis dekat Pakuwon Mall &amp; Seturan, Depok, Sleman. Pesan
                    duluan lewat WhatsApp agar hidangan siap hangat tepat saat kamu tiba.
                  </p>

                  <div className="mt-6 space-y-2.5 border-y border-[#141210]/10 py-5 text-sm text-[#574F46] dark:border-[#D8B07A]/16 dark:text-[#CFC6B8]">
                    <p className="flex items-start gap-2.5">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#9A6B38] dark:text-[#D8B07A]"
                        aria-hidden="true"
                      />
                      <span>
                        {STORE_INFO.address}{' '}
                        <span className="text-xs text-[#73695E] tabular-nums dark:text-[#9D9488]">
                          ({STORE_INFO.coordinates})
                        </span>
                      </span>
                    </p>
                    <p className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 shrink-0 text-[#9A6B38] dark:text-[#D8B07A]" aria-hidden="true" />
                      <span>{STORE_INFO.hours}</span>
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
                    <MagneticWrap strength={5}>
                      <a
                        href={STORE_INFO.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="google-maps-link"
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#141210] px-5 py-2.5 text-sm font-semibold text-[#F7F3EC] hover:bg-[#2A2520] whitespace-nowrap sm:min-h-[48px] sm:px-6 dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
                      >
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span>Buka Google Maps</span>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </MagneticWrap>

                    <button
                      type="button"
                      onClick={() => setCartOpen(true)}
                      className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[#141210]/18 px-5 py-2.5 text-sm font-semibold text-[#141210] hover:border-[#141210] hover:bg-[#ECE6DC] whitespace-nowrap cursor-pointer sm:min-h-[48px] sm:px-6 dark:border-[#D8B07A]/34 dark:text-[#F7F3EC] dark:hover:border-[#D8B07A] dark:hover:bg-[#1E1A16] dark:hover:text-[#E8C696]"
                    >
                      <MessageCircle className="h-4 w-4 text-[#9A6B38] dark:text-[#D8B07A]" aria-hidden="true" />
                      <span>Buka Keranjang WA</span>
                    </button>
                  </div>
                </div>
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* ============================================================
            MINIMAL LUXURY FOOTER (EXTRA BOTTOM SAFE-PADDING FOR STICKY CART)
           ============================================================ */}
        <footer className="border-t border-[#141210]/10 bg-[#ECE6DC] pt-12 pb-32 text-[#574F46] lg:pb-16 dark:border-[#D8B07A]/14 dark:bg-[#080706] dark:text-[#9D9488]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center md:gap-8 lg:px-8">
            <div className="flex items-center gap-3">
              <BrandEmblem className="h-9 w-9 shrink-0" />
              <div>
                <p className="font-display text-2xl font-semibold text-[#141210] dark:text-[#F7F3EC]">
                  {STORE_INFO.name}
                </p>
                <p className="text-xs">{STORE_INFO.address}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => scrollToSection('studio-3d')}
                className="hover:text-[#141210] cursor-pointer dark:hover:text-[#D8B07A]"
              >
                Studio 3D
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('menu')}
                className="hover:text-[#141210] cursor-pointer dark:hover:text-[#D8B07A]"
              >
                Katalog Menu
              </button>
              <a
                href={STORE_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#141210] dark:hover:text-[#D8B07A]"
              >
                Google Maps
              </a>
              <span className="tabular-nums">© 2026 {STORE_INFO.name}</span>
            </div>
          </div>
        </footer>

        {/* ============================================================
            FLOATING STICKY CART BAR (DUAL-THEME)
           ============================================================ */}
        <AnimatePresence>
          {totalItems > 0 && !cartOpen && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.94 }}
              transition={{ duration: 0.4, ease: SPRING_POP_EASE }}
              className="fixed right-3 bottom-[98px] left-3 z-30 mx-auto max-w-md lg:right-6 lg:bottom-6 lg:left-auto lg:w-auto"
            >
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                data-testid="floating-cart-bar"
                className="flex min-h-[54px] w-full items-center justify-between gap-4 rounded-full border border-[#141210]/14 bg-white px-4 py-2.5 text-[#141210] shadow-[0_20px_46px_-14px_rgba(20,18,16,0.28)] hover:bg-[#FAF8F4] cursor-pointer sm:min-h-[56px] sm:gap-5 sm:px-5 sm:py-3 dark:border-[#D8B07A]/40 dark:bg-[#141210] dark:text-[#F7F3EC] dark:shadow-[0_22px_50px_-14px_rgba(0,0,0,0.75)] dark:hover:bg-[#1F1B17]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 min-w-[32px] shrink-0 items-center justify-center rounded-full bg-[#141210] px-2 text-xs font-bold text-[#F7F3EC] tabular-nums dark:bg-[#D8B07A] dark:text-[#0A0908]">
                    {totalItems}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-[11px] text-[#73695E] dark:text-[#CFC6B8]">
                      Pesanan WhatsApp
                    </span>
                    <span className="block text-sm font-bold text-[#141210] tabular-nums dark:text-[#E8C696]">
                      <AnimatedNumber value={subtotal} durationMs={400} format={formatRupiah} />
                    </span>
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#141210] px-4 py-2 text-xs font-semibold text-[#F7F3EC] whitespace-nowrap dark:bg-[#D8B07A] dark:text-[#0A0908]">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Checkout</span>
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            FLOATING PILL SPRING TOAST WITH UNDO (DUAL-THEME & NON-OVERLAPPING)
           ============================================================ */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              role="status"
              aria-live="polite"
              data-testid="motion-pill-toast"
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.92 }}
              transition={{ duration: 0.4, ease: SPRING_POP_EASE }}
              className={`fixed left-1/2 z-50 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2.5 rounded-full border border-[#141210]/14 bg-white px-4 py-2.5 text-xs font-semibold text-[#141210] shadow-[0_18px_42px_-12px_rgba(20,18,16,0.28)] sm:gap-3 lg:bottom-8 dark:border-[#D8B07A]/35 dark:bg-[#141210] dark:text-[#F7F3EC] dark:shadow-[0_18px_42px_-12px_rgba(0,0,0,0.72)] ${
                totalItems > 0 ? 'bottom-[166px]' : 'bottom-[100px]'
              }`}
            >
              <span className="truncate">{toast.message}</span>
              {toast.undoSnapshot && (
                <button
                  type="button"
                  onClick={handleUndoToast}
                  data-testid="toast-undo-button"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ECE6DC] px-3 py-1 text-[11px] font-bold text-[#141210] hover:bg-[#141210] hover:text-[#F7F3EC] whitespace-nowrap cursor-pointer dark:bg-[#D8B07A]/20 dark:text-[#E8C696] dark:hover:bg-[#D8B07A] dark:hover:text-[#0A0908]"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Urungkan</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            SPRING BACK-TO-TOP FLOATING BUTTON (DUAL-THEME)
           ============================================================ */}
        <AnimatePresence>
          {showBackToTop && !cartOpen && (
            <motion.button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              initial={{ opacity: 0, scale: 0.72, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.72, y: 16 }}
              transition={{ duration: 0.34, ease: SPRING_POP_EASE }}
              aria-label="Kembali ke atas"
              className={`fixed right-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#141210]/16 bg-white text-[#141210] shadow-lg hover:bg-[#141210] hover:text-[#F7F3EC] cursor-pointer lg:right-6 dark:border-[#D8B07A]/35 dark:bg-[#141210] dark:text-[#E8C696] dark:hover:bg-[#D8B07A] dark:hover:text-[#0A0908] ${
                totalItems > 0 ? 'bottom-[166px] lg:bottom-24' : 'bottom-[100px] lg:bottom-6'
              }`}
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Product Customization Modal */}
        <ProductModal
          product={customizingProduct}
          defaultSpice={defaultSpice}
          onClose={() => setCustomizingProduct(null)}
          onConfirmAdd={handleConfirmCustomAdd}
        />

        {/* WhatsApp Cart & Checkout Drawer */}
        <CartDrawer
          open={cartOpen}
          items={cart}
          form={checkoutForm}
          onFormChange={setCheckoutForm}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onClose={() => setCartOpen(false)}
        />
      </div>
    </MotionConfig>
  );
}
