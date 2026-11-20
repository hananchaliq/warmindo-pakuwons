import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { ORDER_METHODS, STORE_INFO } from '../data/menu';
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  computeCartItemSubtotal,
  computeCartTotals,
  formatRupiah,
  validateCheckoutForm,
  type CartItem,
  type CheckoutFormState,
} from '../utils/orderLogic';
import { FLUID_EASE, LUXURY_EASE, SPRING_POP_EASE } from './MotionPrimitives';
import { AnimatedNumber } from './AnimatedNumber';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  form: CheckoutFormState;
  onFormChange: (next: CheckoutFormState) => void;
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  onClearCart: () => void;
  onClose: () => void;
}

export function CartDrawer({
  open,
  items,
  form,
  onFormChange,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onClose,
}: CartDrawerProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPhoneConfig, setShowPhoneConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderReady, setOrderReady] = useState(false);

  const { totalItems, subtotal } = computeCartTotals(items);
  const whatsappMessage = buildWhatsAppMessage(items, form);
  const whatsappUrl = buildWhatsAppUrl(form.whatsappTarget, whatsappMessage);

  useEffect(() => {
    if (!open) {
      setOrderReady(false);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (items.length === 0) {
      setOrderReady(false);
    }
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handlePrepareOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutForm(form, items);
    setErrors(validation.errors);
    if (validation.valid) {
      setOrderReady(true);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: 'none' as const }}
          transition={{ duration: 0.28 }}
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050404]/76"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: LUXURY_EASE }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF8F4] text-[#141210] shadow-2xl dark:bg-[#0F0D0B] dark:text-[#F7F3EC]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#141210]/10 bg-[#F2ECE2] px-5 py-4 text-[#141210] dark:border-[#D8B07A]/18 dark:bg-[#141210] dark:text-[#F7F3EC]">
              <div className="min-w-0 pr-2">
                <h2 id="cart-drawer-title" className="font-display text-2xl font-semibold">
                  Keranjang Pesanan
                </h2>
                <p className="text-xs font-medium text-[#9A6B38] tabular-nums dark:text-[#D8B07A]">
                  {totalItems > 0 ? (
                    <>
                      {totalItems} item · Estimasi{' '}
                      <AnimatedNumber value={subtotal} durationMs={380} format={formatRupiah} />
                    </>
                  ) : (
                    'Belum ada menu dipilih'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup keranjang belanja"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#141210]/15 bg-white/80 text-[#141210] hover:border-[#9A6B38] hover:text-[#9A6B38] cursor-pointer dark:border-white/16 dark:bg-transparent dark:text-[#F7F3EC] dark:hover:border-[#D8B07A] dark:hover:text-[#D8B07A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(8px)', y: 14 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ duration: 0.4, ease: FLUID_EASE }}
                  className="flex h-full flex-col items-center justify-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.72 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.45, ease: SPRING_POP_EASE }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ECE6DC] text-[#141210] dark:bg-[#1C1814] dark:text-[#D8B07A]"
                  >
                    <ShoppingBag className="h-7 w-7" aria-hidden="true" />
                  </motion.div>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-[#141210] dark:text-[#F7F3EC]">
                    Keranjang Masih Kosong
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#574F46] dark:text-[#A9A093]">
                    Pilih Indomie Nyemek, Magelangan, camilan, atau kopi susu favoritmu lalu kirim
                    pesanan langsung lewat chat WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#141210] px-6 py-2.5 text-sm font-semibold text-[#E8C696] hover:bg-[#2A2520] cursor-pointer dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
                  >
                    <span>Pilih Menu Sekarang</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </motion.div>
              ) : orderReady ? (
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(10px)', y: 14 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                  transition={{ duration: 0.38, ease: FLUID_EASE }}
                  className="space-y-5"
                  data-testid="whatsapp-order-ready"
                >
                  <div className="rounded-[22px] border border-[#2C6B49]/25 bg-[#EDF6F0] p-4 dark:border-[#49B675]/30 dark:bg-[#102319]">
                    <div className="flex items-start gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className="mt-0.5 h-6 w-6 shrink-0 text-[#2C6B49] dark:text-[#57D18C]"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          pathLength={1}
                          className="svg-draw-path"
                        />
                        <path
                          d="M7.5 12.2l3 3.1 6-6.3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          pathLength={1}
                          className="svg-draw-path"
                        />
                      </svg>
                      <div>
                        <h3 className="text-sm font-bold text-[#141210] dark:text-[#F7F3EC]">
                          Format Pesanan WhatsApp Siap Dikirim
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#385242] dark:text-[#B4D2C0]">
                          Klik tombol di bawah untuk langsung membuka aplikasi WhatsApp dengan
                          rincian pesanan otomatis untuk <strong>{form.customerName}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formatted message preview */}
                  <div className="rounded-[22px] border border-[#141210]/12 bg-white p-4 dark:border-[#D8B07A]/18 dark:bg-[#171411]">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#73695E] dark:text-[#A9A093]">
                        Pratinjau Pesan WhatsApp
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#141210] hover:text-[#9A6B38] cursor-pointer dark:text-[#D8B07A]"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#2C6B49] dark:text-[#57D18C]" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin Teks</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre
                      data-testid="whatsapp-message-preview"
                      className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[#F4EFE7] p-3.5 font-sans text-xs leading-relaxed text-[#141210] dark:bg-[#0B0A08] dark:text-[#F7F3EC]"
                    >
                      {whatsappMessage}
                    </pre>
                  </div>

                  <div className="space-y-2.5">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="whatsapp-launch-link"
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#1C7C47] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#166539]"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Buka WhatsApp & Kirim Pesanan</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOrderReady(false)}
                        className="min-h-[44px] rounded-full border border-[#141210]/18 px-4 py-2 text-xs font-semibold text-[#141210] hover:bg-[#ECE6DC] cursor-pointer dark:border-[#D8B07A]/24 dark:text-[#F7F3EC] dark:hover:bg-[#1E1A16]"
                      >
                        Ubah Data Pesanan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearCart();
                          setOrderReady(false);
                        }}
                        className="min-h-[44px] rounded-full border border-[#141210]/18 px-4 py-2 text-xs font-semibold text-[#574F46] hover:bg-[#ECE6DC] cursor-pointer dark:border-[#D8B07A]/20 dark:text-[#A9A093] dark:hover:bg-[#1E1A16]"
                      >
                        Kosongkan Keranjang
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Animated Cart items list */}
                  <div className="space-y-3" data-testid="cart-items-list">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#73695E] dark:text-[#A9A093]">
                        Daftar Menu ({totalItems} porsi)
                      </span>
                      <button
                        type="button"
                        onClick={onClearCart}
                        className="text-xs font-medium text-[#A3362C] hover:underline cursor-pointer dark:text-[#F28B82]"
                      >
                        Hapus Semua
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.cartKey}
                          layout
                          initial={{ opacity: 0, y: 12, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 36, scale: 0.94, filter: 'blur(6px)' }}
                          transition={{ duration: 0.3, ease: FLUID_EASE }}
                          className="spotlight-card flex gap-3 rounded-[20px] border border-[#141210]/10 bg-white p-3 dark:border-[#D8B07A]/14 dark:bg-[#171411]"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="h-16 w-16 shrink-0 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="truncate font-display text-lg font-semibold text-[#141210] dark:text-[#F7F3EC]">
                                {item.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.cartKey)}
                                aria-label={`Hapus ${item.name} dari keranjang`}
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#73695E] hover:bg-[#ECE6DC] hover:text-[#A3362C] cursor-pointer dark:text-[#A9A093] dark:hover:bg-[#26211C] dark:hover:text-[#F28B82]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-0.5 space-y-0.5 text-xs text-[#73695E] dark:text-[#A9A093]">
                              {item.spiceLevel && <p>Level: {item.spiceLevel}</p>}
                              {item.toppings.length > 0 && (
                                <p className="line-clamp-2">
                                  Topping: {item.toppings.map((t) => t.name).join(', ')}
                                </p>
                              )}
                              {item.note && (
                                <p className="italic">Catatan: &ldquo;{item.note}&rdquo;</p>
                              )}
                            </div>

                            <div className="mt-2.5 flex items-center justify-between">
                              <AnimatedNumber
                                value={computeCartItemSubtotal(item)}
                                durationMs={340}
                                format={formatRupiah}
                                className="text-sm font-bold text-[#141210] dark:text-[#D8B07A]"
                              />

                              <div className="flex items-center gap-1 rounded-full border border-[#141210]/14 bg-[#FAF8F4] px-1 py-0.5 dark:border-[#D8B07A]/20 dark:bg-[#0F0D0B]">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.cartKey, -1)}
                                  aria-label={`Kurangi jumlah ${item.name}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#141210] hover:bg-[#ECE6DC] cursor-pointer dark:text-[#F7F3EC] dark:hover:bg-[#241F1A]"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <motion.span
                                  key={item.quantity}
                                  initial={{ scale: 0.72 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.22, ease: SPRING_POP_EASE }}
                                  className="min-w-[22px] text-center text-xs font-bold tabular-nums"
                                >
                                  {item.quantity}
                                </motion.span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.cartKey, 1)}
                                  aria-label={`Tambah jumlah ${item.name}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#141210] hover:bg-[#ECE6DC] cursor-pointer dark:text-[#F7F3EC] dark:hover:bg-[#241F1A]"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Customer Order Form */}
                  <form
                    id="wa-checkout-form"
                    onSubmit={handlePrepareOrder}
                    noValidate
                    className="space-y-4 border-t border-[#141210]/10 pt-5 dark:border-[#D8B07A]/14"
                  >
                    <h3 className="font-display text-xl font-semibold text-[#141210] dark:text-[#F7F3EC]">
                      Detail Pengiriman & Chat WA
                    </h3>

                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-semibold text-[#141210] dark:text-[#F7F3EC]"
                      >
                        Nama Pemesan *
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        required
                        value={form.customerName}
                        onChange={(e) => {
                          onFormChange({ ...form, customerName: e.target.value });
                          if (errors.customerName) {
                            setErrors((prev) => ({ ...prev, customerName: '' }));
                          }
                        }}
                        placeholder="Masukkan nama panggilan atau lengkap"
                        className={`mt-1.5 min-h-[44px] w-full rounded-full border bg-white px-4 py-2 text-sm text-[#141210] focus:outline-none dark:bg-[#171411] dark:text-[#F7F3EC] ${
                          errors.customerName
                            ? 'border-[#A3362C] focus:border-[#A3362C] dark:border-[#F28B82]'
                            : 'border-[#141210]/15 focus:border-[#141210] dark:border-[#D8B07A]/20 dark:focus:border-[#D8B07A]'
                        }`}
                      />
                      {errors.customerName && (
                        <p
                          role="alert"
                          className="mt-1 text-xs font-medium text-[#A3362C] dark:text-[#F28B82]"
                        >
                          {errors.customerName}
                        </p>
                      )}
                    </div>

                    {/* Spring-Sliding Order Method Selector */}
                    <div>
                      <span className="block text-xs font-semibold text-[#141210] dark:text-[#F7F3EC]">
                        Metode Pesanan
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 gap-1.5 rounded-[20px] border border-[#141210]/10 bg-[#ECE6DC] p-1.5 dark:border-[#D8B07A]/16 dark:bg-[#171411]">
                        {ORDER_METHODS.map((method) => {
                          const active = form.orderMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => onFormChange({ ...form, orderMethod: method })}
                              aria-pressed={active}
                              className={`relative min-h-[40px] rounded-full px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                                active
                                  ? 'text-[#F7F3EC] dark:text-[#0A0908]'
                                  : 'text-[#574F46] hover:text-[#141210] dark:text-[#C5BBA9] dark:hover:text-[#F7F3EC]'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="checkout-order-method-pill"
                                  transition={{ duration: 0.42, ease: [0.3, 1.25, 0.4, 1] }}
                                  className="absolute inset-0 rounded-full bg-[#141210] shadow-sm dark:bg-[#D8B07A]"
                                />
                              )}
                              <span className="relative z-10">{method}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Animated conditional fields */}
                    <AnimatePresence mode="wait" initial={false}>
                      {form.orderMethod === 'Makan di Tempat' && (
                        <motion.div
                          key="field-table"
                          initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                          exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                          transition={{ duration: 0.28, ease: FLUID_EASE }}
                          className="overflow-hidden"
                        >
                          <label
                            htmlFor="checkout-table"
                            className="block text-xs font-semibold text-[#141210] dark:text-[#F7F3EC]"
                          >
                            Nomor Meja (Opsional)
                          </label>
                          <input
                            id="checkout-table"
                            type="text"
                            value={form.tableNumber}
                            onChange={(e) =>
                              onFormChange({ ...form, tableNumber: e.target.value })
                            }
                            placeholder="Contoh: Meja 04 / Lesehan Timur"
                            className="mt-1.5 min-h-[44px] w-full rounded-full border border-[#141210]/15 bg-white px-4 py-2 text-sm text-[#141210] focus:border-[#141210] focus:outline-none dark:border-[#D8B07A]/20 dark:bg-[#171411] dark:text-[#F7F3EC] dark:focus:border-[#D8B07A]"
                          />
                        </motion.div>
                      )}

                      {form.orderMethod === 'Antar Sekitar Pakuwon' && (
                        <motion.div
                          key="field-address"
                          initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                          exit={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
                          transition={{ duration: 0.28, ease: FLUID_EASE }}
                          className="overflow-hidden"
                        >
                          <label
                            htmlFor="checkout-address"
                            className="block text-xs font-semibold text-[#141210] dark:text-[#F7F3EC]"
                          >
                            Alamat / Patokan Kos (Area Pakuwon & Seturan) *
                          </label>
                          <textarea
                            id="checkout-address"
                            rows={2}
                            required
                            value={form.deliveryAddress}
                            onChange={(e) => {
                              onFormChange({ ...form, deliveryAddress: e.target.value });
                              if (errors.deliveryAddress) {
                                setErrors((prev) => ({ ...prev, deliveryAddress: '' }));
                              }
                            }}
                            placeholder="Contoh: Kos Putri Melati Jl. Seturan Raya, pagar hitam"
                            className={`mt-1.5 w-full rounded-[18px] border bg-white px-3.5 py-2.5 text-sm text-[#141210] focus:outline-none dark:bg-[#171411] dark:text-[#F7F3EC] ${
                              errors.deliveryAddress
                                ? 'border-[#A3362C] focus:border-[#A3362C] dark:border-[#F28B82]'
                                : 'border-[#141210]/15 focus:border-[#141210] dark:border-[#D8B07A]/20 dark:focus:border-[#D8B07A]'
                            }`}
                          />
                          {errors.deliveryAddress && (
                            <p
                              role="alert"
                              className="mt-1 text-xs font-medium text-[#A3362C] dark:text-[#F28B82]"
                            >
                              {errors.deliveryAddress}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label
                        htmlFor="checkout-general-note"
                        className="block text-xs font-semibold text-[#141210] dark:text-[#F7F3EC]"
                      >
                        Catatan Tambahan (Opsional)
                      </label>
                      <input
                        id="checkout-general-note"
                        type="text"
                        value={form.generalNote}
                        onChange={(e) =>
                          onFormChange({ ...form, generalNote: e.target.value })
                        }
                        placeholder="Contoh: Minta sendok, bayar QRIS saat sampai"
                        className="mt-1.5 min-h-[44px] w-full rounded-full border border-[#141210]/15 bg-white px-4 py-2 text-sm text-[#141210] focus:border-[#141210] focus:outline-none dark:border-[#D8B07A]/20 dark:bg-[#171411] dark:text-[#F7F3EC] dark:focus:border-[#D8B07A]"
                      />
                    </div>

                    {/* Optional WA Target Override */}
                    <div className="rounded-[18px] border border-[#141210]/10 bg-[#F2ECE2]/80 px-3.5 py-2.5 dark:border-[#D8B07A]/16 dark:bg-[#171411]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#73695E] dark:text-[#A9A093]">
                          Tujuan WA:{' '}
                          <strong className="text-[#141210] tabular-nums dark:text-[#F7F3EC]">
                            {form.whatsappTarget}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPhoneConfig((prev) => !prev)}
                          className="font-semibold text-[#141210] underline cursor-pointer dark:text-[#D8B07A]"
                        >
                          {showPhoneConfig ? 'Selesai' : 'Ubah Nomor'}
                        </button>
                      </div>
                      <AnimatePresence initial={false}>
                        {showPhoneConfig && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: FLUID_EASE }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2">
                              <label htmlFor="wa-target-input" className="sr-only">
                                Nomor WhatsApp Tujuan
                              </label>
                              <input
                                id="wa-target-input"
                                type="tel"
                                value={form.whatsappTarget}
                                onChange={(e) =>
                                  onFormChange({ ...form, whatsappTarget: e.target.value })
                                }
                                placeholder={STORE_INFO.defaultWhatsapp}
                                className="min-h-[40px] w-full rounded-full border border-[#141210]/15 bg-white px-3.5 py-1.5 text-xs text-[#141210] tabular-nums focus:border-[#141210] focus:outline-none dark:border-[#D8B07A]/20 dark:bg-[#0F0D0B] dark:text-[#F7F3EC]"
                              />
                              {errors.whatsappTarget && (
                                <p
                                  role="alert"
                                  className="mt-1 text-xs font-medium text-[#A3362C] dark:text-[#F28B82]"
                                >
                                  {errors.whatsappTarget}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Footer subtotal & submit action */}
            {items.length > 0 && !orderReady && (
              <div className="border-t border-[#141210]/10 bg-[#F2ECE2] px-5 py-4 dark:border-[#D8B07A]/16 dark:bg-[#0B0A08]">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[#73695E] dark:text-[#A9A093]">
                    Estimasi Total
                  </span>
                  <span
                    data-testid="cart-subtotal"
                    className="font-display text-2xl font-bold text-[#141210] dark:text-[#E8C696]"
                  >
                    <AnimatedNumber value={subtotal} durationMs={420} format={formatRupiah} />
                  </span>
                </div>
                <button
                  type="submit"
                  form="wa-checkout-form"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#141210] px-5 py-3 text-sm font-semibold text-[#E8C696] hover:bg-[#2A2520] cursor-pointer dark:bg-[#D8B07A] dark:text-[#0A0908] dark:hover:bg-[#E8C696]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Siapkan Pesanan WhatsApp</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
