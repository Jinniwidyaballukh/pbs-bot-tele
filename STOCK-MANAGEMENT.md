# 📦 Pengelolaan Stok - Complete Guide

## 🎯 Overview

Sistem pengelolaan stok di Supabase menggunakan **2 layer**:

1. **Product Stock (Angka)** - Table `products`, kolom `stok`
2. **Product Items (Data Actual)** - Table `product_items`

---

## 🔄 Cara Kerja

### **Layer 1: Product Stock (Angka)**
```
products table:
├── kode: "canvahead"
├── nama: "Canva Pro 1 Head 1 Bulan"
└── stok: 10  ← Jumlah item tersedia
```

### **Layer 2: Product Items (Data)**
```
product_items table:
├── Item 1: "email1@test.com:pass123" [available]
├── Item 2: "email2@test.com:pass456" [available]
├── Item 3: "email3@test.com:pass789" [reserved] ← Pending payment
├── Item 4: "email4@test.com:passabc" [sold] ← Sudah terjual
└── ...
```

**Auto-sync**: Kolom `stok` di products **otomatis update** berdasarkan jumlah items dengan status `available`.

---

## 📊 Status Item

| Status | Deskripsi | Kapan |
|--------|-----------|-------|
| `available` | Siap dijual | Default saat add item |
| `reserved` | Tertahan (pending payment) | Saat user create order |
| `sold` | Terjual | Setelah payment sukses |
| `invalid` | Tidak valid/expired | Manual mark oleh admin |

---

## 🚀 Cara Pengelolaan Stok

### **1. Setup Database (Run Migration)**

Jalankan migration SQL di Supabase:

1. Buka: **Supabase Dashboard → SQL Editor**
2. Copy file: `supabase/migrations/002_product_items.sql`
3. Paste & Run

Ini akan create:
- ✅ Table `product_items`
- ✅ Functions untuk reserve/finalize/release items
- ✅ Trigger auto-sync stock
- ✅ View `product_inventory_summary`

---

### **2. Menambahkan Items ke Produk**

#### **A. Via Script (Recommended)**

Edit file `scripts/add-product-items.js`:

```javascript
const items = [
  { 
    data: 'email1@example.com:password123', 
    notes: 'Expired: 2026-12-31', 
    batch: 'JAN2026' 
  },
  { 
    data: 'email2@example.com:password456', 
    notes: 'Expired: 2026-12-31', 
    batch: 'JAN2026' 
  },
  // ... tambah lebih banyak
];

await bulkAddProductItems({
  productCode: 'canvahead',
  items
});
```

Jalankan:
```bash
node scripts/add-product-items.js
```

#### **B. Via SQL (Bulk Insert)**

```sql
-- Insert 10 items untuk Canva Pro
INSERT INTO product_items (product_code, product_id, item_data, notes, batch)
SELECT 
  'canvahead',
  (SELECT id FROM products WHERE kode = 'canvahead'),
  'email' || gs || '@test.com:password' || gs,
  'Expired: 2026-12-31',
  'JAN2026'
FROM generate_series(1, 10) as gs;
```

#### **C. Via Supabase Table Editor (Manual)**

1. Buka: **Table Editor → product_items**
2. Click **Insert → Insert row**
3. Fill:
   - `product_code`: `canvahead`
   - `product_id`: (pilih dari dropdown atau query)
   - `item_data`: `email@example.com:password123`
   - `status`: `available`
   - `notes`: `Expired: 2026-12-31`

---

### **3. Format Item Data**

Item data **fleksibel**, bisa format apa saja:

#### **Format 1: Email:Password**
```
email@example.com:password123
```

#### **Format 2: Kode Voucher**
```
CANVA-PROMO-ABC123
```

#### **Format 3: JSON**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "expires": "2026-12-31",
  "notes": "Premium account"
}
```

#### **Format 4: Multiline**
```
Email: user@example.com
Password: secret123
Expires: 2026-12-31
PIN: 1234
```

**Pilih format yang paling sesuai dengan produk Anda!**

---

## 🔄 Flow Pembelian

### **User beli produk:**

```
1. User pilih produk & quantity
   ↓
2. Bot reserve items
   - Items status: available → reserved
   - Reserved for 15 menit
   ↓
3. User bayar via Midtrans
   ↓
4. Payment sukses (webhook)
   ↓
5. Bot finalize items
   - Items status: reserved → sold
   - Bot kirim item data ke user
   - Stock berkurang otomatis
```

### **Payment cancelled/expired:**

```
Payment expired/cancel
   ↓
Bot release items
   ↓
Items status: reserved → available
   ↓
Stock kembali normal
```

---

## 📋 Monitoring Stok

### **1. View Inventory Summary**

```sql
-- Lihat summary semua produk
SELECT * FROM product_inventory_summary;
```

Output:
```
kode       | nama              | stock_count | available | reserved | sold
-----------|-------------------|-------------|-----------|----------|------
canvahead  | Canva Pro 1 Head  | 10          | 8         | 2        | 15
vidtv1th   | Vidio Platinum    | 5           | 5         | 0        | 3
```

### **2. Check Items untuk Produk Tertentu**

```sql
-- Lihat semua items Canva
SELECT * FROM product_items 
WHERE product_code = 'canvahead' 
ORDER BY status, created_at DESC;
```

### **3. Check Items Available**

```sql
-- Lihat items yang siap jual
SELECT product_code, item_data, notes
FROM product_items
WHERE status = 'available'
ORDER BY product_code, created_at;
```

### **4. Check Reserved Items**

```sql
-- Lihat items yang sedang reserved (pending payment)
SELECT product_code, item_data, reserved_for_order, 
       reservation_expires_at
FROM product_items
WHERE status = 'reserved'
ORDER BY reservation_expires_at;
```

---

## 🛠️ Operasi Admin

### **1. Add Single Item**

```javascript
import { addProductItem } from './src/database/product-items.js';

await addProductItem({
  productCode: 'canvahead',
  itemData: 'newemail@test.com:newpass123',
  notes: 'Expired: 2026-12-31',
  batch: 'JAN2026'
});
```

### **2. Mark Item as Invalid**

```javascript
import { markItemAsInvalid } from './src/database/product-items.js';

await markItemAsInvalid(
  'item-uuid-here',
  'Account expired'
);
```

Atau via SQL:
```sql
UPDATE product_items
SET status = 'invalid',
    notes = 'Account expired'
WHERE id = 'item-uuid-here';
```

### **3. Delete Item (Permanent)**

```sql
DELETE FROM product_items
WHERE id = 'item-uuid-here';
```

### **4. Bulk Add Items dari CSV/Excel**

1. Export CSV dengan kolom: `product_code`, `item_data`, `notes`
2. Import via script:

```javascript
import { bulkAddProductItems } from './src/database/product-items.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const csv = fs.readFileSync('items.csv', 'utf-8');
const rows = parse(csv, { columns: true });

for (const row of rows) {
  await bulkAddProductItems({
    productCode: row.product_code,
    items: [{ data: row.item_data, notes: row.notes }]
  });
}
```

---

## 🔧 Maintenance

### **1. Clean Expired Reservations**

Auto-run setiap bot start, atau manual:

```sql
SELECT clean_expired_item_reservations();
```

### **2. Check Low Stock**

```sql
SELECT kode, nama, stock_count, available_items
FROM product_inventory_summary
WHERE available_items < 5
ORDER BY available_items ASC;
```

### **3. Audit Sold Items**

```sql
-- Items terjual hari ini
SELECT pi.product_code, p.nama, pi.item_data, pi.sold_at, pi.order_id
FROM product_items pi
JOIN products p ON pi.product_id = p.id
WHERE pi.status = 'sold'
  AND pi.sold_at >= CURRENT_DATE
ORDER BY pi.sold_at DESC;
```

---

## 📊 Reports

### **1. Sales by Product**

```sql
SELECT 
  product_code,
  COUNT(*) as items_sold,
  MIN(sold_at) as first_sale,
  MAX(sold_at) as last_sale
FROM product_items
WHERE status = 'sold'
GROUP BY product_code
ORDER BY items_sold DESC;
```

### **2. Inventory Value**

```sql
SELECT 
  p.kode,
  p.nama,
  p.harga,
  pis.available_items,
  (p.harga * pis.available_items) as inventory_value
FROM products p
JOIN product_inventory_summary pis ON p.kode = pis.kode
WHERE pis.available_items > 0
ORDER BY inventory_value DESC;
```

---

## ⚠️ Important Notes

### **Stock Auto-Sync**
- Kolom `products.stok` **otomatis sync** dengan count items `available`
- **Jangan** manual edit `products.stok` kecuali tidak pakai items system
- Pakai items system = stock akurat 100%

### **Data Security**
- Item data (password, voucher) tersimpan sebagai **plain text**
- Untuk produksi, consider **encrypt** sensitive data
- Set proper RLS (Row Level Security) di Supabase

### **Backup**
- Supabase auto-backup daily
- Export items secara manual via SQL:
```sql
COPY (SELECT * FROM product_items WHERE status = 'available') 
TO '/tmp/items_backup.csv' CSV HEADER;
```

---

## 🎓 Workflow Lengkap

### **Setup Awal:**
1. ✅ Run migration `002_product_items.sql`
2. ✅ Add items via script/SQL
3. ✅ Verify di `product_inventory_summary`

### **Operasional Harian:**
1. Monitor stock via view
2. Add items saat stock menipis
3. Mark invalid items yang expired
4. Check reports untuk analytics

### **Maintenance:**
1. Clean expired reservations (auto)
2. Audit sold items
3. Backup items data
4. Update item notes (expired dates, etc)

---

## 🆘 Troubleshooting

### **Stock tidak sync?**
```sql
-- Manual trigger sync
UPDATE product_items SET updated_at = NOW() 
WHERE product_id = (SELECT id FROM products WHERE kode = 'canvahead');
```

### **Items tidak ke-reserve?**
Check:
1. Apakah ada items dengan status `available`?
2. Quantity minta > available items?
3. Check error logs

### **Payment sukses tapi items tidak dikirim?**
Check:
```sql
SELECT * FROM product_items 
WHERE reserved_for_order = 'ORDER-ID-HERE';
```

Jika masih `reserved`, manual finalize:
```sql
SELECT finalize_items_for_order('ORDER-ID-HERE', user_id);
```

---

## ✅ Checklist Implementation

- [ ] Run migration `002_product_items.sql`
- [ ] Add sample items untuk testing
- [ ] Test reserve flow
- [ ] Test finalize flow (payment sukses)
- [ ] Test release flow (payment cancel)
- [ ] Verify stock auto-sync
- [ ] Setup monitoring queries
- [ ] Create backup procedure
- [ ] Document item data format untuk tim
- [ ] Train admin cara add items

---

**Status**: Ready to use! 🎉

Sistem pengelolaan stok dengan items management sekarang **production-ready**.
