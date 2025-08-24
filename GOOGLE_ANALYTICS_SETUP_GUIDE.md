# 📊 Panduan Setup Google Analytics untuk GuruSingapore

## 🎯 Cara Mendapatkan NEXT_PUBLIC_GA_ID

### **Step 1: Buat Google Analytics Account**

1. **Kunjungi Google Analytics:**
   - Buka [analytics.google.com](https://analytics.google.com)
   - Login dengan Google Account Anda

2. **Buat Account Baru:**
   - Klik **"Start measuring"** atau **"Create Account"**
   - **Account name:** `GuruSingapore`
   - **Account data sharing:** Pilih sesuai kebutuhan

### **Step 2: Setup Property**

1. **Property Setup:**
   - **Property name:** `GuruSingapore Website`
   - **Time zone:** `Asia/Singapore` (UTC+8)
   - **Currency:** `Singapore Dollar (SGD)`

2. **About Your Business:**
   - **Industry:** `Gambling & Casinos` atau `Online Communities`
   - **Business size:** Pilih yang sesuai
   - **How do you intend to use Google Analytics:** `Understand user behavior`

### **Step 3: Setup Data Collection**

1. **Platform Selection:**
   - Pilih **"Web"** sebagai platform

2. **Website Details:**
   - **Website URL:** `https://gurusingapore.com` (atau domain Anda)
   - **Stream name:** `GuruSingapore Production`

3. **Data Stream Settings:**
   - **Website URL:** `https://gurusingapore.com`
   - **Stream name:** `GuruSingapore Main Site`

### **Step 4: Dapatkan Measurement ID**

1. **Setelah Property Dibuat:**
   - Di dashboard, klik **"Admin"** (ikon gear di kiri bawah)
   - Di kolom **Property**, klik **"Data Streams"**
   - Klik pada **Web stream** yang baru dibuat

2. **Copy Measurement ID:**
   - Di halaman **Web stream details**
   - Cari **"Measurement ID"** di bagian atas
   - Format: `G-XXXXXXXXXX` (contoh: `G-ABC123DEF4`)
   - **Copy** nilai ini

### **Step 5: Setup di Vercel**

1. **Login ke Vercel Dashboard:**
   - Kunjungi [vercel.com](https://vercel.com)
   - Pilih project **GuruSingapore**

2. **Environment Variables:**
   - Klik **"Settings"** → **"Environment Variables"**
   - Klik **"Add New..."**
   - Input:
     ```
     Name: NEXT_PUBLIC_GA_ID
     Value: G-XXXXXXXXXX (paste measurement ID Anda)
     Environments: Production, Preview, Development
     ```

3. **Redeploy:**
   - Setelah menambahkan variable
   - Klik **"Redeploy"** untuk apply changes

## 🔍 **Verifikasi Setup**

### **Test di Browser:**

1. **Setelah Deployment:**
   - Buka website Anda
   - Buka **Developer Tools** (F12)
   - Klik tab **Console**

2. **Expected Messages:**
   ```javascript
   ✅ Google Analytics loaded successfully
   ✅ Database connected successfully
   ✅ Realtime status: SUBSCRIBED
   ```

3. **Check Network Tab:**
   - Lihat requests ke:
     - `googletagmanager.com`
     - `google-analytics.com`
   - Status: `200 OK`

## 🛠️ **Troubleshooting**

### **Jika GA Tidak Loading:**

1. **Check Environment Variable:**
   ```bash
   # Di Vercel dashboard, verify:
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

2. **Check Browser Console:**
   ```javascript
   // Jika masih error:
   ❌ Google Analytics not loaded

   // Possible causes:
   - Measurement ID format salah
   - Domain belum verified
   - GA script blocked by CSP
   ```

3. **Domain Verification:**
   - Di Google Analytics dashboard
   - **Admin** → **Property** → **Data Streams**
   - Pastikan domain **verified** ✅

### **Jika Events Tidak Track:**

1. **Check GA Debug Mode:**
   ```javascript
   // Di browser console:
   gtag('config', 'G-XXXXXXXXXX', { debug_mode: true });
   ```

2. **Verify Events:**
   - Check **Realtime** report di GA dashboard
   - Lihat apakah events muncul dalam 30 detik

## 📈 **Post-Setup Configuration**

### **Setelah GA Active:**

1. **Configure Goals:**
   - **Admin** → **Goals** → **Create Goal**
   - Track: Casino views, searches, PWA installs

2. **Custom Events:**
   - Mobile interactions
   - Casino ratings
   - Search queries

3. **Audiences:**
   - Mobile users
   - High-engagement users
   - Casino enthusiasts

## 🔒 **Privacy & Compliance**

### **Settings untuk GuruSingapore:**

1. **Data Collection:**
   - ✅ **IP Anonymization:** ON
   - ✅ **Ad Personalization:** OFF
   - ✅ **Data Retention:** 14 months

2. **Cookie Settings:**
   - **Cookie expiry:** 2 years
   - **Cross-domain tracking:** OFF

## 📊 **Monitoring Performance**

### **Core Web Vitals Tracking:**
- **FCP (First Contentful Paint):** <1.5s target
- **LCP (Largest Contentful Paint):** <2.5s target
- **CLS (Cumulative Layout Shift):** <0.1 target
- **FID (First Input Delay):** <100ms target

### **Mobile-Specific Metrics:**
- Touch interactions
- Swipe gestures
- PWA install rates
- Offline usage

## 📞 **Support & Help**

### **Jika Masih Bermasalah:**

1. **Check GA Status:**
   - [Google Analytics Status](https://status.analytics.google.com)
   - Pastikan GA service operational

2. **Contact Support:**
   - Google Analytics Help Center
   - Vercel Support untuk environment variables

3. **Debug Tools:**
   - [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
   - Browser developer tools

---

**🎯 Summary:**
- **Measurement ID Format:** `G-XXXXXXXXXX`
- **Setup Location:** Vercel Environment Variables
- **Verification:** Check browser console & GA dashboard
- **Privacy:** IP anonymization enabled
- **Performance:** Core Web Vitals tracking ready
