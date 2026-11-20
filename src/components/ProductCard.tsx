import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus, SlidersHorizontal } from 'lucide-react';
import type { Product } from '../data/menu';
import { formatRupiah } from '../utils/orderLogic';
import { SPRING_POP_EASE } from './MotionPrimitives';

interface ProductCardProps {
  product: Product;
  index: number;
  cartQty: number;
  viewMode: 'grid' | 'list';
  onQuickAdd: (product: Product) => void;
  onCustomize: (product: Product) => void;
}

export function ProductCard({
  product,
  index,
  cartQty,
  viewMode,
  onQuickAdd,
  onCustomize,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleQuickAdd = () => {
    onQuickAdd(product);
    setJustAdded(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setJustAdded(false), 750);
  };

  if (viewMode === 'list') {
    return (
      <article
        style={{ '--i': index } as CSSProperties}
        data-testid={`product-card-${product.id}`}
        className="spotlight-card stagger-blur-item group flex flex-col gap-4 rounded-[22px] border border-[#141210]/10 bg-white p-3.5 shadow-[0_10px_28px_-18px_rgba(20,18,16,0.18)] hover:border-[#9A6B38]/40 md:flex-row md:items-center md:p-4 dark:border-[#D8B07A]/14 dark:bg-[#141210] dark:shadow-[0_14px_34px_-18px_rgba(0,0,0,0.75)] dark:hover:border-[#D8B07A]/40"
      >
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[16px] bg-[#ECE6DC] md:h-24 md:w-28 dark:bg-[#181512]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <AnimatePresence>
            {cartQty > 0 && (
              <motion.div
                key={cartQty}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.3, ease: SPRING_POP_EASE }}
                className="absolute top-2 right-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#141210] px-1.5 text-[11px] font-bold text-[#F7F3EC] tabular-nums shadow-md dark:bg-[#D8B07A] dark:text-[#0A0908]"
              >
                {cartQty}x
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="font-display text-xl font-semibold text-[#141210] sm:text-2xl dark:text-[#F7F3EC]">
              {product.name}
            </h3>
            <span className="font-display text-lg font-semibold text-[#9A6B38] tabular-nums sm:text-xl dark:text-[#D8B07A]">
              {formatRupiah(product.price)}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-[#73695E] dark:text-[#9D9488]">
            {product.categoryLabel} · {product.prepMinutes} menit
            {product.highlightNote ? ` · ${product.highlightNote}` : ''}
          </p>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#574F46] dark:text-[#B9B0A2]">
            {product.shortDesc}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-nowrap">
          {(product.supportsSpice || product.supportsToppings) && (
            <button
              type="button"
              onClick={() => onCustomize(product)}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full border border-[#141210]/16 px-4 text-xs font-semibold text-[#141210] hover:border-[#141210] hover:bg-[#ECE6DC] whitespace-nowrap cursor-pointer md:flex-initial dark:border-[#D8B07A]/26 dark:text-[#F7F3EC] dark:hover:border-[#D8B07A] dark:hover:bg-[#1E1A16]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Racik</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleQuickAdd}
            data-testid={`quick-add-${product.id}`}
            className={`inline-flex min-h-[42px] min-w-[104px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap cursor-pointer md:flex-initial ${
              justAdded
                ? 'bg-[#2C6B49] text-white dark:bg-[#49B675] dark:text-[#0A0908]'
                : 'bg-[#141210] text-[#F7F3EC] hover:bg-[#2A2520] dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Masuk</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah</span>
              </>
            )}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{ '--i': index } as CSSProperties}
      data-testid={`product-card-${product.id}`}
      className="tilt-spotlight-card stagger-blur-item group flex min-w-0 flex-col rounded-[26px] border border-[#141210]/10 bg-white shadow-[0_14px_34px_-22px_rgba(20,18,16,0.22)] hover:border-[#9A6B38]/40 hover:shadow-[0_24px_52px_-20px_rgba(20,18,16,0.28)] dark:border-[#D8B07A]/14 dark:bg-[#141210] dark:shadow-[0_18px_42px_-20px_rgba(0,0,0,0.85)] dark:hover:border-[#D8B07A]/40"
    >
      {/* Image frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ECE6DC] dark:bg-[#181512]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0908]/78 via-[#0A0908]/22 to-transparent" />

        {/* Quiet unboxed image footer caption */}
        <div className="pointer-events-none absolute right-4 bottom-3 left-4 flex items-center justify-between gap-2 text-[11px] font-medium text-[#F7F3EC]/92">
          <span className="truncate">{product.categoryLabel}</span>
          <span className="shrink-0">{product.prepMinutes} mnt</span>
        </div>

        {/* Spring-popping cart quantity indicator */}
        <AnimatePresence>
          {cartQty > 0 && (
            <motion.div
              key={cartQty}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.34, ease: SPRING_POP_EASE }}
              className="absolute top-3.5 right-3.5 inline-flex h-8 min-w-[32px] items-center justify-center rounded-full bg-[#141210] px-2 text-xs font-bold text-[#F7F3EC] tabular-nums shadow-lg dark:bg-[#D8B07A] dark:text-[#0A0908]"
            >
              {cartQty}x
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {product.highlightNote && (
          <p className="text-[11px] font-semibold tracking-wider text-[#9A6B38] uppercase dark:text-[#D8B07A]">
            {product.highlightNote}
          </p>
        )}

        <h3 className="mt-1 font-display text-[22px] leading-tight font-semibold text-[#141210] sm:text-[23px] dark:text-[#F7F3EC]">
          {product.name}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#574F46] dark:text-[#A9A093]">
          {product.shortDesc}
        </p>

        <div className="mt-5 flex items-baseline justify-between gap-2 border-t border-[#141210]/8 pt-4 dark:border-[#D8B07A]/12">
          <span className="font-display text-2xl font-semibold text-[#141210] tabular-nums dark:text-[#E8C696]">
            {formatRupiah(product.price)}
          </span>
          <span className="text-xs text-[#73695E] dark:text-[#8E8579]">per porsi</span>
        </div>

        {/* Tactile actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {(product.supportsSpice || product.supportsToppings) && (
            <button
              type="button"
              onClick={() => onCustomize(product)}
              className="inline-flex min-h-[42px] min-w-[92px] flex-1 items-center justify-center gap-1.5 rounded-full border border-[#141210]/16 px-3.5 text-xs font-semibold text-[#141210] hover:border-[#141210] hover:bg-[#ECE6DC] whitespace-nowrap cursor-pointer dark:border-[#D8B07A]/26 dark:text-[#F7F3EC] dark:hover:border-[#D8B07A] dark:hover:bg-[#1E1A16]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Racik</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleQuickAdd}
            data-testid={`quick-add-${product.id}`}
            className={`inline-flex min-h-[42px] min-w-[104px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap cursor-pointer ${
              justAdded
                ? 'bg-[#2C6B49] text-white dark:bg-[#49B675] dark:text-[#0A0908]'
                : 'bg-[#141210] text-[#F7F3EC] hover:bg-[#2A2520] dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="added"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.22, ease: SPRING_POP_EASE }}
                  className="inline-flex items-center gap-1"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Masuk</span>
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="inline-flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Tambah</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </article>
  );
}
