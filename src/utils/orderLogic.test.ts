import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, TOPPING_OPTIONS } from '../data/menu';
import {
  addOrMergeCartItem,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  computeCartTotals,
  filterProducts,
  formatRupiah,
  normalizeWhatsAppPhone,
  removeCartItem,
  updateCartItemQuantity,
  validateCheckoutForm,
  type CheckoutFormState,
} from './orderLogic';

const nyemek = PRODUCTS.find((p) => p.id === 'indomie-nyemek-spesial')!;
const kopi = PRODUCTS.find((p) => p.id === 'es-kopi-susu-pakuwon')!;
const telurCeplok = TOPPING_OPTIONS.find((t) => t.id === 'telur-ceplok')!;
const keju = TOPPING_OPTIONS.find((t) => t.id === 'keju')!;

test('formatRupiah formats Indonesian currency cleanly with dot separators', () => {
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatRupiah(5000), 'Rp 5.000');
  assert.equal(formatRupiah(14000), 'Rp 14.000');
  assert.equal(formatRupiah(125500), 'Rp 125.500');
});

test('addOrMergeCartItem merges identical item configurations and separates different toppings', () => {
  let cart = addOrMergeCartItem([], {
    product: nyemek,
    spiceLevel: 'Pedas',
    toppings: [telurCeplok],
    note: 'jangan terlalu asin',
  });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 1);

  // Identical config merges
  cart = addOrMergeCartItem(cart, {
    product: nyemek,
    spiceLevel: 'Pedas',
    toppings: [telurCeplok],
    note: 'Jangan Terlalu Asin ',
  });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);

  // Different topping creates separate cart line
  cart = addOrMergeCartItem(cart, {
    product: nyemek,
    spiceLevel: 'Pedas',
    toppings: [telurCeplok, keju],
  });
  assert.equal(cart.length, 2);

  const totals = computeCartTotals(cart);
  assert.equal(totals.totalItems, 3);
  // 2 * (14000 + 4000) + 1 * (14000 + 4000 + 4000) = 36000 + 22000 = 58000
  assert.equal(totals.subtotal, 58000);
});

test('updateCartItemQuantity increments, decrements, and removes at zero', () => {
  let cart = addOrMergeCartItem([], { product: kopi, quantity: 2 });
  const key = cart[0].cartKey;

  cart = updateCartItemQuantity(cart, key, 1);
  assert.equal(cart[0].quantity, 3);

  cart = updateCartItemQuantity(cart, key, -3);
  assert.equal(cart.length, 0);

  cart = addOrMergeCartItem([], { product: kopi });
  cart = removeCartItem(cart, cart[0].cartKey);
  assert.equal(cart.length, 0);
});

test('filterProducts filters by category, search query, and spice compatibility', () => {
  const mieOnly = filterProducts(PRODUCTS, { category: 'mie', query: '' });
  assert.ok(mieOnly.length >= 3);
  assert.ok(mieOnly.every((p) => p.category === 'mie'));

  const searchMagelangan = filterProducts(PRODUCTS, {
    category: 'all',
    query: 'magelangan',
  });
  assert.equal(searchMagelangan.length, 1);
  assert.equal(searchMagelangan[0].id, 'magelangan-pakuwon');

  const spicyOnly = filterProducts(PRODUCTS, {
    category: 'all',
    query: '',
    spiceFilter: 'Pedas',
  });
  assert.ok(spicyOnly.every((p) => p.supportsSpice));
  assert.equal(
    spicyOnly.some((p) => p.id === 'es-kopi-susu-pakuwon'),
    false,
  );
});

test('validateCheckoutForm enforces required customer name and delivery address', () => {
  const cart = addOrMergeCartItem([], { product: nyemek });
  const baseForm: CheckoutFormState = {
    customerName: '',
    orderMethod: 'Antar Sekitar Pakuwon',
    tableNumber: '',
    deliveryAddress: '',
    generalNote: '',
    whatsappTarget: '081234567890',
  };

  const invalidRes = validateCheckoutForm(baseForm, cart);
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.customerName);
  assert.ok(invalidRes.errors.deliveryAddress);

  const validDineIn = validateCheckoutForm(
    {
      ...baseForm,
      customerName: 'Budi Santoso',
      orderMethod: 'Makan di Tempat',
      tableNumber: '04',
    },
    cart,
  );
  assert.equal(validDineIn.valid, true);
  assert.deepEqual(validDineIn.errors, {});
});

test('buildWhatsAppMessage and buildWhatsAppUrl format complete WhatsApp order links', () => {
  const cart = addOrMergeCartItem([], {
    product: nyemek,
    spiceLevel: 'Ekstra Pedas',
    toppings: [telurCeplok],
    note: 'kuah banyak',
    quantity: 2,
  });
  const form: CheckoutFormState = {
    customerName: 'Raka Pratama',
    orderMethod: 'Antar Sekitar Pakuwon',
    tableNumber: '',
    deliveryAddress: 'Kos Melati Seturan Blok C2',
    generalNote: 'Minta sendok plastik 2',
    whatsappTarget: '0812-3456-7890',
  };

  const message = buildWhatsAppMessage(cart, form);
  assert.match(message, /Warmindo Pakuwon's/);
  assert.match(message, /Indomie Nyemek Spesial Pakuwon\* x2 — Rp 36\.000/);
  assert.match(message, /Level Pedas: Ekstra Pedas/);
  assert.match(message, /Telur Ceplok Setengah Matang/);
  assert.match(message, /Raka Pratama/);
  assert.match(message, /Kos Melati Seturan Blok C2/);
  assert.match(message, /https:\/\/maps\.app\.goo\.gl\/sj66DkwbMEoZTHNi7/);

  assert.equal(normalizeWhatsAppPhone('0812-3456-7890'), '6281234567890');
  const url = buildWhatsAppUrl(form.whatsappTarget, message);
  assert.ok(url.startsWith('https://wa.me/6281234567890?text='));
  assert.ok(decodeURIComponent(url).includes('Indomie Nyemek Spesial Pakuwon'));
});
