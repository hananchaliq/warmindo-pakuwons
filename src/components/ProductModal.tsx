import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Minus, Plus, X } from 'lucide-react';
import {
  SPICE_LEVELS,
  TOPPING_OPTIONS,
  type Product,
  type SpiceLevel,
  type ToppingOption,
} from '../data/menu';
import { formatRupiah } from '../utils/orderLogic';
import { AnimatedNumber } from './AnimatedNumber';
import { SlidingPillNav, type PillNavItem } from './SlidingPillNav';
import { FLUID_EASE, SPRING_POP_EASE } from './MotionPrimitives';

interface ProductModalProps {
  product: Product | null;
  defaultSpice: SpiceLevel;
  onClose: () => void;
  onConfirmAdd: (payload: {
    product: Product;
    spiceLevel?: SpiceLevel;
    toppings: ToppingOption[];
    note: string;
    quantity: number;
  }) => void;
}

export function ProductModal({
  product,
  defaultSpice,
  onClose,
  onConfirmAdd,
}: ProductModalProps) {
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>(defaultSpice);
  const [selectedToppings, setSelectedToppings] = useState<ToppingOption[]>([]);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  const spicePillItems = useMemo<PillNavItem<SpiceLevel>[]>(
    () => SPICE_LEVELS.map((lvl) => ({ id: lvl, label: lvl })),
    [],
  );

  useEffect(() => {
    if (product) {
      setSpiceLevel(defaultSpice);
      setSelectedToppings([]);
      setNote('');
      setQuantity(1);
    }
  }, [product, defaultSpice]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  const toggleTopping = (topping: ToppingOption) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping],
    );
  };

  const unitPrice = product
    ? product.price + selectedToppings.reduce((sum, t) => sum + t.price, 0)
    : 0;
  const lineTotal = unitPrice * quantity;

  return (
    <AnimatePresence>
      {product && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050404]/78"
          />

          {/* Spring Pop Modal */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.78 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.88 }}
            transition={{ duration: 0.45, ease: SPRING_POP_EASE }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-[#141210]/14 bg-[#FAF8F4] text-[#141210] shadow-2xl sm:rounded-[28px] dark:border-[#D8B07A]/22 dark:bg-[#12100E] dark:text-[#F7F3EC]"
          >
            {/* Header image + close */}
            <div className="relative h-48 w-full shrink-0 overflow-hidden bg-[#141210] sm:h-52">
              <motion.img
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.55, ease: FLUID_EASE }}
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0908]/92 via-[#0A0908]/30 to-transparent" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup jendela kustomisasi menu"
                className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0A0908]/85 text-[#F7F3EC] hover:border-[#D8B07A] hover:text-[#D8B07A] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute right-5 bottom-4 left-5 text-[#F7F3EC]">
                <p className="text-xs font-medium text-[#D8B07A]">
                  {product.categoryLabel} · {product.prepMinutes} menit masak
                </p>
                <h3 id="product-modal-title" className="font-display text-2xl font-semibold">
                  {product.name}
                </h3>
              </div>
            </div>

            {/* Scrollable options */}
            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-sm leading-relaxed text-[#574F46] dark:text-[#B5AC9E]">
                {product.fullDesc}
              </p>

              {/* Elastic Sliding Pill Spice selector */}
              {product.supportsSpice && (
                <div>
                  <label className="block text-sm font-semibold text-[#141210] dark:text-[#F7F3EC]">
                    Tingkat Kepedasan
                  </label>
                  <div className="mt-2.5 w-full">
                    <SlidingPillNav
                      items={spicePillItems}
                      activeId={spiceLevel}
                      onSelect={(lvl) => setSpiceLevel(lvl)}
                      ariaLabel="Pilih tingkat kepedasan"
                      variant="compact-surface"
                      fullWidth
                      testId="modal-spice-pill-nav"
                    />
                  </div>
                </div>
              )}

              {/* Extra toppings */}
              {product.supportsToppings && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-[#141210] dark:text-[#F7F3EC]">
                      Topping Tambahan
                    </span>
                    <span className="text-xs text-[#73695E] dark:text-[#9D9488]">
                      {selectedToppings.length > 0
                        ? `${selectedToppings.length} dipilih`
                        : 'Opsional'}
                    </span>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {TOPPING_OPTIONS.map((topping, idx) => {
                      const checked = selectedToppings.some((t) => t.id === topping.id);
                      return (
                        <button
                          key={topping.id}
                          type="button"
                          onClick={() => toggleTopping(topping)}
                          aria-pressed={checked}
                          style={{ '--i': idx } as CSSProperties}
                          className={`spotlight-card stagger-blur-item flex min-h-[46px] w-full items-center justify-between rounded-[18px] border px-3.5 py-2.5 text-left cursor-pointer ${
                            checked
                              ? 'border-[#141210] bg-[#141210]/6 dark:border-[#D8B07A]/60 dark:bg-[#221C16]'
                              : 'border-[#141210]/12 bg-white hover:border-[#141210]/30 dark:border-[#D8B07A]/14 dark:bg-[#181512] dark:hover:border-[#D8B07A]/35'
                          }`}
                        >
                          <span className="flex items-center gap-3 text-sm font-medium text-[#141210] dark:text-[#F7F3EC]">
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                                checked
                                  ? 'border-[#141210] bg-[#141210] text-[#E8C696] dark:border-[#D8B07A] dark:bg-[#D8B07A] dark:text-[#0A0908]'
                                  : 'border-[#141210]/25 bg-white dark:border-[#D8B07A]/30 dark:bg-[#100E0C]'
                              }`}
                            >
                              <AnimatePresence initial={false}>
                                {checked && (
                                  <motion.span
                                    initial={{ scale: 0.3, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.3, opacity: 0 }}
                                    transition={{ duration: 0.24, ease: SPRING_POP_EASE }}
                                    className="inline-flex"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                            {topping.name}
                          </span>
                          <span className="text-xs font-semibold text-[#73695E] tabular-nums dark:text-[#D8B07A]">
                            +{formatRupiah(topping.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special note */}
              <div>
                <label
                  htmlFor="product-custom-note"
                  className="block text-sm font-semibold text-[#141210] dark:text-[#F7F3EC]"
                >
                  Catatan Dapur
                </label>
                <input
                  id="product-custom-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Telur matang, tanpa daun bawang, kuah banyak"
                  className="mt-2 min-h-[44px] w-full rounded-full border border-[#141210]/15 bg-white px-4 py-2.5 text-sm text-[#141210] placeholder:text-[#73695E]/60 focus:border-[#141210] focus:outline-none dark:border-[#D8B07A]/20 dark:bg-[#181512] dark:text-[#F7F3EC] dark:placeholder:text-[#9D9488]/60 dark:focus:border-[#D8B07A]"
                />
              </div>
            </div>

            {/* Sticky bottom buy bar */}
            <div className="flex items-center justify-between gap-2.5 border-t border-[#141210]/10 bg-[#F2ECE2] px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4 dark:border-[#D8B07A]/16 dark:bg-[#0D0B09]">
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#141210]/15 bg-white px-1 py-1 sm:gap-2 sm:px-1.5 dark:border-[#D8B07A]/20 dark:bg-[#181512]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Kurangi jumlah porsi"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#141210] hover:bg-[#ECE6DC] cursor-pointer sm:h-9 sm:w-9 dark:text-[#F7F3EC] dark:hover:bg-[#26211C]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 0.72, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.22, ease: SPRING_POP_EASE }}
                  className="min-w-[20px] text-center text-sm font-bold tabular-nums sm:min-w-[24px]"
                >
                  {quantity}
                </motion.span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Tambah jumlah porsi"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#141210] hover:bg-[#ECE6DC] cursor-pointer sm:h-9 sm:w-9 dark:text-[#F7F3EC] dark:hover:bg-[#26211C]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onConfirmAdd({
                    product,
                    spiceLevel: product.supportsSpice ? spiceLevel : undefined,
                    toppings: selectedToppings,
                    note,
                    quantity,
                  });
                  onClose();
                }}
                className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#141210] px-4 py-2 text-xs font-semibold text-[#F7F3EC] hover:bg-[#2A2520] whitespace-nowrap cursor-pointer sm:min-h-[46px] sm:gap-2 sm:px-5 sm:text-sm dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
              >
                <span>Tambah</span>
                <span aria-hidden="true">·</span>
                <AnimatedNumber value={lineTotal} durationMs={380} format={formatRupiah} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
