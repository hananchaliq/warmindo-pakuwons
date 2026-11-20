import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
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
import { LUXURY_EASE } from './MotionPrimitives';

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
        <div
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
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0E221A]/70"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.34, ease: LUXURY_EASE }}
            className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF7F0] text-[#14241C] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#14241C]/10 bg-[#0E221A] px-5 py-4 text-[#F8F4EC]">
              <div>
                <h2 id="cart-drawer-title" className="font-display text-xl font-semibold">
                  Keranjang Pesanan
                </h2>
                <p className="text-xs text-[#E6BC7B] tabular-nums">
                  {totalItems > 0
                    ? `${totalItems} item · Estimasi ${formatRupiah(subtotal)}`
                    : 'Belum ada menu dipilih'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup keranjang belanja"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F5EFE4]/20 text-[#F5EFE4] transition-colors hover:border-[#E6BC7B] hover:text-[#E6BC7B] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFE7D8] text-[#0E221A]">
                    <ShoppingBag className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold text-[#14241C]">
                    Keranjang Masih Kosong
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#515F56]">
                    Pilih Indomie Nyemek, Magelangan, camilan, atau kopi susu favoritmu lalu kirim pesanan langsung lewat chat WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#0E221A] px-6 py-2.5 text-sm font-semibold text-[#E6BC7B] hover:bg-[#193A2D] cursor-pointer"
                  >
                    <span>Pilih Menu Sekarang</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : orderReady ? (
                /* Confirmed WhatsApp Dispatch Receipt View */
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: LUXURY_EASE }}
                  className="space-y-5"
                  data-testid="whatsapp-order-ready"
                >
                  <div className="rounded-2xl border border-[#1E5631]/20 bg-[#EBF5EE] p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1E5631]" aria-hidden="true" />
                      <div>
                        <h3 className="text-sm font-bold text-[#0E221A]">
                          Format Pesanan WhatsApp Siap Dikirim
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#2D4A38]">
                          Klik tombol di bawah untuk langsung membuka aplikasi WhatsApp dengan rincian pesanan otomatis untuk{' '}
                          <strong>{form.customerName}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formatted message preview */}
                  <div className="rounded-2xl border border-[#14241C]/12 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#515F56]">
                        Pratinjau Pesan WhatsApp
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E221A] hover:text-[#9E6B24] cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#1E5631]" />
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
                      className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F5EFE4] p-3.5 font-sans text-xs leading-relaxed text-[#14241C]"
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
                        className="min-h-[44px] rounded-full border border-[#14241C]/18 px-4 py-2 text-xs font-semibold text-[#14241C] hover:bg-[#EFE7D8] cursor-pointer"
                      >
                        Ubah Data Pesanan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearCart();
                          setOrderReady(false);
                        }}
                        className="min-h-[44px] rounded-full border border-[#14241C]/18 px-4 py-2 text-xs font-semibold text-[#515F56] hover:bg-[#EFE7D8] cursor-pointer"
                      >
                        Kosongkan Keranjang
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Populated Cart + Checkout Form */
                <div className="space-y-6">
                  {/* Cart items list */}
                  <div className="space-y-3" data-testid="cart-items-list">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#515F56]">
                        Daftar Menu ({totalItems} porsi)
                      </span>
                      <button
                        type="button"
                        onClick={onClearCart}
                        className="text-xs font-medium text-[#8F2D24] hover:underline cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>

                    {items.map((item) => (
                      <div
                        key={item.cartKey}
                        className="flex gap-3 rounded-2xl border border-[#14241C]/10 bg-white p-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate font-display text-base font-semibold text-[#14241C]">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.cartKey)}
                              aria-label={`Hapus ${item.name} dari keranjang`}
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#515F56] hover:bg-[#F5EFE4] hover:text-[#8F2D24] cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="mt-0.5 space-y-0.5 text-xs text-[#515F56]">
                            {item.spiceLevel && <p>Level: {item.spiceLevel}</p>}
                            {item.toppings.length > 0 && (
                              <p className="line-clamp-2">
                                Topping: {item.toppings.map((t) => t.name).join(', ')}
                              </p>
                            )}
                            {item.note && <p className="italic">Catatan: &ldquo;{item.note}&rdquo;</p>}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-sm font-bold text-[#14241C] tabular-nums">
                              {formatRupiah(computeCartItemSubtotal(item))}
                            </span>

                            <div className="flex items-center gap-1 rounded-full border border-[#14241C]/15 bg-[#FAF7F0] px-1 py-0.5">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.cartKey, -1)}
                                aria-label={`Kurangi jumlah ${item.name}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#14241C] hover:bg-[#E9DEC9] cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="min-w-[22px] text-center text-xs font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.cartKey, 1)}
                                aria-label={`Tambah jumlah ${item.name}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#14241C] hover:bg-[#E9DEC9] cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Order Form */}
                  <form
                    id="wa-checkout-form"
                    onSubmit={handlePrepareOrder}
                    noValidate
                    className="space-y-4 border-t border-[#14241C]/10 pt-5"
                  >
                    <h3 className="font-display text-lg font-semibold text-[#14241C]">
                      Detail Pengiriman & Chat WA
                    </h3>

                    <div>
                      <label
                        htmlFor="checkout-name"
                        className="block text-xs font-semibold text-[#14241C]"
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
                        className={`mt-1.5 min-h-[44px] w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-[#14241C] focus:outline-none ${
                          errors.customerName
                            ? 'border-[#A32E24] focus:border-[#A32E24]'
                            : 'border-[#14241C]/15 focus:border-[#0E221A]'
                        }`}
                      />
                      {errors.customerName && (
                        <p role="alert" className="mt-1 text-xs font-medium text-[#A32E24]">
                          {errors.customerName}
                        </p>
                      )}
                    </div>

                    {/* Order Method */}
                    <div>
                      <span className="block text-xs font-semibold text-[#14241C]">
                        Metode Pesanan
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                        {ORDER_METHODS.map((method) => {
                          const active = form.orderMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => onFormChange({ ...form, orderMethod: method })}
                              aria-pressed={active}
                              className={`min-h-[40px] rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                                active
                                  ? 'border-[#0E221A] bg-[#0E221A] text-[#E6BC7B]'
                                  : 'border-[#14241C]/15 bg-white text-[#14241C] hover:bg-[#F5EFE4]'
                              }`}
                            >
                              {method}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {form.orderMethod === 'Makan di Tempat' && (
                      <div>
                        <label
                          htmlFor="checkout-table"
                          className="block text-xs font-semibold text-[#14241C]"
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
                          className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#14241C]/15 bg-white px-3.5 py-2 text-sm text-[#14241C] focus:border-[#0E221A] focus:outline-none"
                        />
                      </div>
                    )}

                    {form.orderMethod === 'Antar Sekitar Pakuwon' && (
                      <div>
                        <label
                          htmlFor="checkout-address"
                          className="block text-xs font-semibold text-[#14241C]"
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
                          className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#14241C] focus:outline-none ${
                            errors.deliveryAddress
                              ? 'border-[#A32E24] focus:border-[#A32E24]'
                              : 'border-[#14241C]/15 focus:border-[#0E221A]'
                          }`}
                        />
                        {errors.deliveryAddress && (
                          <p role="alert" className="mt-1 text-xs font-medium text-[#A32E24]">
                            {errors.deliveryAddress}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="checkout-general-note"
                        className="block text-xs font-semibold text-[#14241C]"
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
                        className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[#14241C]/15 bg-white px-3.5 py-2 text-sm text-[#14241C] focus:border-[#0E221A] focus:outline-none"
                      />
                    </div>

                    {/* Optional WA Target Override */}
                    <div className="rounded-xl border border-[#14241C]/10 bg-[#F5EFE4]/70 px-3.5 py-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#515F56]">
                          Tujuan WA: <strong className="text-[#14241C] tabular-nums">{form.whatsappTarget}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPhoneConfig((prev) => !prev)}
                          className="font-semibold text-[#0E221A] underline cursor-pointer"
                        >
                          {showPhoneConfig ? 'Selesai' : 'Ubah Nomor'}
                        </button>
                      </div>
                      {showPhoneConfig && (
                        <div className="mt-2">
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
                            className="min-h-[40px] w-full rounded-lg border border-[#14241C]/15 bg-white px-3 py-1.5 text-xs text-[#14241C] tabular-nums focus:border-[#0E221A] focus:outline-none"
                          />
                          {errors.whatsappTarget && (
                            <p role="alert" className="mt-1 text-xs font-medium text-[#A32E24]">
                              {errors.whatsappTarget}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Footer subtotal & submit action */}
            {items.length > 0 && !orderReady && (
              <div className="border-t border-[#14241C]/10 bg-[#F5EFE4] px-5 py-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[#515F56]">Estimasi Total</span>
                  <span
                    data-testid="cart-subtotal"
                    className="font-display text-2xl font-bold text-[#14241C] tabular-nums"
                  >
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                <button
                  type="submit"
                  form="wa-checkout-form"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#0E221A] px-5 py-3 text-sm font-semibold text-[#E6BC7B] transition-colors hover:bg-[#18382B] cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Siapkan Pesanan WhatsApp</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
