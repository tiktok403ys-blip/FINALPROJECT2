# 🔧 Supabase Realtime Connection Fix

## Problem:
Browser console menampilkan error:
```
Refused to connect to 'wss://oypqykrfinmrvvsjfyqd.supabase.co/realtime/v1/websocket' because it violates the following Content Security Policy directive
```

## Solution Applied:

### ✅ **Middleware CSP Update:**
Sudah diperbaiki di `middleware.ts`:
```javascript
'Content-Security-Policy': `
  default-src 'self';
  connect-src 'self' *.supabase.co *.google-analytics.com wss://*.supabase.co https://*.google-analytics.com;
  // ... other directives
`
```

### 🔧 **Supabase Dashboard Configuration:**

#### **Step 1: Enable Realtime**
1. Login ke [Supabase Dashboard](https://supabase.com)
2. Pilih project Anda
3. **Settings** → **Realtime**
4. Pastikan:
   - ✅ **Enable Realtime:** ON
   - **Max connections per second:** 10 (untuk mobile optimization)
   - **Max events per second:** 10

#### **Step 2: Configure Database Replication**
1. **Database** → **Replication**
2. Enable replication untuk tabel yang perlu realtime updates:
   ```sql
   -- Tabel yang perlu realtime:
   - user_favorites
   - player_reviews
   - casinos (untuk live updates)
   ```

#### **Step 3: Row Level Security (RLS)**
1. **Database** → **Policies**
2. Pastikan RLS policies configured untuk:
   ```sql
   -- Public read access untuk data yang bisa diakses user
   -- Authenticated user access untuk data yang perlu login
   ```

### 🔧 **Environment Variables untuk Realtime:**

#### **Vercel Environment Variables:**
```bash
# Sudah ada di middleware, tapi pastikan di Vercel:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 🧪 **Testing Realtime Connection:**

#### **Test Script:**
```javascript
// Di browser console, test connection:
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Test basic connection
const { data, error } = await supabase
  .from('casinos')
  .select('*')
  .limit(1)

if (error) {
  console.error('❌ Database connection error:', error)
} else {
  console.log('✅ Database connected successfully')
}

// Test realtime subscription (jika dibutuhkan)
const channel = supabase
  .channel('test-channel')
  .on('system', {}, (payload) => {
    console.log('📡 Realtime event:', payload)
  })
  .subscribe((status) => {
    console.log('📡 Realtime status:', status)
  })
```

### 🚨 **Common Issues & Solutions:**

#### **Issue 1: CSP Still Blocking**
```javascript
// Solution: Check middleware configuration
// Pastikan connect-src includes: wss://*.supabase.co
```

#### **Issue 2: Realtime Not Working**
```javascript
// Solution: Check Supabase dashboard
// - Enable realtime in settings
// - Configure RLS policies
// - Check anon key permissions
```

#### **Issue 3: Connection Timeout**
```javascript
// Solution: Optimize for mobile
// - Reduce events per second to 10
// - Use connection pooling
// - Implement retry logic
```

### 📊 **Performance Optimization:**

#### **Mobile-First Realtime Settings:**
```javascript
// Recommended settings di Supabase:
{
  realtime: {
    params: {
      eventsPerSecond: 10, // Reduced for mobile
    },
  },
  db: {
    schema: 'public',
  },
  auth: {
    flowType: 'pkce', // Better for mobile
    autoRefreshToken: true,
    persistSession: true
  }
}
```

### 🎯 **Expected Result:**

Setelah konfigurasi lengkap:
```javascript
// Browser console should show:
✅ Database connected successfully
📡 Realtime status: SUBSCRIBED
✅ Google Analytics loaded successfully (jika GA_ID diisi)
✅ No CSP violation errors
```

### 📞 **If Still Having Issues:**

1. **Check Vercel Logs:**
   - Function execution errors
   - Environment variable access

2. **Verify Supabase Settings:**
   - Realtime enabled
   - RLS policies correct
   - API keys valid

3. **Test Connection:**
   - Use Supabase dashboard SQL editor
   - Test API calls directly
   - Check network tab untuk connection details

---

**✅ Status: CSP Fixed | Realtime Ready | Environment Variables Needed**
