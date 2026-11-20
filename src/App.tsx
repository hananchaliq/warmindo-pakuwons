import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Clock,
  Coffee,
  Flame,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Soup,
  UtensilsCrossed,
  X,
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
import { HeroEmberCanvas } from './three/HeroEmberCanvas';
import { CulinaryShowcase3D, type DishModelId } from './three/CulinaryShowcase3D';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import {
  BrandEmblem,
  GoldLeafOrnament,
  LUXURY_EASE,
  RevealBlock,
  ScrollProgressLine,
} from './components/MotionPrimitives';

const CART_STORAGE_KEY = 'warmindo_pakuwons_cart_v1';

function loadInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Filter & Hero quick-order state
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [preferredSpice, setPreferredSpice] = useState<SpiceLevel>('Sedang');
  const [heroCategory, setHeroCategory] = useState<ProductCategory>('all');
  const [heroSpice, setHeroSpice] = useState<SpiceLevel>('Sedang');
  const [heroMethod, setHeroMethod] = useState<OrderMethod>('Makan di Tempat');

  // 3D Culinary Showcase state
  const [active3dDish, setActive3dDish] = useState<DishModelId>('nyemek');

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    customerName: '',
    orderMethod: 'Makan di Tempat',
    tableNumber: '',
    deliveryAddress: '',
    generalNote: '',
    whatsappTarget: STORE_INFO.defaultWhatsapp,
  });

  // Subtle non-blocking feedback banner when adding items
  const [addedBanner, setAddedBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota issues
    }
  }, [cart]);

  useEffect(() => {
    if (!addedBanner) return;
    const timer = window.setTimeout(() => setAddedBanner(null), 2600);
    return () => window.clearTimeout(timer);
  }, [addedBanner]);

  const { totalItems, subtotal } = useMemo(() => computeCartTotals(cart), [cart]);

  const quantityByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.productId] = (map[item.productId] ?? 0) + item.quantity;
    }
    return map;
  }, [cart]);

  const filteredProducts = useMemo(
    () =>
      filterProducts(PRODUCTS, {
        category: activeCategory,
        query: searchQuery,
      }),
    [activeCategory, searchQuery],
  );

  const activeShowcaseMeta = useMemo(
    () => SHOWCASE_DISHES.find((d) => d.id === active3dDish) ?? SHOWCASE_DISHES[0],
    [active3dDish],
  );

  const activeShowcaseProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === activeShowcaseMeta.productId) ?? PRODUCTS[0],
    [activeShowcaseMeta],
  );

  const handleQuickAdd = (product: Product) => {
    setCart((prev) =>
      addOrMergeCartItem(prev, {
        product,
        spiceLevel: product.supportsSpice ? preferredSpice : undefined,
      }),
    );
    setAddedBanner(`${product.name} masuk ke keranjang`);
  };

  const handleConfirmCustomAdd = (payload: {
    product: Product;
    spiceLevel?: SpiceLevel;
    toppings: ToppingOption[];
    note: string;
    quantity: number;
  }) => {
    setCart((prev) => addOrMergeCartItem(prev, payload));
    setAddedBanner(`${payload.product.name} (${payload.quantity}x) masuk ke keranjang`);
  };

  const handleQuickHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCategory(heroCategory);
    setPreferredSpice(heroSpice);
    setCheckoutForm((prev) => ({ ...prev, orderMethod: heroMethod }));
    const menuEl = document.getElementById('menu');
    menuEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5EFE4] text-[#14241C]">
      <ScrollProgressLine />
      <Navbar totalItems={totalItems} onOpenCart={() => setCartOpen(true)} />

      <main>
        {/* ============================================================
            1. HERO SECTION — Full-bleed Dusk Warmindo + Three.js Embers + Quick Order Bar
           ============================================================ */}
        <section
          id="beranda"
          className={`relative flex min-h-[92vh] flex-col justify-between overflow-hidden bg-[#0E221A] pt-20 text-[#F8F4EC] sm:min-h-[820px] sm:pt-28 sm:pb-12 ${
            totalItems > 0 ? 'pb-22' : 'pb-10'
          }`}
        >
          {/* Full-bleed architectural warmindo photography */}
          <div className="absolute inset-0 z-0">
            <img
              src={HERO_IMAGE}
              alt="Suasana malam Warmindo Pakuwon's di kawasan Depok, Sleman, Yogyakarta"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center"
            />
            {/* Measured multi-stop dark emerald scrim ensuring >= 4.5:1 text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1C15]/92 via-[#0E221A]/68 to-[#0E221A]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E221A] via-transparent to-[#0E221A]/45" />
          </div>

          {/* Interactive Three.js WebGL ambient golden embers & steam ribbons */}
          <HeroEmberCanvas />

          {/* Hero Main Copy */}
          <div className="relative z-20 mx-auto my-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: LUXURY_EASE }}
              className="max-w-xl"
            >
              <p className="text-xs font-medium tracking-[0.18em] text-[#E6BC7B] sm:text-sm">
                Depok · Sleman · Yogyakarta
              </p>

              <h1
                className="mt-3 font-display font-medium leading-[1.06] tracking-tight text-[#F8F4EC]"
                style={{
                  fontSize: 'clamp(2.6rem, 5.4vw, 4.5rem)',
                  textWrap: 'balance',
                }}
              >
                Hangatnya Rasa{' '}
                <span className="block">
                  Warung <em className="font-normal italic text-[#E6BC7B]">Istimewa</em>
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#F5EFE4]/85 sm:text-base">
                {STORE_INFO.tagline} Racikan Indomie nyemek, magelangan smokey, camilan hangat,
                dan kopi susu gula aren — pesan praktis langsung lewat chat WhatsApp.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <a
                  href="#menu"
                  className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full bg-[#E6BC7B] px-6 py-3 text-sm font-semibold text-[#0E221A] transition-all duration-200 hover:bg-[#F0CC92] active:scale-[0.98] whitespace-nowrap"
                >
                  <span>Jelajahi Menu</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <a
                  href="#studio-3d"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#F5EFE4]/30 bg-[#0E221A]/55 px-5 py-3 text-sm font-medium text-[#F8F4EC] transition-colors hover:border-[#E6BC7B] hover:text-[#E6BC7B] whitespace-nowrap"
                >
                  <span>Inspeksi Hidangan 3D</span>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Floating Dark-Emerald Quick Order & Filter Bar (echoing The Amberleaf booking bar) */}
          <div className="relative z-20 mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.form
              onSubmit={handleQuickHeroSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15, ease: LUXURY_EASE }}
              className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E6BC7B]/20 bg-[#0E221A]/94 p-3.5 shadow-2xl sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:gap-0 lg:rounded-full lg:px-5 lg:py-3"
            >
              <div className="flex flex-col px-2 lg:border-r lg:border-[#F5EFE4]/12 lg:px-4">
                <label
                  htmlFor="hero-category"
                  className="text-[11px] font-medium text-[#E6BC7B]/90"
                >
                  Kategori Menu
                </label>
                <select
                  id="hero-category"
                  value={heroCategory}
                  onChange={(e) => setHeroCategory(e.target.value as ProductCategory)}
                  className="mt-0.5 min-h-[36px] bg-transparent text-sm font-semibold text-[#F8F4EC] focus:outline-none cursor-pointer"
                >
                  {CATEGORY_TABS.map((tab) => (
                    <option key={tab.id} value={tab.id} className="bg-[#0E221A] text-[#F8F4EC]">
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col px-2 lg:border-r lg:border-[#F5EFE4]/12 lg:px-4">
                <label
                  htmlFor="hero-spice"
                  className="text-[11px] font-medium text-[#E6BC7B]/90"
                >
                  Level Pedas Default
                </label>
                <select
                  id="hero-spice"
                  value={heroSpice}
                  onChange={(e) => setHeroSpice(e.target.value as SpiceLevel)}
                  className="mt-0.5 min-h-[36px] bg-transparent text-sm font-semibold text-[#F8F4EC] focus:outline-none cursor-pointer"
                >
                  {SPICE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-[#0E221A] text-[#F8F4EC]">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col px-2 lg:px-4">
                <label
                  htmlFor="hero-method"
                  className="text-[11px] font-medium text-[#E6BC7B]/90"
                >
                  Cara Pesan
                </label>
                <select
                  id="hero-method"
                  value={heroMethod}
                  onChange={(e) => setHeroMethod(e.target.value as OrderMethod)}
                  className="mt-0.5 min-h-[36px] bg-transparent text-sm font-semibold text-[#F8F4EC] focus:outline-none cursor-pointer"
                >
                  {ORDER_METHODS.map((m) => (
                    <option key={m} value={m} className="bg-[#0E221A] text-[#F8F4EC]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:pl-3">
                <button
                  type="submit"
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#E6BC7B] px-6 py-2.5 text-sm font-semibold text-[#0E221A] transition-colors hover:bg-[#F0CC92] whitespace-nowrap cursor-pointer"
                >
                  <span>Lihat Pilihan</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.form>
          </div>
        </section>

        {/* ============================================================
            2. FOUR-PILLAR FEATURE STRIP (Warm Ivory, matching reference)
           ============================================================ */}
        <section
          aria-label="Keunggulan Warmindo Pakuwon's"
          className="border-b border-[#14241C]/8 bg-[#F5EFE4] py-9 sm:py-11"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8">
            {[
              {
                icon: Soup,
                title: 'Indomie Racikan Wajan',
                desc: 'Bumbu rempah ulek & telur lumer',
              },
              {
                icon: Flame,
                title: 'Magelangan Smokey',
                desc: 'Porsi kenyang khas malam Jogja',
              },
              {
                icon: Coffee,
                title: 'Kopi Aren & Teh Melati',
                desc: 'Seduhan segar teman nongkrong',
              },
              {
                icon: MessageCircle,
                title: 'Order Cepat via WA',
                desc: 'Otomatis terformat, tanpa antre',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealBlock key={item.title} delay={idx * 0.06} yOffset={12}>
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#14241C]/12 bg-[#FAF7F0] text-[#0E221A]">
                      <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-sans text-sm font-semibold text-[#14241C]">
                        {item.title}
                      </h2>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#515F56]">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </RevealBlock>
              );
            })}
          </div>
        </section>

        {/* ============================================================
            3. CERITA KAMI — Arched Editorial Story Section (Warm Ivory)
           ============================================================ */}
        <section
          id="cerita"
          className="relative overflow-hidden bg-[#F5EFE4] py-16 sm:py-24"
        >
          <GoldLeafOrnament className="pointer-events-none absolute top-10 -left-10 h-56 w-56 text-[#C59143]/28" />
          <GoldLeafOrnament className="pointer-events-none absolute -right-10 bottom-8 h-60 w-60 rotate-180 text-[#C59143]/22" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8">
            {/* Arched editorial photograph (signature silhouette from reference) */}
            <RevealBlock className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div className="arch-frame overflow-hidden border border-[#14241C]/10 bg-[#E9DEC9] shadow-[0_24px_50px_-24px_rgba(14,34,26,0.28)]">
                  <img
                    src={STORY_IMAGE}
                    alt="Proses memasak mie nyemek di wajan panas Warmindo Pakuwon's"
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              </div>
            </RevealBlock>

            {/* Editorial narrative */}
            <RevealBlock delay={0.1} className="lg:col-span-6">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9E6B24]">
                Cerita Kami
              </p>
              <h2
                className="mt-2.5 font-display text-3xl font-medium leading-tight text-[#14241C] sm:text-4xl lg:text-[2.75rem]"
                style={{ textWrap: 'balance' }}
              >
                Tempat Hangat Penuh <em className="italic text-[#B57F32]">Cerita</em>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#515F56] sm:text-base">
                Berlokasi di kawasan strategis dekat Pakuwon Mall & Seturan, Depok, Sleman,{' '}
                <strong className="font-semibold text-[#14241C]">{STORE_INFO.name}</strong> hadir
                dari gagasan sederhana: menyajikan kehangatan warung Indomie khas Yogyakarta
                dengan racikan bumbu jujur, kebersihan dapur terjaga, dan kenyamanan ruang
                singgah hingga dini hari.
              </p>

              <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-[#515F56] sm:text-base">
                Baik untuk makan malam santai sepulang kuliah, lembur tugas, maupun pesan antar
                cepat ke kos sekitar Pakuwon — setiap porsi dimasak segar satu per satu di atas
                wajan panas saat pesanan Anda masuk.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#14241C]/10 pt-5 text-xs font-medium text-[#515F56] sm:text-sm">
                <span className="inline-flex items-center gap-1.5 text-[#14241C]">
                  <Clock className="h-4 w-4 text-[#9E6B24]" aria-hidden="true" />
                  {STORE_INFO.hours}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#9E6B24]" aria-hidden="true" />
                  Depok, Sleman, Yogyakarta
                </span>
              </div>

              <div className="mt-7">
                <a
                  href={STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 font-sans text-sm font-semibold text-[#0E221A] underline decoration-[#C59143] decoration-2 underline-offset-4 transition-colors hover:text-[#9E6B24]"
                >
                  <span>Buka Lokasi di Google Maps</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* ============================================================
            4. THREE.JS 3D CULINARY STUDIO (Deep Forest Emerald Band)
               Echoes The Amberleaf's "A Culinary Journey" dark emerald band
           ============================================================ */}
        <section
          id="studio-3d"
          className="relative overflow-hidden bg-[#0E221A] py-16 text-[#F8F4EC] sm:py-24"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
            {/* Left narrative + interactive 3D dish switcher */}
            <div className="lg:col-span-5">
              <RevealBlock>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#E6BC7B]">
                  Karya Dapur 3D Interaktif
                </p>
                <h2
                  className="mt-2.5 font-display text-3xl font-medium leading-tight text-[#F8F4EC] sm:text-4xl lg:text-[2.75rem]"
                  style={{ textWrap: 'balance' }}
                >
                  Perjalanan <em className="italic text-[#E6BC7B]">Cita Rasa</em>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#F5EFE4]/80 sm:text-base">
                  Putar dan amati komposisi tiga menu paling dicari di Warmindo Pakuwon&apos;s
                  dalam tampilan 3D interaktif sebelum memasukkannya ke keranjang WhatsApp Anda.
                </p>

                {/* Dish switcher tabs */}
                <div
                  className="mt-6 flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Pilih model hidangan 3D"
                >
                  {SHOWCASE_DISHES.map((dish) => {
                    const active = active3dDish === dish.id;
                    return (
                      <button
                        key={dish.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActive3dDish(dish.id)}
                        className={`min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#E6BC7B] text-[#0E221A]'
                            : 'border border-[#F5EFE4]/20 bg-[#152E24] text-[#F5EFE4]/85 hover:border-[#E6BC7B]/60 hover:text-[#E6BC7B]'
                        }`}
                      >
                        {dish.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Dish Live Details */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeShowcaseProduct.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: LUXURY_EASE }}
                    className="mt-7 border-t border-[#F5EFE4]/12 pt-6"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-2xl font-semibold text-[#F8F4EC]">
                        {activeShowcaseProduct.name}
                      </h3>
                      <span className="text-lg font-bold text-[#E6BC7B] tabular-nums whitespace-nowrap">
                        {formatRupiah(activeShowcaseProduct.price)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-[#F5EFE4]/78">
                      {activeShowcaseMeta.subtitle}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#E6BC7B]/90">
                      {activeShowcaseMeta.tastingNotes.map((note, i) => (
                        <span key={note} className="inline-flex items-center gap-2">
                          {i > 0 && <span aria-hidden="true">·</span>}
                          <span>{note}</span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(activeShowcaseProduct)}
                        className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#E6BC7B] px-6 py-2.5 text-sm font-semibold text-[#0E221A] transition-colors hover:bg-[#F0CC92] whitespace-nowrap cursor-pointer"
                      >
                        <span>Tambah Menu Ini</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {(activeShowcaseProduct.supportsSpice ||
                        activeShowcaseProduct.supportsToppings) && (
                        <button
                          type="button"
                          onClick={() => setCustomizingProduct(activeShowcaseProduct)}
                          className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[#F5EFE4]/25 px-5 py-2.5 text-sm font-medium text-[#F8F4EC] transition-colors hover:border-[#E6BC7B] hover:text-[#E6BC7B] whitespace-nowrap cursor-pointer"
                        >
                          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                          <span>Atur Topping</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </RevealBlock>
            </div>

            {/* Right Interactive Three.js 3D Viewport */}
            <div className="lg:col-span-7">
              <CulinaryShowcase3D
                activeDish={active3dDish}
                onSelectDish={setActive3dDish}
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            5. KATALOG PRODUK & BELANJA VIA WA (Warm Ivory Collection Grid)
               Echoes The Amberleaf's "Thoughtfully Designed Stays" card grid
           ============================================================ */}
        <section id="menu" className="bg-[#F5EFE4] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section heading + Search input */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <RevealBlock>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#9E6B24]">
                  Katalog Warung
                </p>
                <h2
                  className="mt-2 font-display text-3xl font-medium leading-tight text-[#14241C] sm:text-4xl lg:text-[2.75rem]"
                  style={{ textWrap: 'balance' }}
                >
                  Menu Pilihan <em className="italic text-[#B57F32]">Siap Masak</em>
                </h2>
              </RevealBlock>

              {/* Search bar */}
              <div className="relative w-full md:max-w-xs">
                <label htmlFor="menu-search" className="sr-only">
                  Cari menu Warmindo Pakuwon&apos;s
                </label>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#515F56]"
                  aria-hidden="true"
                />
                <input
                  id="menu-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari mie, magelangan, kopi..."
                  className="min-h-[44px] w-full rounded-full border border-[#14241C]/15 bg-[#FAF7F0] pr-10 pl-10 text-sm text-[#14241C] placeholder:text-[#515F56]/70 focus:border-[#0E221A] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Hapus pencarian"
                    className="absolute top-1/2 right-2.5 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#515F56] hover:bg-[#E9DEC9] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category filter tabs (horizontal touch scroll on mobile) */}
            <div
              className="no-scrollbar mt-7 flex items-center gap-2 overflow-x-auto pb-2"
              role="tablist"
              aria-label="Filter kategori menu"
            >
              {CATEGORY_TABS.map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`relative min-h-[44px] rounded-full px-4.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer sm:text-sm ${
                      active
                        ? 'bg-[#0E221A] text-[#E6BC7B]'
                        : 'border border-[#14241C]/12 bg-[#FAF7F0] text-[#14241C] hover:border-[#14241C]/35 hover:bg-[#EFE7D8]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div
                data-testid="product-grid"
                className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={quantityByProductId[product.id] ?? 0}
                    onQuickAdd={handleQuickAdd}
                    onCustomize={setCustomizingProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-[#14241C]/10 bg-[#FAF7F0] px-6 py-12 text-center">
                <UtensilsCrossed
                  className="mx-auto h-9 w-9 text-[#9E6B24]"
                  aria-hidden="true"
                />
                <h3 className="mt-3 font-display text-xl font-semibold text-[#14241C]">
                  Menu Tidak Ditemukan
                </h3>
                <p className="mt-1.5 text-sm text-[#515F56]">
                  Tidak ada menu yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#0E221A] px-5 py-2 text-xs font-semibold text-[#E6BC7B] hover:bg-[#193A2D] cursor-pointer"
                >
                  Tampilkan Semua Menu
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            6. SUASANA & LOKASI — Panoramic Dusk Experience Banner
               Echoes The Amberleaf's "More Than a Stay" banner
           ============================================================ */}
        <section
          id="lokasi"
          className="relative overflow-hidden bg-[#0E221A] py-20 text-[#F8F4EC] sm:py-28"
        >
          <div className="absolute inset-0">
            <img
              src={EXPERIENCE_IMAGE}
              alt="Suasana sore menuju malam di teras Warmindo Pakuwon's Sleman"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E221A]/92 via-[#0E221A]/65 to-[#0E221A]/55" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <RevealBlock>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#E6BC7B]">
                Kunjungi atau Pesan Langsung
              </p>
              <h2
                className="mt-3 font-display text-3xl font-medium leading-tight text-[#F8F4EC] sm:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                Lebih dari Sekadar <em className="italic text-[#E6BC7B]">Warmindo</em>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#F5EFE4]/88 sm:text-base">
                Mampir bersama teman di kawasan Pakuwon Mall & Seturan, Depok, Sleman, atau
                kirim pesanan Anda lebih dulu lewat WhatsApp agar hidangan siap hangat begitu Anda
                tiba.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium text-[#E6BC7B] sm:text-sm">
                <span>{STORE_INFO.address}</span>
                <span aria-hidden="true">·</span>
                <span>{STORE_INFO.hours}</span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <a
                  href={STORE_INFO.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#E6BC7B] px-6 py-3 text-sm font-semibold text-[#0E221A] transition-colors hover:bg-[#F0CC92] whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>Petunjuk Arah Google Maps</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-[#F5EFE4]/35 bg-[#0E221A]/65 px-6 py-3 text-sm font-semibold text-[#F8F4EC] transition-colors hover:border-[#E6BC7B] hover:text-[#E6BC7B] whitespace-nowrap cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4 text-[#E6BC7B]" aria-hidden="true" />
                  <span>Buka Keranjang WA</span>
                </button>
              </div>
            </RevealBlock>
          </div>
        </section>
      </main>

      {/* ============================================================
          7. FOOTER (Deep Forest Emerald, matching reference)
         ============================================================ */}
      <footer className="relative overflow-hidden border-t border-[#E6BC7B]/15 bg-[#0B1B14] pt-14 pb-24 text-[#F5EFE4] sm:pb-14">
        <GoldLeafOrnament className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 text-[#E6BC7B]/18" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            {/* Brand */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5">
                <BrandEmblem className="h-8 w-8" />
                <span className="font-display text-2xl font-semibold text-[#F8F4EC]">
                  {STORE_INFO.name}
                </span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#F5EFE4]/72">
                {STORE_INFO.tagline} Hidangan hangat dimasak dadakan dengan pemesanan praktis
                langsung melalui WhatsApp.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3">
              <h3 className="font-sans text-xs font-semibold tracking-[0.14em] text-[#E6BC7B]">
                Navigasi
              </h3>
              <ul className="mt-3.5 space-y-2.5 text-sm text-[#F5EFE4]/78">
                <li>
                  <a href="#beranda" className="hover:text-[#E6BC7B] transition-colors">
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="#menu" className="hover:text-[#E6BC7B] transition-colors">
                    Katalog Menu
                  </a>
                </li>
                <li>
                  <a href="#studio-3d" className="hover:text-[#E6BC7B] transition-colors">
                    Studio Hidangan 3D
                  </a>
                </li>
                <li>
                  <a href="#cerita" className="hover:text-[#E6BC7B] transition-colors">
                    Cerita Kami
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Maps */}
            <div className="md:col-span-4">
              <h3 className="font-sans text-xs font-semibold tracking-[0.14em] text-[#E6BC7B]">
                Lokasi & Layanan
              </h3>
              <ul className="mt-3.5 space-y-2.5 text-sm text-[#F5EFE4]/78">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E6BC7B]" aria-hidden="true" />
                  <span>{STORE_INFO.address}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#E6BC7B]" aria-hidden="true" />
                  <span>{STORE_INFO.hours}</span>
                </li>
                <li>
                  <a
                    href={STORE_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[#E6BC7B] hover:underline"
                  >
                    <span>Lihat Titik Google Maps</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#F5EFE4]/10 pt-6 text-xs text-[#F5EFE4]/55 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} {STORE_INFO.name}. Seluruh hak cipta dilindungi.</p>
            <p className="tabular-nums">Koordinat {STORE_INFO.coordinates} · Sleman, DIY</p>
          </div>
        </div>
      </footer>

      {/* ============================================================
          MOBILE-FIRST COMPACT STICKY CART BAR (<= 8% viewport height)
         ============================================================ */}
      <AnimatePresence>
        {totalItems > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.28, ease: LUXURY_EASE }}
            className="fixed right-3 bottom-3 left-3 z-30 mx-auto max-w-xl md:right-6 md:bottom-5 md:left-auto md:w-auto"
          >
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              data-testid="floating-cart-bar"
              className="flex h-[52px] w-full items-center justify-between gap-3 rounded-full border border-[#E6BC7B]/30 bg-[#0E221A] px-4 text-[#F8F4EC] shadow-[0_18px_40px_-10px_rgba(14,34,26,0.55)] transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer md:h-[58px] md:min-w-[320px] md:px-5"
            >
              <span className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6BC7B] text-[#0E221A] sm:h-9 sm:w-9">
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-left">
                  <span className="block text-[11px] leading-tight text-[#E6BC7B] tabular-nums">
                    {totalItems} item di keranjang
                  </span>
                  <span className="block text-sm font-bold leading-tight tabular-nums">
                    {formatRupiah(subtotal)}
                  </span>
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6BC7B] px-3.5 py-1.5 text-xs font-bold text-[#0E221A] whitespace-nowrap sm:px-4 sm:py-2">
                <span>Pesan WA</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Non-blocking subtle feedback toast */}
      <AnimatePresence>
        {addedBanner && !cartOpen && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 z-40 flex items-center gap-3 rounded-full border border-[#E6BC7B]/35 bg-[#0E221A] px-4 py-2.5 text-xs font-medium text-[#F8F4EC] shadow-lg sm:right-6"
          >
            <span>{addedBanner}</span>
            <button
              type="button"
              onClick={() => {
                setAddedBanner(null);
                setCartOpen(true);
              }}
              className="font-bold text-[#E6BC7B] underline cursor-pointer"
            >
              Lihat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Customization Modal */}
      <ProductModal
        product={customizingProduct}
        defaultSpice={preferredSpice}
        onClose={() => setCustomizingProduct(null)}
        onConfirmAdd={handleConfirmCustomAdd}
      />

      {/* WhatsApp Cart & Checkout Drawer */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        form={checkoutForm}
        onFormChange={setCheckoutForm}
        onUpdateQty={(key, delta) => setCart((prev) => updateCartItemQuantity(prev, key, delta))}
        onRemoveItem={(key) => setCart((prev) => removeCartItem(prev, key))}
        onClearCart={() => setCart([])}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
}
