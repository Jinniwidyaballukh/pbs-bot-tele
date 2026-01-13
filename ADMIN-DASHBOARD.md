# 🎛️ Admin Dashboard - Complete Guide

## 📋 Overview

Admin Dashboard adalah aplikasi web Next.js yang digunakan untuk mengelola semua data PBS Telegram Bot melalui interface grafis. Dibangun dengan **Next.js 14**, **Supabase**, dan **Tailwind CSS**.

**Access**: http://localhost:3000 (development) atau production URL

---

## 🎯 Features

### 1. **Dashboard Home**
- 📊 Statistik real-time (products, items, orders, users)
- 📈 Quick overview of system status
- 🔗 Quick access links ke management pages

### 2. **Products Management** 
- ➕ Add/Edit/Delete products
- 📦 View product list dengan search
- 💰 Manage pricing dan stock
- 📝 Product details (code, name, category, description)

### 3. **Product Items Management** 
- 🎁 Add items ke products (email:password, vouchers, codes)
- 📊 View item status (available, reserved, sold, invalid)
- 🔄 Track item lifecycle
- 📋 Copy item data to clipboard
- 🏷️ Batch operations

### 4. **Orders Management**
- 📋 View all customer orders
- 🔍 Search dan filter orders
- 💵 Revenue tracking
- 📊 Order status visualization

### 5. **Analytics Dashboard**
- 📈 Revenue charts (last 7 days)
- 📊 Orders trends
- 💹 KPI metrics (total revenue, avg order value)
- 🎯 Conversion rate

### 6. **User Management**
- 👥 View registered users
- 📊 User statistics
- 🛣️ Purchase history tracking
- (Placeholder untuk future user tracking)

### 7. **Settings**
- 🔐 Account information
- 🔑 Change password
- 📊 System information
- 🚪 Sign out

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Supabase project setup (done ✅)
- .env.local dengan Supabase credentials

### Setup

1. **Install dependencies** (already done):
```bash
npm install
```

2. **Environment Variables** (.env.local):
```env
NEXT_PUBLIC_SUPABASE_URL=https://jhrxusliijrgrulrwxjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dFStk0P7p2RhCFAOVTi6lA_8502zEzK
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Create Admin Account** in Supabase:
   - Go to: Supabase Dashboard → Authentication → Users
   - Click "Add user" → Create with email/password
   - Use credentials to login to dashboard

4. **Run Development Server**:
```bash
npm run dev
```

5. **Access Dashboard**:
- URL: http://localhost:3000
- Login dengan admin email/password
- Dashboard siap digunakan!

---

## 🔐 Authentication

Dashboard menggunakan **Supabase Authentication** dengan email/password.

### Create Admin Account:
```
Email: admin@yourstore.com
Password: secure-password-123
```

### Login Flow:
1. User visit `/login`
2. Enter email & password
3. Supabase auth verify credentials
4. Session created, redirect to `/dashboard`
5. Middleware protect routes (require session)

### Logout:
- Click "Logout" button di sidebar
- Session dihapus, redirect ke `/login`

---

## 📁 Project Structure

```
dashboard/
├── app/
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── dashboard/
│       ├── layout.tsx         # Dashboard layout + sidebar
│       ├── page.tsx           # Dashboard home
│       ├── products/
│       │   └── page.tsx       # Products management
│       ├── items/
│       │   └── page.tsx       # Product items management
│       ├── orders/
│       │   └── page.tsx       # Orders management
│       ├── users/
│       │   └── page.tsx       # Users management
│       ├── analytics/
│       │   └── page.tsx       # Analytics dashboard
│       └── settings/
│           └── page.tsx       # Settings & account
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── database.types.ts      # TypeScript types
├── public/                     # Static files
├── middleware.ts               # Route protection
├── next.config.ts             # Next.js config
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind config
└── package.json
```

---

## 💻 How to Use

### Adding Products

1. **Click "Products" di sidebar**
2. **Click "Add Product" button**
3. **Fill form:**
   - Code: `canvahead`
   - Name: `Canva Pro 1 Head 1 Bulan`
   - Category: `Software`
   - Price: `49000`
   - Stock: `10` (akan auto-sync dengan items count)
   - Description: `Akun premium Canva...`
4. **Click "Create"**

### Adding Items ke Product

1. **Click "Product Items" di sidebar**
2. **Select product dari dropdown**
3. **Click "Add Items" button**
4. **Paste items (satu per baris):**
   ```
   email1@test.com:password123
   email2@test.com:password456
   email3@test.com:password789
   ```
5. **Click "Add Items"**

### Viewing Orders

1. **Click "Orders" di sidebar**
2. **View order list dengan status**
3. **Filter by status** (pending, paid, shipped, completed, cancelled)
4. **Search** by order number atau user ID

### Checking Analytics

1. **Click "Analytics" di sidebar**
2. **View KPI cards** (revenue, orders, avg order value)
3. **See charts** (revenue & orders last 7 days)

---

## 🔄 Workflow

### Product Lifecycle

```
1. Create Product
   └─→ Add to products table
       
2. Add Items
   └─→ Items added as "available"
   └─→ Stock auto-sync (stock = available items count)
   
3. Customer Purchases
   └─→ Items reserved (status = "reserved")
   └─→ Payment pending (15 min timeout)
   
4. Payment Success
   └─→ Items finalized (status = "sold")
   └─→ Item data sent to customer
   └─→ Stock decreases
   
5. Payment Failed/Expired
   └─→ Items released (status = "available")
   └─→ Stock restored
```

---

## 🛠️ API Routes

Dashboard menggunakan Supabase API directly. Untuk advanced operations, Anda bisa create API routes di:

```
dashboard/app/api/
```

Example:
```typescript
// dashboard/app/api/products/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Fetch product dari Supabase
  // Return JSON
}
```

---

## 📊 Database Integration

Dashboard terhubung ke Supabase dengan tables:

| Table | Purpose |
|-------|---------|
| `products` | Product catalog |
| `product_items` | Individual items per product |
| `orders` | Customer orders |
| `order_items` | Items dalam order |
| `users` | (Optional) User profiles |

### Real-time Updates:
Dashboard support Supabase real-time subscriptions:

```typescript
const subscription = supabase
  .from('products')
  .on('*', payload => {
    // Update UI saat ada perubahan
  })
  .subscribe()
```

---

## 🚀 Deployment

### Deploy ke Vercel (Recommended)

1. **Push ke GitHub:**
```bash
git add .
git commit -m "Add admin dashboard"
git push
```

2. **Connect Vercel:**
   - Visit: vercel.com
   - Import project from GitHub
   - Add environment variables
   - Deploy!

3. **Set Environment Variables di Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Access Production:
```
https://your-domain.vercel.app
```

---

## 🔒 Security Best Practices

1. **RLS (Row Level Security)** di Supabase:
   - Admin users hanya bisa akses data milik mereka
   - Implement RLS policies

2. **Environment Variables**:
   - Service role key JANGAN di expose ke client
   - Gunakan anon key untuk client-side
   - Service key hanya untuk server-side operations

3. **Rate Limiting**:
   - Implement di API routes
   - Prevent brute force attacks

4. **Audit Logging**:
   - Log semua admin actions
   - Store di database untuk tracking

---

## 📝 Admin Actions Logging

Implement action logging:

```typescript
async function logAdminAction(
  adminId: string, 
  action: string, 
  details: any
) {
  await supabase
    .from('admin_logs')
    .insert({
      admin_id: adminId,
      action,
      details,
      timestamp: new Date()
    })
}
```

---

## 🆘 Troubleshooting

### Login tidak berfungsi
- ❌ Check .env.local variables
- ❌ Verify admin account di Supabase
- ❌ Check browser console untuk errors

### Data tidak muncul
- ❌ Verify Supabase URL & keys
- ❌ Check RLS policies di Supabase
- ❌ Ensure data exists in database

### Slow performance
- ❌ Use pagination untuk large datasets
- ❌ Implement caching
- ❌ Check Supabase database query performance

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Recharts](https://recharts.org)

---

## ✅ Checklist

- [ ] Setup Next.js project
- [ ] Install dependencies
- [ ] Configure .env.local
- [ ] Create admin account in Supabase
- [ ] Run `npm run dev`
- [ ] Login to dashboard
- [ ] Add test product
- [ ] Add test items
- [ ] Check orders page
- [ ] View analytics
- [ ] Test settings page
- [ ] Deploy to Vercel

---

**Status**: ✅ Ready to Use!

Dashboard admin sekarang siap digunakan untuk mengelola PBS Telegram Bot! 🚀
