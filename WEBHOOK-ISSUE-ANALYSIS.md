# 🚨 WEBHOOK ISSUE ANALYSIS

## Problems Found

### Problem 1: Webhook Endpoint Test Failed
**From Screenshot:** Midtrans dashboard shows "Tes gagal" (Test failed)
```
Endpoint URL: https://pbs-bot-tele-production.up.railway.app/webhook/midtrans
Status: ❌ Tes gagal (Test failed)
Error: "Gagal mengirim notifikasi HTTP karena terdapat kendala pada URL."
```

**Meaning:** Midtrans cannot reach the webhook endpoint

---

### Problem 2: Webhook Signature Missing
**From Bot Logs:**
```
[WEBHOOK] Missing signature {"orderId":"ORD-1768373701821-1099822426"}
[WEBHOOK] Missing signature {"orderId":"payment_notif_test_G810582154_0a3489ce-096f-4dc4-b0da-edb60472a5b6"}
```

**Meaning:** Bot is receiving webhook calls but signature verification failing

---

### Problem 3: Still The RLS Error
**From Bot Logs:**
```
[ORDER PERSIST WARN] Could not persist order/user: 
  new row violates row-level security policy for table "users"

[FINALIZE ERROR] ⚠️ Finalize gagal: no_reserved_items
[FINALIZE ERROR] ⚠️ No items returned for order ORD-1768373701821-1099822426!

Failed to update order status: Cannot coerce the result to a single JSON object
```

**Root Cause:** Same RLS policy issue we identified

---

## 🔍 Root Cause Analysis

### Why Webhook Test Failed?

**Possibility 1: Webhook Not Running**
```
Bot might be offline or webhook endpoint not listening
Check: Is bot running? npm start
```

**Possibility 2: URL Accessible But Returns Error**
```
Endpoint exists but returns error (401, 403, 500, etc)
Midtrans sees error → marks as "failed"
```

**Possibility 3: Bot Behind Firewall/Network Issue**
```
Railway network blocking Midtrans requests
Or incorrect domain/port configuration
```

**Possibility 4: Webhook Route Not Implemented Correctly**
```
Route exists but doesn't handle GET request (Midtrans tests with GET first)
```

### Why Signature Missing?

**From Logs:**
```
[WEBHOOK] Missing signature {"orderId":"ORD-1768373701821-1099822426"}
```

This suggests:
1. Webhook was called (✅ endpoint reachable)
2. But signature verification failed (❌ not from Midtrans or invalid)
3. Bot rejected the request

---

## 📁 Files to Check

### 1. Webhook Handler
**File:** `src/bot/handlers/webhook.js`
- Check: Route definition
- Check: Signature verification
- Check: Error handling

### 2. Server Setup
**File:** `bot-telegram/index.js` or `src/bot/config.js`
- Check: Webhook endpoint configuration
- Check: Port configuration
- Check: Error handling

### 3. Environment Variables
**File:** `.env.local`
- Check: MIDTRANS_SERVER_KEY (needed for verification)
- Check: WEBHOOK_URL
- Check: Bot token

---

## ✅ What Needs to be Fixed

### Fix 1: RLS Policy (Primary)
- Migration 004 - Already created ✅
- Disable RLS on users table
- Allow bot to insert orders

### Fix 2: Webhook Endpoint
- Make sure endpoint is reachable from internet
- Verify signature verification logic
- Handle GET requests (Midtrans test endpoint with GET)
- Return proper 200 OK response

### Fix 3: Midtrans Webhook Configuration
- Test endpoint again after fixes
- Verify URL is correct
- Check Railway networking settings

---

## 🔧 Recommended Actions

### Step 1: Check if Webhook Endpoint is Reachable
```bash
# Test from terminal
curl -X GET https://pbs-bot-tele-production.up.railway.app/webhook/midtrans
# Should return error or something, NOT connection refused
```

### Step 2: Check Bot Webhook Handler
Look at: `src/bot/handlers/webhook.js`
- Does it accept GET requests? (Midtrans test uses GET)
- Does it verify signature correctly?
- Does it return 200 OK on success?

### Step 3: Verify Midtrans Server Key
```bash
# In .env.local
echo $MIDTRANS_SERVER_KEY
# Should be set and correct for signature verification
```

### Step 4: Apply RLS Migration
- This will fix the order persist error
- Then webhook can actually save the order

### Step 5: Test Midtrans Webhook Again
After RLS fix, webhook should work

---

## 📋 Expected Webhook Flow (After Fix)

```
Midtrans: Payment settled
    ↓
Midtrans: Call webhook endpoint
    ↓
Bot receives: POST /webhook/midtrans
    ↓
Bot verifies: Signature using MIDTRANS_SERVER_KEY ✅
    ↓
Bot processes: handlePaymentSuccess()
    ↓
✅ User inserted (RLS fixed)
✅ Order created
✅ Items reserved
✅ Items finalized
✅ Items sent to user
    ↓
Bot returns: 200 OK
    ↓
Midtrans: Webhook successful
```

---

## 🚨 Why Payment Failed (Complete Chain)

```
1. RLS Policy Error
   └─ User cannot be inserted
   └─ Order cannot be created
   └─ Items cannot be reserved
   └─ When webhook tries to finalize → no items to finalize
   └─ Order status cannot be updated

2. Webhook Test Failed (Midtrans Side)
   └─ Either endpoint not reachable
   └─ Or endpoint returns error
   └─ Midtrans marks webhook as broken
   └─ Webhook goes to retry queue

3. Signature Missing (Bot Side)
   └─ Webhook calls came through
   └─ But signature verification failed
   └─ Could be:
      - MIDTRANS_SERVER_KEY not set correctly
      - Request format not matching expected
      - Signature algorithm mismatch

Result: Complete payment flow failure 🔴
```

---

## ✅ Complete Fix Needed

### Part 1: RLS Policy (Migration 004)
- Already created and ready
- Solves: User insert, order creation, item reservation, finalization

### Part 2: Webhook Verification
- Check: MIDTRANS_SERVER_KEY in .env.local
- Check: Webhook handler signature logic
- Check: Return proper 200 OK response
- Test: Midtrans endpoint test again

### Part 3: Endpoint Accessibility
- Check: Railway networking
- Check: Endpoint URL correct
- Check: Bot running and listening
- Test: curl to endpoint

---

## 📝 Action Items

1. **Check webhook handler code** - See if signature verification correct
2. **Verify environment variables** - MIDTRANS_SERVER_KEY set?
3. **Test endpoint accessibility** - Can Midtrans reach it?
4. **Apply RLS migration 004** - Fix database errors
5. **Test webhook again** - Midtrans endpoint test
6. **Run verification script** - Confirm all working

---

## 🎯 Next Steps

Want me to:
1. Read and analyze webhook handler code? (check `src/bot/handlers/webhook.js`)
2. Check environment variable configuration?
3. Create webhook debugging/fixing script?
4. Provide webhook implementation best practices?

Which would be most helpful?
