import { useEffect, useState } from 'react';
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
import { LUXURY_EASE } from './MotionPrimitives';

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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0E221A]/75"
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.3, ease: LUXURY_EASE }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#14241C]/15 bg-[#FAF7F0] text-[#14241C] shadow-2xl sm:rounded-3xl"
          >
            {/* Header image + close */}
            <div className="relative h-48 w-full shrink-0 overflow-hidden bg-[#0E221A] sm:h-52">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E221A]/85 via-[#0E221A]/20 to-transparent" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup jendela kustomisasi menu"
                className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0E221A]/85 text-[#F5EFE4] transition-colors hover:bg-[#0E221A] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute right-5 bottom-4 left-5 text-[#F8F4EC]">
                <p className="text-xs text-[#E6BC7B]">
                  {product.categoryLabel} · {product.prepMinutes} menit masak
                </p>
                <h3 id="product-modal-title" className="font-display text-2xl font-semibold">
                  {product.name}
                </h3>
              </div>
            </div>

            {/* Scrollable options */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <p className="text-sm leading-relaxed text-[#515F56]">{product.fullDesc}</p>

              {/* Spice selector */}
              {product.supportsSpice && (
                <div>
                  <label className="block text-sm font-semibold text-[#14241C]">
                    Tingkat Kepedasan
                  </label>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SPICE_LEVELS.map((level) => {
                      const active = spiceLevel === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSpiceLevel(level)}
                          aria-pressed={active}
                          className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'border-[#0E221A] bg-[#0E221A] text-[#E6BC7B]'
                              : 'border-[#14241C]/15 bg-[#F5EFE4] text-[#14241C] hover:border-[#14241C]/40'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extra toppings */}
              {product.supportsToppings && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-[#14241C]">
                      Topping Tambahan
                    </span>
                    <span className="text-xs text-[#515F56]">Opsional</span>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {TOPPING_OPTIONS.map((topping) => {
                      const checked = selectedToppings.some((t) => t.id === topping.id);
                      return (
                        <button
                          key={topping.id}
                          type="button"
                          onClick={() => toggleTopping(topping)}
                          aria-pressed={checked}
                          className={`flex min-h-[46px] w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                            checked
                              ? 'border-[#0E221A] bg-[#0E221A]/6'
                              : 'border-[#14241C]/12 bg-white/70 hover:border-[#14241C]/30'
                          }`}
                        >
                          <span className="flex items-center gap-3 text-sm font-medium text-[#14241C]">
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                                checked
                                  ? 'border-[#0E221A] bg-[#0E221A] text-[#E6BC7B]'
                                  : 'border-[#14241C]/25 bg-white'
                              }`}
                            >
                              {checked && <Check className="h-3.5 w-3.5" />}
                            </span>
                            {topping.name}
                          </span>
                          <span className="text-xs font-semibold text-[#515F56] tabular-nums">
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
                  className="block text-sm font-semibold text-[#14241C]"
                >
                  Catatan Dapur
                </label>
                <input
                  id="product-custom-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Telur matang, tanpa daun bawang, kuah banyak"
                  className="mt-2 min-h-[44px] w-full rounded-xl border border-[#14241C]/15 bg-white px-3.5 py-2.5 text-sm text-[#14241C] placeholder:text-[#515F56]/60 focus:border-[#0E221A] focus:outline-none"
                />
              </div>
            </div>

            {/* Sticky bottom buy bar */}
            <div className="flex items-center justify-between gap-3 border-t border-[#14241C]/10 bg-[#F5EFE4] px-5 py-4">
              <div className="flex items-center gap-2 rounded-full border border-[#14241C]/15 bg-white px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Kurangi jumlah porsi"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#14241C] hover:bg-[#F5EFE4] cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[24px] text-center text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Tambah jumlah porsi"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#14241C] hover:bg-[#F5EFE4] cursor-pointer"
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
                className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0E221A] px-5 py-2.5 text-sm font-semibold text-[#E6BC7B] transition-colors hover:bg-[#193A2D] whitespace-nowrap cursor-pointer"
              >
                <span>Tambah ke Keranjang</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatRupiah(lineTotal)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
