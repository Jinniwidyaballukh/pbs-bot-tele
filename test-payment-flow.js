// test-payment-flow.js
// Test script untuk debug masalah pembayaran dan finalize items

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL atau SUPABASE_ANON_KEY tidak ada di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPaymentFlow() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 DEBUG PAYMENT & FINALIZE FLOW');
  console.log('═'.repeat(60) + '\n');

  try {
    // 1. Cek order yang terakhir (PAID)
    console.log('1️⃣  Mengambil order terakhir dengan status PAID...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1);

    if (orderError) throw orderError;
    
    if (!orders || orders.length === 0) {
      console.log('   ❌ Tidak ada order dengan status PAID');
      return;
    }

    const order = orders[0];
    console.log(`   ✅ Order ditemukan:`);
    console.log(`      Order ID: ${order.order_id}`);
    console.log(`      Status: ${order.status}`);
    console.log(`      User ID: ${order.user_id}`);
    console.log(`      Total: ${order.total_amount}`);
    console.log();

    // 2. Cek reserved items
    console.log('2️⃣  Mencari reserved items untuk order ini...');
    const { data: items, error: itemError } = await supabase
      .from('product_items')
      .select('*')
      .eq('reserved_for_order', order.order_id);

    if (itemError) throw itemError;

    if (!items || items.length === 0) {
      console.log('   ⚠️  Tidak ada reserved items!');
      console.log('   Ini kemungkinan masalah - items seharusnya di-reserve saat pembayaran pending');
      console.log();
    } else {
      console.log(`   ✅ Ditemukan ${items.length} reserved items:`);
      items.forEach((item, i) => {
        console.log(`      ${i + 1}. ${item.product_code} - Status: ${item.status}`);
        console.log(`         Data: ${item.item_data}`);
      });
      console.log();
    }

    // 3. Cek order_items
    console.log('3️⃣  Mengambil order_items dari database...');
    const { data: orderItems, error: oiError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (oiError) throw oiError;

    if (!orderItems || orderItems.length === 0) {
      console.log('   ❌ Tidak ada order_items!');
      console.log('   Ini MASALAH - order_items seharusnya dibuat saat finalize');
    } else {
      console.log(`   ✅ Ditemukan ${orderItems.length} order_items:`);
      orderItems.forEach((oi, i) => {
        console.log(`      ${i + 1}. ${oi.product_code} (qty: ${oi.quantity})`);
        console.log(`         Item Data: ${oi.item_data || 'KOSONG'}`);
        console.log(`         Sent: ${oi.sent}`);
      });
      console.log();
    }

    // 4. Test finalize_items_for_order RPC
    console.log('4️⃣  Testing finalize_items_for_order RPC...');
    const { data: finalizeResult, error: finalizeError } = await supabase
      .rpc('finalize_items_for_order', {
        p_order_id: order.order_id,
        p_user_id: order.user_id,
      });

    if (finalizeError) {
      console.log(`   ❌ RPC Error: ${finalizeError.message}`);
      console.log(`   Code: ${finalizeError.code}`);
    } else {
      console.log(`   ✅ RPC Success:`);
      console.log(`      ${JSON.stringify(finalizeResult, null, 2)}`);
    }

    console.log();

    // 5. Summary
    console.log('5️⃣  RINGKASAN MASALAH:\n');
    
    if (!items || items.length === 0) {
      console.log('❌ PROBLEM #1: Tidak ada reserved items');
      console.log('   → Ini berarti reserve_items_for_order tidak berhasil atau tidak dipanggil');
      console.log('   → Atau items tidak ada di product_items table');
      console.log();
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('❌ PROBLEM #2: Tidak ada order_items');
      console.log('   → createOrderItems() tidak berhasil atau tidak dipanggil');
      console.log('   → Items tidak pernah terkirim ke user');
      console.log();
    }

    if (items && items.length > 0 && (!orderItems || orderItems.length === 0)) {
      console.log('⚠️  ANALISIS: Items di-reserve tapi tidak di-finalize');
      console.log('   → handlePaymentSuccess() tidak berhasil');
      console.log('   → Kemungkinan error di finalizeStock() atau createOrderItems()');
      console.log();
    }

    if (items && items.length === 0 && orderItems && orderItems.length > 0) {
      console.log('✅ Ini OK - items sudah di-finalize (tidak reserved lagi)');
      console.log();
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run test
debugPaymentFlow();
