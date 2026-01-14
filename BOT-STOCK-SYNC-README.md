# ⚡ Bot Stock Sync - Quick Action

## What Was Fixed?
Bot now shows **real-time available items count** from dashboard instead of hardcoded stock field.

## Files Changed
- ✅ `src/database/products.js` - Fetches available items count
- ✅ `src/data/products.js` - Uses available items as stock

## What You Need to Do

### Step 1: Restart the Bot
```bash
# Stop current bot (if running)
Ctrl+C

# Start bot again
npm start
# (or: node bot-telegram/index.js)
```

### Step 2: Verify Sync
1. Go to dashboard → Products page
2. Check item counts (e.g., "3 / 5")
3. Go to bot → send `/menu` or `/catalog`
4. Check bot shows "Stok: 3" (matches available count)

### Step 3: Test Updates
- Add items in dashboard
- Wait 30 seconds or click Refresh in bot
- Check bot shows new count

## Expected Result

**Before Fix:**
- Bot: "Stok: 2" (hardcoded)
- Dashboard: "3 / 5" (real data)
- ❌ Mismatch!

**After Fix:**
- Bot: "Stok: 3" (from product_items)
- Dashboard: "3 / 5" (from product_items)
- ✅ Synced!

## How It Works
```
product_items table (available=3, reserved=1, sold=1, total=5)
    ↓
Bot fetches counts on startup
    ↓
Bot shows: "Stok: 3"
    ↓
Bot refreshes every 30 min
    ↓
Dashboard always shows: "3 / 5"
    ↓
✅ SYNCED!
```

## Done! ✓
Bot and dashboard now use the same inventory system (product_items).
