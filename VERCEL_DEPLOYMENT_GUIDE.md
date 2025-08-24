# 🚀 Vercel Deployment Guide for GuruSingapore

## 1. Environment Variables Setup di Vercel

### **Wajib Diisi (Critical untuk Fungsionalitas):**

#### **Supabase Configuration:**
```bash
# Required - Supabase connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### **Domain Configuration:**
```bash
# Required - Your site domain
NEXT_PUBLIC_SITE_DOMAIN=gurusingapore.com
ADMIN_SUBDOMAIN=admin.gurusingapore.com
NEXT_PUBLIC_ADMIN_URL=https://admin.gurusingapore.com
```

#### **Security:**
```bash
# Required - JWT secret for admin authentication
JWT_SECRET=your-32-character-jwt-secret-key-here
```

### **Opsional (Enhancements):**

#### **Google Analytics (Recommended):**
```bash
# Optional - Google Analytics tracking
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### **Sentry (Error Monitoring):**
```bash
# Optional - Error tracking and performance monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.05
SENTRY_PROFILES_SAMPLE_RATE=0.01
SENTRY_REPLAYS_SAMPLE_RATE=0.01
```

#### **Additional Security:**
```bash
# Optional - Admin security features
DISABLE_PIN_RATE_LIMIT=0
ADMIN_IP_WHITELIST=your-ip-address
```

## 2. Cara Setup Environment Variables di Vercel

### **Step-by-step:**

1. **Login ke Vercel Dashboard:**
   - Kunjungi [vercel.com](https://vercel.com)
   - Pilih project "GuruSingapore"

2. **Setting Environment Variables:**
   - Klik **"Settings"** → **"Environment Variables"**
   - Klik **"Add New..."** untuk setiap variable

3. **Input Variables:**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project.supabase.co
   Environments: Production, Preview, Development

   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: your-anon-key-here
   Environments: Production, Preview, Development

   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: your-service-role-key-here
   Environments: Production, Preview, Development

   Name: NEXT_PUBLIC_SITE_DOMAIN
   Value: gurusingapore.com
   Environments: Production, Preview, Development

   Name: ADMIN_SUBDOMAIN
   Value: admin.gurusingapore.com
   Environments: Production, Preview, Development

   Name: JWT_SECRET
   Value: your-32-character-jwt-secret-key-here
   Environments: Production, Preview, Development
   ```

4. **Deploy Ulang:**
   - Setelah menambahkan semua environment variables
   - Klik **"Redeploy"** untuk menerapkan perubahan

## 3. Supabase Configuration

### **Realtime Settings (Important untuk fix console errors):**

1. **Login ke Supabase Dashboard:**
   - Kunjungi [supabase.com](https://supabase.com)
   - Pilih project Anda

2. **Settings → Realtime:**
   - **Enable Realtime:** ✅ ON
   - **Max connections per second:** 10 (recommended untuk mobile)
   - **Max events per second:** 10 (recommended untuk mobile)

3. **Settings → API:**
   - **Enable RLS (Row Level Security):** ✅ ON
   - **Enable Realtime:** ✅ ON

4. **Database → Replication:**
   - Enable replication untuk tabel yang butuh realtime:
     - `user_favorites`
     - `player_reviews`
     - `casinos` (untuk updates)

## 4. Domain Configuration

### **Custom Domain Setup:**

1. **Di Vercel:**
   - **Settings** → **Domains**
   - Add `gurusingapore.com`
   - Add `admin.gurusingapore.com`

2. **Di Domain Provider:**
   - Point `gurusingapore.com` → Vercel nameservers
   - Point `admin.gurusingapore.com` → Vercel nameservers

3. **SSL Certificate:**
   - Vercel akan otomatis provide SSL
   - Pastikan domain verified ✅

## 5. Verification Steps

### **Setelah Deploy, Test Ini:**

1. **Browser Console Check:**
   ```javascript
   // Should not see these errors anymore:
   // ❌ Refused to connect to 'wss://...' because it violates CSP
   // ❌ Google Analytics not loaded
   // ❌ Failed to load resource: favicon.ico
   ```

2. **Supabase Connection Test:**
   ```javascript
   // Should work without errors:
   // ✅ Realtime connection established
   // ✅ Database queries working
   ```

3. **Google Analytics Test:**
   ```javascript
   // If GA_ID is set:
   // ✅ Google Analytics loaded successfully
   ```

## 6. Troubleshooting

### **Common Issues:**

#### **Environment Variables Not Working:**
- Pastikan variable name **case-sensitive**
- Restart deployment setelah menambah variable
- Check Vercel function logs untuk error messages

#### **Supabase Realtime Not Working:**
- Check **Realtime settings** di Supabase dashboard
- Pastikan **RLS policies** configured correctly
- Verify **anon key** has proper permissions

#### **Domain Issues:**
- Tunggu DNS propagation (bisa sampai 24 jam)
- Check domain verification status di Vercel
- Pastikan SSL certificate issued

## 7. Performance Optimization

### **Vercel Settings:**
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### **Edge Functions:**
- Enable **Edge Runtime** untuk middleware
- Monitor **Function Duration** di dashboard

## 8. Monitoring & Analytics

### **Setelah Setup Lengkap:**

1. **Google Analytics:**
   - Track user behavior dan performance
   - Monitor Core Web Vitals
   - A/B test different features

2. **Vercel Analytics:**
   - Real-time performance monitoring
   - Error tracking
   - Function usage statistics

3. **Supabase Dashboard:**
   - Database performance monitoring
   - Query optimization insights
   - Realtime connection monitoring

## 📞 Support

Jika ada masalah:
1. Check **Vercel Function Logs** untuk error details
2. Verify **Environment Variables** di Vercel dashboard
3. Test **Supabase connection** di dashboard
4. Check **Domain DNS settings**

---

**🎯 Summary:**
- **6 Critical** environment variables wajib diisi
- **Supabase Realtime** perlu dikonfigurasi untuk fix console errors
- **Domain setup** penting untuk full functionality
- **Test thoroughly** setelah deployment
