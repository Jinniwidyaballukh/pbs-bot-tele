# 🔄 Stock Sync Fix: Bot ↔️ Dashboard

## Problem Identified
Bot was displaying hardcoded `stok` field from `products` table, while dashboard shows actual available items from `product_items` table. They were out of sync.

**Example:**
- Bot showed: "Stok: 2" (from products.stok)
- Dashboard showed: "3 / 5" (3 available out of 5 total items from product_items)

## Root Cause Analysis
1. **Bot data layer** (`src/data/products.js`): Used `p.stok` directly from products table
2. **Bot database layer** (`src/database/products.js`): Only fetched products table, no items count
3. **Dashboard**: Shows real-time counts from `product_items` table

## Solution Implemented

### 1. Updated `src/database/products.js` - `getAllProducts()`
**Before:** Only fetched products table
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('aktif', true)
```

**After:** Also fetches available items count from `product_items`
```javascript
// Fetch all products
const { data: products } = await supabase.from('products').select('*')...

// Fetch available items count per product code
const { data: itemCounts } = await supabase.from('product_items').select('product_code, status')...

// Map counts: { available: 3, total: 5 }
const countsMap = new Map()
itemCounts.forEach(item => {
  counts.available++ if status='available'
  counts.total++
})

// Add to each product
return products.map(p => ({
  ...p,
  available_items: countsMap.get(p.kode)?.available || 0,
  total_items: countsMap.get(p.kode)?.total || 0,
}))
```

### 2. Updated `src/data/products.js` - `loadProducts()`
**Before:** Used static stok field
```javascript
stok: String(p.stok || '0'),
```

**After:** Uses dynamic available_items count
```javascript
stok: String(p.available_items || p.stok || '0'),
available_items: p.available_items || 0,
total_items: p.total_items || 0,
```

## How It Works Now

### Data Flow:
```
User purchases item via bot
    ↓
product_items.status = 'sold'
    ↓
Bot refreshes products (every 30 min or on /refresh)
    ↓
Bot fetches product_items counts
    ↓
Bot populates available_items
    ↓
Bot displays stok = available_items
    ↓
Bot catalog shows: "Stok: 3" (matches available items)
    ↓
Dashboard also shows: "3 / 5" (same count)
    ↓
✅ SYNC!
```

## Display Changes

### Bot Catalog (now synced)
```
1. ChatGPT Plus 1 Bulan Private
   💰 Rp 30.000 • Stok: 0  ← Shows available items count

2. Alight Motion 1 Tahun
   💰 Rp 6.000 • Stok: 2   ← Shows available items count
```

### Bot Product Detail (now synced)
```
📊 Stok: 3  ← Shows available items count (or ∞ if no items managed)
```

### Dashboard Products Page (already correct)
```
Items (Available / Total)
3 / 5  ← Same count from product_items
```

## Performance Optimization

The solution includes:
- **Batch fetching**: Gets all item counts in one query
- **Efficient mapping**: Uses Map for O(1) lookups
- **Fallback**: Uses original stok if available_items not available
- **Caching**: Bot caches products for 5 minutes (PRODUCT_TTL_MS)

## Testing Checklist

After restarting the bot:
- [ ] Run `/menu` - check stock numbers
- [ ] Compare with dashboard Products page - should match Available count
- [ ] Add items via dashboard → check bot shows it after refresh
- [ ] Remove items via dashboard → check bot reflects it
- [ ] Test with 0 available items - should show "Habis"
- [ ] Test with many items - should show correct count

## Files Modified

1. **`src/database/products.js`**: Enhanced `getAllProducts()` to fetch item counts
2. **`src/data/products.js`**: Updated to use `available_items` as stok value

## Restart Required

✅ **Bot needs to be restarted** to pick up the new code:
```bash
# Stop bot
Ctrl+C

# Start bot
npm start
# or
node bot-telegram/index.js
```

After restart:
1. Bot will fetch products WITH available items counts
2. Catalog will show correct stock from product_items
3. Dashboard and bot will be in sync

## Fallback Behavior

If `available_items` is not available:
- Falls back to `p.stok` from products table
- Shows `∞` if neither available
- This ensures backward compatibility

## Future Improvements

1. Add webhook to update bot cache when items change
2. Real-time sync without 5-minute cache delay
3. Per-user inventory visibility
4. Stock level warnings
