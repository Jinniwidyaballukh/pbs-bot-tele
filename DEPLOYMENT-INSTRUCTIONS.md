# 🚀 DEPLOYMENT INSTRUCTIONS - FOLLOW EXACTLY

## ⚠️ CRITICAL - Do This In Order!

---

## STEP 1️⃣: Apply RLS Migration (2 minutes)

### 1a. Open Supabase
- URL: https://app.supabase.com
- Login dengan account Anda
- Select project: **PBS-Manager**

### 1b. Navigate to SQL Editor
- Click sidebar: **SQL Editor** 
- Click: **+ New Query**

### 1c. Copy Migration SQL
- Open file in VS Code: `supabase/migrations/004_fix_rls_policies.sql`
- Select all (Ctrl+A)
- Copy (Ctrl+C)

### 1d. Paste in Supabase
- Click SQL Editor text area
- Paste (Ctrl+V)
- You should see SQL code filling the editor

### 1e. Execute
- Click **Run** button (or Ctrl+Enter)
- Wait for completion (should be fast)
- Look for: **"success"** message at bottom

### 1f. Verify
- If you see error, note it down
- If you see success, great! ✅
- Don't proceed if there's error

**Status:** Migration 004 applied ✅

---

## STEP 2️⃣: Pull Code Updates (1 minute)

### 2a. Terminal/Command Line
```bash
cd d:\Bot\bot-telegram-pbs
```

### 2b. Check Git Status
```bash
git status
```
You should see:
```
On branch main
Your branch is up to date with 'origin/main'.
```

### 2c. Pull Latest (If needed)
```bash
git pull
```

### 2d. Verify Changes
```bash
git diff HEAD
```
Should show changes to:
- `src/bot/handlers/webhook.js`
- `src/payments/midtrans.js`

**Status:** Code updates pulled ✅

---

## STEP 3️⃣: Restart Bot (1 minute)

### 3a. Stop Current Bot
- If bot running: Press `Ctrl+C` in terminal
- Wait for it to stop

### 3b. Start Bot
```bash
npm start
```

### 3c. Wait for Startup
- Watch terminal for message:
  ```
  ✅ Telegram bot connected and listening...
  ```
- Wait for this message!
- Do NOT proceed until you see this

### 3d. Verify Bot Running
- Check: No error messages
- Check: Telegram bot is responsive
- Check: Bot logs showing activity

**Status:** Bot restarted ✅

---

## STEP 4️⃣: Test Payment Flow (2 minutes)

### 4a. Open Telegram

### 4b. Send Command
- Type: `/buy ytbg`
- Press Enter
- Bot should respond with product details

### 4c. Confirm Purchase
- Follow bot instructions
- Select quantity: 1
- Confirm amount: Rp 1.000
- Bot generates QR code

### 4d. Make Payment
- Option 1: Scan QR with phone
- Option 2: Click "Buka di app Midtrans"
- Option 3: Enter OTP if available
- Complete payment in Midtrans
- Wait for "Pembayaran Berhasil"

### 4e. Wait for Bot Response
- Bot should send: "✅ Item telah dikirim ke chat Anda"
- Bot should send: Product codes (ytbg: CODE_XXXXX)
- Wait up to 1 minute

### 4f: Check Logs
- Open terminal where bot running
- Look for:
  ```
  [WEBHOOK] Midtrans notification
  [MIDTRANS] Signature Verify: { ... isValid: true }
  [PAYMENT SUCCESS] ✅ Processing payment
  [DELIVERY] Sending items to user
  ```

**Status:** Payment flow tested ✅

---

## STEP 5️⃣: Verify Dashboard (1 minute)

### 5a. Open Dashboard
- URL: Your dashboard URL (check Railway or local)
- Login if needed

### 5b. Navigate to Orders
- Click: **Orders** page
- Look at: Top of page

### 5c. Check Order List
- Should see: 1 new order
- Status: Should show **"Paid"**
- Items: Should show **"ytbg (1)"**
- Total: Should show **"Rp 1.000"**

**Status:** Dashboard verified ✅

---

## STEP 6️⃣: Verify Midtrans Webhook (30 seconds)

### 6a. Open Midtrans Dashboard
- Go to: https://dashboard.midtrans.com (or your environment)
- Login

### 6b. Navigate to Settings
- Click: **Settings** or Gear icon
- Look for: **Webhook** or **Notification**

### 6c. Find Your Endpoint
- Should see: `https://pbs-bot-tele-production.up.railway.app/webhook/midtrans`
- Status: Should be **Configured**

### 6d. Test Endpoint
- Click: **"Tes URL notifikasi"** (Test notification URL)
- Or click: Test button
- Wait for result

### 6e. Check Result
- Should see: ✅ **Success** (or green checkmark)
- Should NOT see: ❌ Failed or red X
- If failed: Check if bot is running

**Status:** Webhook verified ✅

---

## ✅ FINAL VERIFICATION

If ALL of these are TRUE, deployment is SUCCESSFUL:

- [ ] RLS migration applied in Supabase (no errors)
- [ ] Code updated (webhook and signature fixes)
- [ ] Bot restarted successfully
- [ ] Bot logs show successful message delivery
- [ ] Test payment created order in database
- [ ] Dashboard shows new order (Paid status)
- [ ] Bot sent item codes to Telegram
- [ ] Midtrans webhook endpoint test shows SUCCESS
- [ ] Bot logs show [DELIVERY] message
- [ ] Bot logs show signature verification passed

**All checked? → 🟢 DEPLOYMENT SUCCESSFUL!**

---

## 🚨 IF SOMETHING GOES WRONG

### Problem: RLS Migration Failed
**Fix:**
1. Check error message in Supabase
2. Try running SQL again
3. Read: `supabase/RLS-FIX-GUIDE.md` troubleshooting
4. Contact: Share the error message

### Problem: Bot Won't Start
**Fix:**
1. Check: Node.js installed (`node -v`)
2. Check: npm packages (`npm install`)
3. Check: Environment variables (`.env.local`)
4. Try: Restart terminal
5. Read: Bot startup logs

### Problem: Payment Test Fails
**Fix:**
1. Ensure bot is running (`npm start`)
2. Check: Midtrans credentials
3. Check: Bot logs for errors
4. Try: Another test payment
5. Check: Telegram bot token valid

### Problem: Items Not Delivered
**Fix:**
1. Check bot logs for [DELIVERY] message
2. Check: RLS migration applied?
3. Check: Bot restarted after migration?
4. Run: `node scripts/verify-rls-fix.js`
5. Check: Database has order created

### Problem: Webhook Endpoint Still Fails
**Fix:**
1. Ensure bot is running
2. Check bot logs for signature verification
3. Restart bot: `npm start`
4. Test again in Midtrans dashboard
5. Check: Firewall/network issues

---

## 📞 QUICK REFERENCE

| Step | Time | What | Check |
|------|------|------|-------|
| 1 | 2 min | RLS migration | Supabase success |
| 2 | 1 min | Code update | Files updated |
| 3 | 1 min | Restart bot | Bot running |
| 4 | 2 min | Test payment | Items received |
| 5 | 1 min | Check dashboard | Order visible |
| 6 | 30 sec | Webhook test | ✅ Success |
| **Total** | **~8 min** | **Full deployment** | **All checked ✅** |

---

## 🎯 SUCCESS INDICATORS

You'll know it worked when you see:

### In Bot Logs
```
[WEBHOOK] ✅ Payment SUCCESS untuk ORD-...
[MIDTRANS] Signature Verify: { ... isValid: true }
[FINALIZE] Finalizing items...
[DELIVERY] Sending items to user
```

### In Telegram
```
✅ Item telah dikirim ke chat Anda

Products: ytbg
- CODE_XXXXX
```

### In Dashboard
```
Orders: 1 (was 0)
Status: Paid
Items: ytbg (1)
Total: Rp 1.000
```

### In Midtrans
```
Webhook endpoint test: ✅ SUCCESS
Payment: Settlement
Last notification: Success
```

---

## 🎉 COMPLETION

Once all steps done and all verifications pass:

✨ **Payment flow is 100% working!**
✨ **Orders are being created**
✨ **Items are being delivered**
✨ **Dashboard is being updated**
✨ **Midtrans webhook is processing**

**Congratulations! 🎊 System is live and operational!**

---

## 📝 Keep This Handy

Save this file for reference:
- Next time need to deploy
- If issues come up
- For troubleshooting

---

**Ready to deploy? Start with STEP 1️⃣!** 🚀
