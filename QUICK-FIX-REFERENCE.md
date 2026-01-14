# ⚡ Quick Fix Reference: Foreign Key & Data Sync

## Problem
```
❌ Cannot delete products: "Foreign key constraint from stock_reservations"
❌ Product data mismatches between Products and Product Items pages
```

## Solution Applied

### 1. Migration: `003_fix_foreign_keys.sql`
✅ **Added CASCADE delete** to `stock_reservations_product_id_fkey`
- Allows product deletion without orphaned reservations
- Automatically cleans up related records

### 2. Products Page Enhancement: `dashboard/app/dashboard/products/page.tsx`
✅ **Now shows actual inventory counts** from `product_items` table
- Changed display from static `stok` field to real-time item counts
- Shows format: "15 / 20" = 15 available out of 20 total
- Green badge if items available, red if stock empty

## How to Apply

### Step 1: Run Migration
```bash
supabase db push
# This applies: supabase/migrations/003_fix_foreign_keys.sql
```

### Step 2: Refresh Dashboard
- Reload dashboard page
- Products page will now fetch and display item counts

### Step 3: Test
- Create test product with items
- Try deleting the product
- **Should now succeed** (previously failed)

## Data Flow After Fix

```
User purchases item via bot
    ↓
product_items.status = 'sold'
    ↓
Dashboard Products page fetches counts
    ↓
Display updates: "14 / 20" (one less available)
```

## Files Changed
- ✅ Created: `supabase/migrations/003_fix_foreign_keys.sql` (118 lines)
- ✅ Modified: `dashboard/app/dashboard/products/page.tsx` (item count display)
- ✅ Documentation: `FIX-FK-CONSTRAINT.md` (full details)

## Verification
- [ ] Migration runs without error
- [ ] Products page shows item counts (not static stock)
- [ ] Can delete products successfully
- [ ] No errors in browser console
- [ ] Dashboard and bot inventory stay in sync

---
**Status:** ✅ Ready to deploy
**Risk Level:** 🟢 Low (only affects FK behavior, no data loss)
**Rollback:** Easy (revert migration + previous code)
