export type ProductCategory = 'all' | 'mie' | 'nasi' | 'camilan' | 'minuman';

export type SpiceLevel = 'Original' | 'Sedang' | 'Pedas' | 'Ekstra Pedas';

export type OrderMethod = 'Makan di Tempat' | 'Bungkus (Ambil Sendiri)' | 'Antar Sekitar Pakuwon';

export interface ToppingOption {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: Exclude<ProductCategory, 'all'>;
  categoryLabel: string;
  price: number;
  prepMinutes: number;
  shortDesc: string;
  fullDesc: string;
  image: string;
  supportsSpice: boolean;
  supportsToppings: boolean;
  featured?: boolean;
  highlightNote?: string;
  model3dId?: 'nyemek' | 'magelangan' | 'kopi';
}

export const STORE_INFO = {
  name: "Warmindo Pakuwon's",
  shortName: "Pakuwon's",
  tagline: 'Cita rasa hangat khas Jogja di sekitar kawasan Pakuwon Mall, Depok, Sleman.',
  address: 'Kawasan Pakuwon Mall & Seturan, Depok, Sleman, DI Yogyakarta',
  coordinates: '-7.7656935, 110.4179193',
  mapsUrl: 'https://maps.app.goo.gl/sj66DkwbMEoZTHNi7',
  hours: 'Buka Setiap Hari · 16.00 – 03.00 WIB',
  defaultWhatsapp: '6281234567890',
  displayPhone: '+62 812-3456-7890',
};

export const HERO_IMAGE = '/src/assets/images/hero_warmindo_evening_1795147207757.jpg';
export const STORY_IMAGE = '/src/assets/images/story_wok_craft_1795147208414.jpg';
export const EXPERIENCE_IMAGE = '/src/assets/images/experience_jogja_night_1795147209020.jpg';

const IMG_MIE = '/src/assets/images/menu_indomie_nyemek_1795147207182.jpg';
const IMG_NASI = '/src/assets/images/menu_magelangan_spesial_1795147212876.jpg';
const IMG_MINUMAN = '/src/assets/images/menu_minuman_kopi_1795147207061.jpg';
const IMG_CAMILAN = '/src/assets/images/menu_camilan_warung_1795147209170.jpg';

export const SPICE_LEVELS: SpiceLevel[] = [
  'Original',
  'Sedang',
  'Pedas',
  'Ekstra Pedas',
];

export const ORDER_METHODS: OrderMethod[] = [
  'Makan di Tempat',
  'Bungkus (Ambil Sendiri)',
  'Antar Sekitar Pakuwon',
];

export const CATEGORY_TABS: { id: ProductCategory; label: string }[] = [
  { id: 'all', label: 'Semua Menu' },
  { id: 'mie', label: 'Olahan Mie' },
  { id: 'nasi', label: 'Nasi & Magelangan' },
  { id: 'camilan', label: 'Camilan Hangat' },
  { id: 'minuman', label: 'Minuman & Kopi' },
];

export const TOPPING_OPTIONS: ToppingOption[] = [
  { id: 'telur-ceplok', name: 'Telur Ceplok Setengah Matang', price: 4000 },
  { id: 'telur-dadar', name: 'Telur Dadar Krispi', price: 4000 },
  { id: 'kornet', name: 'Kornet Sapi Tumis', price: 5000 },
  { id: 'keju', name: 'Keju Cheddar Parut', price: 4000 },
  { id: 'bakso', name: 'Bakso Sapi Iris (3 pcs)', price: 4500 },
  { id: 'sosis', name: 'Sosis Sapi Bakar', price: 4500 },
  { id: 'kerupuk', name: 'Kerupuk Kaleng Renyah', price: 2000 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'indomie-nyemek-spesial',
    name: 'Indomie Nyemek Spesial Pakuwon',
    category: 'mie',
    categoryLabel: 'Olahan Mie',
    price: 14000,
    prepMinutes: 8,
    shortDesc: 'Kuah kental bumbu rempah wajan, telur setengah matang, sawi hijau & bawang goreng.',
    fullDesc:
      'Menu andalan Warmindo Pakuwon’s. Dimasak perlahan di wajan besi panas dengan bumbu racikan bawang merah, cabai rawit segar, kecap manis pilihan, sawi hijau renyah, bakso iris, dan telur mata sapi.',
    image: IMG_MIE,
    supportsSpice: true,
    supportsToppings: true,
    featured: true,
    highlightNote: 'Favorit Pelanggan',
    model3dId: 'nyemek',
  },
  {
    id: 'magelangan-pakuwon',
    name: 'Magelangan Spesial Pakuwon',
    category: 'nasi',
    categoryLabel: 'Nasi & Magelangan',
    price: 17000,
    prepMinutes: 10,
    shortDesc: 'Perpaduan nasi goreng dan mie berbumbu smokey wajan, ayam suwir, telur & kerupuk.',
    fullDesc:
      'Hidangan ikonik warmindo Sleman. Nasi pulen dan mie kuning ditumis bersama bumbu ulek rumahan, ayam suwir berbumbu, acar segar, telur ceplok renyah pinggir, dan kerupuk.',
    image: IMG_NASI,
    supportsSpice: true,
    supportsToppings: true,
    featured: true,
    highlightNote: 'Porsi Mantap',
    model3dId: 'magelangan',
  },
  {
    id: 'es-kopi-susu-pakuwon',
    name: 'Es Kopi Susu Gula Aren Pakuwon',
    category: 'minuman',
    categoryLabel: 'Minuman & Kopi',
    price: 12000,
    prepMinutes: 4,
    shortDesc: 'Seduhan kopi robusta-arabika pekat, susu creamy dingin, dan sirup gula aren murni.',
    fullDesc:
      'Racikan kopi susu signature Warmindo Pakuwon’s. Perpaduan seimbang antara pahit harum kopi, kelembutan susu segar, dan manis karamel gula aren asli.',
    image: IMG_MINUMAN,
    supportsSpice: false,
    supportsToppings: false,
    featured: true,
    highlightNote: 'Signature Drink',
    model3dId: 'kopi',
  },
  {
    id: 'roti-bakar-cokelat-keju',
    name: 'Roti Bakar Cokelat Keju Lumer',
    category: 'camilan',
    categoryLabel: 'Camilan Hangat',
    price: 13000,
    prepMinutes: 7,
    shortDesc: 'Roti tebal panggang mentega dengan selai cokelat pekat, susu kental & keju parut.',
    fullDesc:
      'Dipanggang perlahan di atas wajan datar dengan mentega harum hingga renyah keemasan di luar dan lembut di dalam, berlimpah cokelat dan parutan keju.',
    image: IMG_CAMILAN,
    supportsSpice: false,
    supportsToppings: false,
    highlightNote: 'Teman Nongkrong',
  },
  {
    id: 'indomie-dok-dok-jogja',
    name: 'Mie Dok-Dok Kuah Hangat',
    category: 'mie',
    categoryLabel: 'Olahan Mie',
    price: 13000,
    prepMinutes: 8,
    shortDesc: 'Mie kuah kental khas burjo Jogja dengan orak-arik telur, tomat segar, dan irisan kol.',
    fullDesc:
      'Cita rasa klasik malam hari di Yogyakarta. Kuah gurih berbumbu bawang putih geprek dan merica, diaduk bersama telur orak-arik lembut dan sayuran segar.',
    image: IMG_MIE,
    supportsSpice: true,
    supportsToppings: true,
    highlightNote: 'Klasik Jogja',
  },
  {
    id: 'nasi-goreng-kampung',
    name: 'Nasi Goreng Kampung Telur Ceplok',
    category: 'nasi',
    categoryLabel: 'Nasi & Magelangan',
    price: 16000,
    prepMinutes: 9,
    shortDesc: 'Nasi goreng aroma terasi tipis & bawang goreng dengan acar timun dan sambal ulek.',
    fullDesc:
      'Nasi goreng bergaya rumahan dengan aroma wajan yang kuat, disajikan hangat bersama telur ceplok, irisan timun, tomat, dan sambal terasi dadakan.',
    image: IMG_NASI,
    supportsSpice: true,
    supportsToppings: true,
  },
  {
    id: 'es-teh-kampul-jogja',
    name: 'Es Teh Melati Jeruk Nipis',
    category: 'minuman',
    categoryLabel: 'Minuman & Kopi',
    price: 5000,
    prepMinutes: 3,
    shortDesc: 'Teh seduh tubruk khas Jawa beraroma melati dengan perasan jeruk nipis segar.',
    fullDesc:
      'Diseduh dari racikan daun teh melati pilihan khas Solo-Jogja, sepat wangi pas dan menyegarkan untuk menemani hidangan pedas.',
    image: IMG_MINUMAN,
    supportsSpice: false,
    supportsToppings: false,
  },
  {
    id: 'pisang-goreng-keju',
    name: 'Pisang Goreng Krispi Keju Cokelat',
    category: 'camilan',
    categoryLabel: 'Camilan Hangat',
    price: 12000,
    prepMinutes: 7,
    shortDesc: 'Pisang kepok manis berbalut tepung renyah, siraman saus cokelat dan taburan keju.',
    fullDesc:
      'Menggunakan pisang kepok kuning pilihan yang digoreng hangat saat dipesan, disajikan dengan parutan cheddar lembut dan lelehan dark chocolate.',
    image: IMG_CAMILAN,
    supportsSpice: false,
    supportsToppings: false,
  },
  {
    id: 'indomie-goreng-double',
    name: 'Indomie Goreng Jumbo Telur Kornet',
    category: 'mie',
    categoryLabel: 'Olahan Mie',
    price: 16000,
    prepMinutes: 7,
    shortDesc: 'Porsi kenyang dua keping mie goreng dengan tumisan kornet sapi dan telur ceplok.',
    fullDesc:
      'Solusi lapar tengah malam. Dua porsi mie goreng dimasak al dente dengan kornet sapi gurih, cabai potong segar, dan taburan bawang goreng renyah.',
    image: IMG_MIE,
    supportsSpice: true,
    supportsToppings: true,
  },
  {
    id: 'nasi-telur-orak-arik',
    name: 'Nasi Orak-Arik Telur Kecap Pedas',
    category: 'nasi',
    categoryLabel: 'Nasi & Magelangan',
    price: 12000,
    prepMinutes: 6,
    shortDesc: 'Menu hemat penuh rasa: nasi putih hangat, telur orak-arik bawang cabai & kerupuk.',
    fullDesc:
      'Pilihan cepat dan hangat untuk jam makan siang maupun lembur tugas. Telur diorak-arik bersama bawang merah, daun bawang, cabai rawit, dan kecap manis.',
    image: IMG_NASI,
    supportsSpice: true,
    supportsToppings: true,
  },
  {
    id: 'mendoan-sambal-kecap',
    name: 'Tempe Mendoan Hangat (Isi 4)',
    category: 'camilan',
    categoryLabel: 'Camilan Hangat',
    price: 10000,
    prepMinutes: 6,
    shortDesc: 'Tempe iris tipis berbalut tepung daun bawang ketumbar dengan sambal kecap rawit.',
    fullDesc:
      'Digoreng setengah kering ala Banyumas hingga lembut gurih, lengkap dengan cocolan kecap manis dan irisan cabai rawit segar.',
    image: IMG_CAMILAN,
    supportsSpice: true,
    supportsToppings: false,
  },
  {
    id: 'susu-jahe-hangat',
    name: 'Susu Jahe Geprek Hangat',
    category: 'minuman',
    categoryLabel: 'Minuman & Kopi',
    price: 8000,
    prepMinutes: 5,
    shortDesc: 'Jahe emprit bakar digeprek segar diseduh bersama susu kental manis hangat.',
    fullDesc:
      'Penghangat badan favorit di malam Jogja. Jahe dibakar ringan agar aromanya keluar sempurna sebelum diseduh dengan susu hangat.',
    image: IMG_MINUMAN,
    supportsSpice: false,
    supportsToppings: false,
  },
];

export interface ShowcaseDish {
  id: 'nyemek' | 'magelangan' | 'kopi';
  productId: string;
  label: string;
  subtitle: string;
  tastingNotes: string[];
  accentHex: string;
}

export const SHOWCASE_DISHES: ShowcaseDish[] = [
  {
    id: 'nyemek',
    productId: 'indomie-nyemek-spesial',
    label: 'Indomie Nyemek',
    subtitle: 'Kuah kental gurih · Telur setengah matang · Rawit segar',
    tastingNotes: ['Wajan Besi Panas', 'Bumbu Rempah Ulek', 'Telur Lumer'],
    accentHex: '#E6BC7B',
  },
  {
    id: 'magelangan',
    productId: 'magelangan-pakuwon',
    label: 'Magelangan Pakuwon',
    subtitle: 'Nasi goreng & mie · Ayam suwir · Acar & kerupuk',
    tastingNotes: ['Aroma Smokey Wajan', 'Porsi Kenyang', 'Sambal Dadakan'],
    accentHex: '#D99B52',
  },
  {
    id: 'kopi',
    productId: 'es-kopi-susu-pakuwon',
    label: 'Es Kopi Susu Aren',
    subtitle: 'Kopi pekat · Susu creamy · Gula aren murni',
    tastingNotes: ['Gula Aren Asli', 'Seduh Segar', 'Dingin Menyegarkan'],
    accentHex: '#C59143',
  },
];
