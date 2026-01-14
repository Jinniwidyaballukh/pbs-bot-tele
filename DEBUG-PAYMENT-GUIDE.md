# 🔧 DEBUG PAYMENT ISSUE - PANDUAN

## Masalah
- ✅ Pembayaran berhasil di Midtrans
- ❌ Items tidak terkirim ke user
- ❌ Stok tidak berkurang di dashboard

## Kemungkinan Penyebab (urutan prioritas)

### 1️⃣ Webhook Midtrans tidak dipanggil
**Gejala:** Payment berhasil tapi bot tidak bereaksi

**Cek di bot logs:**
```
[WEBHOOK] ✅ Payment SUCCESS untuk ORD-xxx, calling handlePaymentSuccess
[PAYMENT SUCCESS] ✅ Processing payment untuk ORD-xxx
[FINALIZE DEBUG] Order: ORD-xxx
```

Jika tidak ada log ini → webhook tidak dipanggil

**Solusi:**
- Pastikan `PUBLIC_BASE_URL` di .env sudah benar
- Pastikan Midtrans webhook setting sudah pointing ke URL yang benar
- Test webhook manual: `POST /webhook/midtrans`

---

### 2️⃣ Polling payment tidak berhasil
**Gejala:** Webhook tidak berhasil, polling juga tidak

**Cek di bot logs:**
```
[POLL] ORD-xxx - Attempt 1 - Status: settlement
[POLL] ORD-xxx - Attempt 1 - Status: capture
```

Jika tidak ada atau terus "pending" → polling gagal

**Solusi:**
- Cek koneksi ke Midtrans API
- Pastikan `MIDTRANS_SERVER_KEY` di .env benar

---

### 3️⃣ Finalize stock RPC gagal
**Gejala:** Webhook dipanggil tapi items tidak di-finalize

**Cek di bot logs:**
```
[FINALIZE ERROR] ⚠️ Finalize gagal: {error message}
[FINALIZE ERROR] ⚠️ No items returned for order ORD-xxx
```

**Kemungkinan masalah:**

a) **Tidak ada items reserved**
```sql
SELECT * FROM product_items 
WHERE reserved_for_order = 'ORD-xxx';
-- Result: 0 rows
```

b) **RPC error**
- Function `finalize_items_for_order` tidak ada di Supabase
- Syntax error di migration
- User tidak punya permission

**Solusi:**
- Jalankan migration `003_fix_foreign_keys.sql`
- Pastikan RPC ada: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'finalize_items_for_order'`

---

### 4️⃣ Order items tidak dibuat
**Gejala:** Finalize berhasil, tapi order_items table kosong

**Cek di database:**
```sql
SELECT * FROM order_items WHERE order_id = '{order.id}';
-- Result: 0 rows (MASALAH!)
```

**Solusi:**
- Pastikan `createOrderItems()` berhasil dipanggil
- Check error di logs: `Failed to create order items`

---

## Quick Debug Commands

Setelah pembayaran, jalankan:

```bash
# 1. Cek logs bot (lihat error apa saat finalize)
tail -f bot.log

# 2. Cek order di Supabase
SELECT order_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 1;

# 3. Cek reserved items
SELECT * FROM product_items WHERE reserved_for_order LIKE 'ORD-%';

# 4. Cek order items
SELECT oi.*, o.order_id FROM order_items oi 
JOIN orders o ON oi.order_id = o.id 
ORDER BY o.created_at DESC LIMIT 1;

# 5. Test finalize manual
SELECT finalize_items_for_order('ORD-xxx', 123456789);
```

---

## Checklist Restart Bot

Setelah melakukan fix apapun:

```bash
Ctrl+C  # Stop bot
npm start  # Start lagi
```

Bot akan menampilkan logs lengkap saat startup.

---

## Log Patterns untuk Dicari

**✅ SUKSES:**
```
[POLL] ORD-xxx - Attempt 1 - Status: settlement
[PAYMENT SUCCESS] ✅ Processing payment untuk ORD-xxx
[FINALIZE DEBUG] Items count: 3
```

**❌ ERROR - Webhook:**
```
[WEBHOOK] No signature / Invalid signature / Missing order_id
```

**❌ ERROR - Finalize:**
```
[FINALIZE ERROR] ⚠️ Finalize gagal: no_reserved_items
[FINALIZE ERROR] ⚠️ No items returned
```

**❌ ERROR - Create Items:**
```
Failed to create order items: ...
Order not found for orderId
```

---

## Solusi Umum

1. **Pastikan migrations sudah applied:**
   ```bash
   supabase db push
   # atau jalankan manual di Supabase SQL Editor
   ```

2. **Pastikan product_items ada items:**
   ```bash
   node test-stock-sync.js
   ```

3. **Pastikan webhook URL benar:**
   - Development: `ngrok` tunnel
   - Production: `PUBLIC_BASE_URL` di .env

4. **Test end-to-end:**
   - Buy produk di bot
   - Monitor logs dengan `tail -f`
   - Bayar di Midtrans QRIS simulator
   - Cek apakah items terkirim
