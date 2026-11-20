import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, SlidersHorizontal, Utensils } from 'lucide-react';
import type { Product } from '../data/menu';
import { formatRupiah } from '../utils/orderLogic';
import { LUXURY_EASE } from './MotionPrimitives';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onQuickAdd: (product: Product) => void;
  onCustomize: (product: Product) => void;
}

export function ProductCard({
  product,
  quantityInCart,
  onQuickAdd,
  onCustomize,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, ease: LUXURY_EASE }}
      whileHover={{ y: -3 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[#14241C]/10 bg-[#FAF7F0] transition-shadow duration-200 hover:shadow-[0_14px_34px_-14px_rgba(14,34,26,0.16)]"
    >
      {/* Uniform 4:3 culinary imagery with fallback container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E9DEC9]">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#163025] to-[#0E221A] p-4 text-center text-[#E6BC7B]">
            <Utensils className="mb-2 h-8 w-8 opacity-80" aria-hidden="true" />
            <span className="font-display text-base">{product.name}</span>
          </div>
        )}

        {quantityInCart > 0 && (
          <div className="absolute right-3 bottom-3 rounded-full bg-[#0E221A]/92 px-3 py-1 text-xs font-semibold text-[#E6BC7B] tabular-nums">
            {quantityInCart} di keranjang
          </div>
        )}
      </div>

      {/* Editorial product body (zero-pill metadata) */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#515F56]">
          <span>{product.categoryLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{product.prepMinutes} mnt</span>
          {product.highlightNote && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#9E6B24] font-semibold">{product.highlightNote}</span>
            </>
          )}
        </div>

        <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-[#14241C]">
          {product.name}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#515F56]">
          {product.shortDesc}
        </p>

        {/* Price + Action row */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#14241C]/8 pt-4">
          <div>
            <span className="block text-[11px] text-[#515F56]">Harga</span>
            <span className="text-base font-bold text-[#14241C] tabular-nums">
              {formatRupiah(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(product.supportsSpice || product.supportsToppings) && (
              <button
                type="button"
                onClick={() => onCustomize(product)}
                aria-label={`Atur topping untuk ${product.name}`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#14241C]/18 px-3.5 py-2 text-xs font-semibold text-[#14241C] transition-colors hover:border-[#14241C]/45 hover:bg-[#EFE7D8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Atur</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onQuickAdd(product)}
              aria-label={`Tambah ${product.name} ke keranjang`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#0E221A] px-4 py-2 text-xs font-semibold text-[#F5EFE4] transition-colors duration-150 hover:bg-[#193A2D] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#E6BC7B]" aria-hidden="true" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
