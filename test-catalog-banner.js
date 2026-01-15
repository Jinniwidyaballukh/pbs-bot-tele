// Test formatProductList dengan banner
import { formatProductList } from './src/bot/formatters.js';

const testProducts = [
  { nama: 'ZOOM ONE PRO', stok: 20 },
  { nama: 'CAPCUT', stok: 20 },
  { nama: 'GSUITE X PAYMENT', stok: 20 },
  { nama: 'EXPRESS VPN', stok: 20 },
  { nama: 'SPOTIFY', stok: 20 },
  { nama: 'CHATGPT HEAD', stok: 20 },
  { nama: 'YOUTUBE PREMIUM', stok: 20 },
  { nama: 'GSUITE YOUTUBE', stok: 20 },
  { nama: 'GMAIL FRESH', stok: 20 },
];

console.log('=== TANPA BANNER ===\n');
const outputWithoutBanner = formatProductList(testProducts, 1, 10, 9);
console.log(outputWithoutBanner);

console.log('\n\n=== DENGAN BANNER ===\n');
const outputWithBanner = formatProductList(
  testProducts, 
  1, 
  10, 
  9,
  'https://i.imgur.com/abc123.jpg'
);
console.log(outputWithBanner);

console.log('\n\n=== DENGAN STOK BERVARIASI ===\n');
const variedProducts = [
  { nama: 'ZOOM ONE PRO', stok: 5 },
  { nama: 'CAPCUT', stok: 0 },
  { nama: 'GSUITE X PAYMENT', stok: 999 },
  { nama: 'EXPRESS VPN', stok: 15 },
];

const outputVaried = formatProductList(
  variedProducts,
  1,
  5,
  4,
  'https://res.cloudinary.com/demo/banner.jpg'
);
console.log(outputVaried);
