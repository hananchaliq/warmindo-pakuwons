import type {
  OrderMethod,
  Product,
  ProductCategory,
  SpiceLevel,
  ToppingOption,
} from '../data/menu';
import { STORE_INFO } from '../data/menu';

export interface CartItem {
  cartKey: string;
  productId: string;
  name: string;
  categoryLabel: string;
  image: string;
  basePrice: number;
  spiceLevel?: SpiceLevel;
  toppings: ToppingOption[];
  note: string;
  quantity: number;
}

export interface CheckoutFormState {
  customerName: string;
  orderMethod: OrderMethod;
  tableNumber: string;
  deliveryAddress: string;
  generalNote: string;
  whatsappTarget: string;
}

export interface ProductFilterOptions {
  category: ProductCategory;
  query: string;
  spiceFilter?: SpiceLevel | 'Semua';
}

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const formatted = safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

export function createCartKey(
  productId: string,
  spiceLevel: SpiceLevel | undefined,
  toppings: ToppingOption[],
  note: string,
): string {
  const toppingIds = [...toppings]
    .map((t) => t.id)
    .sort()
    .join(',');
  const cleanNote = note.trim().toLowerCase();
  return `${productId}__${spiceLevel ?? 'none'}__${toppingIds}__${cleanNote}`;
}

export function computeCartItemUnitPrice(item: Pick<CartItem, 'basePrice' | 'toppings'>): number {
  const toppingTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
  return item.basePrice + toppingTotal;
}

export function computeCartItemSubtotal(item: CartItem): number {
  return computeCartItemUnitPrice(item) * item.quantity;
}

export function computeCartTotals(items: CartItem[]): {
  totalItems: number;
  subtotal: number;
} {
  return items.reduce(
    (acc, item) => {
      acc.totalItems += item.quantity;
      acc.subtotal += computeCartItemSubtotal(item);
      return acc;
    },
    { totalItems: 0, subtotal: 0 },
  );
}

export function addOrMergeCartItem(
  items: CartItem[],
  payload: {
    product: Product;
    spiceLevel?: SpiceLevel;
    toppings?: ToppingOption[];
    note?: string;
    quantity?: number;
  },
): CartItem[] {
  const toppings = payload.toppings ?? [];
  const note = (payload.note ?? '').trim();
  const spiceLevel = payload.product.supportsSpice
    ? (payload.spiceLevel ?? 'Sedang')
    : undefined;
  const quantityToAdd = Math.max(1, Math.floor(payload.quantity ?? 1));
  const cartKey = createCartKey(payload.product.id, spiceLevel, toppings, note);

  const existingIndex = items.findIndex((i) => i.cartKey === cartKey);
  if (existingIndex >= 0) {
    return items.map((item, idx) =>
      idx === existingIndex
        ? { ...item, quantity: item.quantity + quantityToAdd }
        : item,
    );
  }

  return [
    ...items,
    {
      cartKey,
      productId: payload.product.id,
      name: payload.product.name,
      categoryLabel: payload.product.categoryLabel,
      image: payload.product.image,
      basePrice: payload.product.price,
      spiceLevel,
      toppings,
      note,
      quantity: quantityToAdd,
    },
  ];
}

export function updateCartItemQuantity(
  items: CartItem[],
  cartKey: string,
  delta: number,
): CartItem[] {
  return items
    .map((item) =>
      item.cartKey === cartKey
        ? { ...item, quantity: item.quantity + delta }
        : item,
    )
    .filter((item) => item.quantity > 0);
}

export function removeCartItem(items: CartItem[], cartKey: string): CartItem[] {
  return items.filter((item) => item.cartKey !== cartKey);
}

export function filterProducts(
  products: Product[],
  options: ProductFilterOptions,
): Product[] {
  const q = options.query.trim().toLowerCase();
  return products.filter((product) => {
    if (options.category !== 'all' && product.category !== options.category) {
      return false;
    }
    if (
      options.spiceFilter &&
      options.spiceFilter !== 'Semua' &&
      options.spiceFilter !== 'Original' &&
      !product.supportsSpice
    ) {
      return false;
    }
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      product.shortDesc.toLowerCase().includes(q) ||
      product.fullDesc.toLowerCase().includes(q)
    );
  });
}

export function normalizeWhatsAppPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return STORE_INFO.defaultWhatsapp;
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

export function validateCheckoutForm(
  form: CheckoutFormState,
  items: CartItem[],
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (items.length === 0) {
    errors.cart = 'Keranjang masih kosong. Tambahkan menu terlebih dahulu.';
  }

  if (form.customerName.trim().length < 2) {
    errors.customerName = 'Mohon masukkan nama pemesan (minimal 2 karakter).';
  }

  if (
    form.orderMethod === 'Antar Sekitar Pakuwon' &&
    form.deliveryAddress.trim().length < 6
  ) {
    errors.deliveryAddress =
      'Mohon isi alamat atau patokan kos/lokasi pengantaran secara jelas.';
  }

  const normalizedPhone = form.whatsappTarget.replace(/\D/g, '');
  if (normalizedPhone.length < 9) {
    errors.whatsappTarget = 'Nomor WhatsApp tujuan tidak valid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildWhatsAppMessage(
  items: CartItem[],
  form: CheckoutFormState,
  storeName: string = STORE_INFO.name,
  mapsUrl: string = STORE_INFO.mapsUrl,
): string {
  const { totalItems, subtotal } = computeCartTotals(items);
  const lines: string[] = [
    `Halo *${storeName}*, saya ingin memesan:`,
    '',
    '*DETAIL PESANAN*',
  ];

  items.forEach((item, index) => {
    const unitPrice = computeCartItemUnitPrice(item);
    const lineTotal = unitPrice * item.quantity;
    lines.push(`${index + 1}. *${item.name}* x${item.quantity} — ${formatRupiah(lineTotal)}`);
    if (item.spiceLevel) {
      lines.push(`   • Level Pedas: ${item.spiceLevel}`);
    }
    if (item.toppings.length > 0) {
      const toppingNames = item.toppings.map((t) => t.name).join(', ');
      lines.push(`   • Topping: ${toppingNames}`);
    }
    if (item.note) {
      lines.push(`   • Catatan: ${item.note}`);
    }
  });

  lines.push('');
  lines.push(`Total Menu: ${totalItems} item`);
  lines.push(`*Estimasi Total: ${formatRupiah(subtotal)}*`);
  lines.push('');
  lines.push('*DATA PEMESAN*');
  lines.push(`• Nama: ${form.customerName.trim() || '-'}`);
  lines.push(`• Metode: ${form.orderMethod}`);

  if (form.orderMethod === 'Makan di Tempat' && form.tableNumber.trim()) {
    lines.push(`• Nomor Meja: ${form.tableNumber.trim()}`);
  }
  if (form.orderMethod === 'Antar Sekitar Pakuwon' && form.deliveryAddress.trim()) {
    lines.push(`• Alamat/Patokan: ${form.deliveryAddress.trim()}`);
  }
  if (form.generalNote.trim()) {
    lines.push(`• Catatan Tambahan: ${form.generalNote.trim()}`);
  }

  lines.push('');
  lines.push(`Lokasi Warung: ${mapsUrl}`);
  lines.push('Terima kasih!');

  return lines.join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phoneNumber);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
