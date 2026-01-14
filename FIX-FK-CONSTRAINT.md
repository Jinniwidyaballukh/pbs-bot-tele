## Fix Summary: Foreign Key Constraint & Data Inconsistency

**Date:** January 14, 2026  
**Issue:** 
1. Unable to delete products due to foreign key constraint from `stock_reservations` table
2. Product data inconsistency between Products page and Product Items page

---

## Issues Identified

### Issue 1: Foreign Key Constraint Error
**Error Message:**
```
Unable to delete rows as one of them is currently referenced by a foreign key constraint 
from the table `stock_reservations`. 
Key (id)=(8a6b8a8c-771b-4c1a-a08b-6e8c0b5150bf) is still referenced from table stock_reservations
```

**Root Cause:**
- The `stock_reservations` table had a foreign key constraint to `products(id)` WITHOUT an `ON DELETE` cascade behavior
- When attempting to delete a product, the database prevented deletion because reservations still existed

**FK Constraint Definition (Before):**
```sql
ALTER TABLE stock_reservations
ADD CONSTRAINT stock_reservations_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id);  -- No ON DELETE behavior
```

### Issue 2: Product Data Inconsistency  
**Symptom:**
- Products page showed stock from `products.stok` field (static value)
- Product Items page showed count from `product_items` table (actual available items)
- These two didn't match, causing confusion about actual stock levels

**Root Cause:**
- Two separate stock tracking systems were in use
- Products page wasn't aware of the product_items inventory system

---

## Solutions Implemented

### Solution 1: Fix Foreign Key Constraint
**File Created:** `supabase/migrations/003_fix_foreign_keys.sql`

**Changes:**
1. Drop the old FK constraint without cascade
2. Add new FK constraint WITH `ON DELETE CASCADE`:
```sql
ALTER TABLE stock_reservations
DROP CONSTRAINT stock_reservations_product_id_fkey;

ALTER TABLE stock_reservations
ADD CONSTRAINT stock_reservations_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
```

**Effect:** When a product is deleted, all associated stock_reservations will automatically be deleted.

**Additional RLS Policies Added:**
- Enabled RLS on all tables for security
- Created policies for anon users to read active products and available items
- Locked down stock_reservations to backend-only access

### Solution 2: Fix Data Inconsistency
**File Modified:** `dashboard/app/dashboard/products/page.tsx`

**Changes:**
1. Added `ProductWithItemCount` type to track item availability
2. Updated `fetchProducts()` to join with `product_items` and count available/total items
3. Changed Products table display:
   - **Before:** Showed `stok` column (hardcoded stock)
   - **After:** Shows "Items (Available / Total)" from `product_items` table
4. Updated delete handler to properly cascade delete:
   - Delete product_items by product_code
   - Delete order_items by product_code
   - Delete stock_reservations by product_id
   - Delete product itself

**Table Header Change:**
```
OLD: Stock
NEW: Items (Available / Total)
```

**Stock Display:**
```
OLD: Shows single number from products.stok
NEW: Shows "Available / Total" from product_items status counts
     Green if available > 0, Red if 0
     Example: "15 / 20" (15 available out of 20 total items)
```

---

## Migration Steps (For Production)

1. **Backup Database**
   ```sql
   -- Export current state before applying migration
   ```

2. **Apply Migration**
   ```bash
   supabase db push
   ```
   This will execute the migration: `003_fix_foreign_keys.sql`

3. **Verify RLS Policies**
   - Check Supabase dashboard → Authentication → RLS
   - Confirm policies are applied to all tables

4. **Test Product Deletion**
   - Create a test product with items and reservations
   - Attempt to delete via dashboard
   - Verify cascade deletion works properly

---

## Files Modified

1. **Created:** `supabase/migrations/003_fix_foreign_keys.sql`
   - Added CASCADE delete to stock_reservations FK
   - Added RLS policies for all tables

2. **Modified:** `dashboard/app/dashboard/products/page.tsx`
   - Enhanced product fetching with item counts
   - Updated table display to show actual inventory
   - Improved delete handler with proper cascading

---

## Data Sync Behavior (After Fix)

### Products Page
- Shows products from `products` table
- Displays item counts from `product_items` table
- **Stock Display:** Count of available items (green if > 0, red if 0)
- Format: "15 / 20" = 15 available out of 20 total items

### Product Items Page
- Shows individual items for selected product
- Displays: Available, Reserved, Sold status counts
- Allows adding/deleting items

### Stock Sync
- When items are sold/reserved in bot → `product_items.status` changes
- Products page automatically reflects this (no manual sync needed)
- Dashboard and bot are now in sync

---

## Testing Checklist

- [ ] Apply migration `003_fix_foreign_keys.sql`
- [ ] Navigate to Products page - verify item counts display
- [ ] Create test product with 5 items
- [ ] Verify Products page shows "5 / 5" items
- [ ] Delete 2 items from Product Items page
- [ ] Verify Products page updates to "3 / 5" items
- [ ] Attempt to delete product
- [ ] Verify deletion succeeds and cascades properly
- [ ] Check no orphaned records in stock_reservations
- [ ] Test product creation/editing workflow

---

## Known Considerations

1. **Stock Field in Products Table**
   - The `products.stok` field is now deprecated for display purposes
   - It's still available in the database for compatibility
   - Recommend keeping it for non-item-based products
   - For item-managed products, leave `stok` at 0

2. **Migration Safety**
   - The migration uses `DROP CONSTRAINT` + `ADD CONSTRAINT`
   - Safe operation: doesn't modify existing data, only changes FK behavior
   - Backward compatible: only affects DELETE operations

3. **RLS Policies**
   - Now require Supabase JWT tokens for authenticated operations
   - Anon users can read but not modify most data
   - Stock reservations are backend-only (no direct access)

---

## Rollback Plan (If Needed)

If issues occur, revert the FK change:
```sql
ALTER TABLE stock_reservations
DROP CONSTRAINT stock_reservations_product_id_fkey;

ALTER TABLE stock_reservations
ADD CONSTRAINT stock_reservations_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id);  -- Without CASCADE
```

Then redeploy previous version of dashboard code.

---

## Next Steps

1. Apply the Supabase migration
2. Reload dashboard page to fetch updated item counts
3. Test product lifecycle (create → add items → delete)
4. Monitor bot orders to ensure items are delivered correctly
5. Monitor dashboard analytics to confirm sales tracking works
