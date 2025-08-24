# ⚡ Quick Guide: Get Google Analytics Measurement ID

## 📍 **Langkah Cepat (5 menit)**

### **Step 1: Buka Google Analytics**
```
🌐 https://analytics.google.com
🔑 Login dengan Google Account Anda
```

### **Step 2: Buat Property Baru**
```
1. Klik "Create Account" (jika belum ada)
2. Account name: GuruSingapore
3. Klik "Next"

4. Property name: GuruSingapore Website
5. Time zone: Asia/Singapore (UTC+8)
6. Currency: Singapore Dollar (SGD)
7. Klik "Next"

8. Business details:
   - Industry: Gambling & Casinos
   - Business size: Choose appropriate
   - Klik "Create"
```

### **Step 3: Setup Web Stream**
```
1. Pilih platform: "Web"
2. Website URL: https://gurusingapore.com
3. Stream name: GuruSingapore Production
4. Klik "Create Stream"
```

### **Step 4: Copy Measurement ID**
```
1. Di halaman yang muncul:
   - Cari "Measurement ID"
   - Format: G-XXXXXXXXXX
   - Contoh: G-ABC123DEF4
   - KLIK COPY atau highlight & copy
```

### **Step 5: Setup di Vercel**
```
1. Buka: vercel.com → Project GuruSingapore
2. Settings → Environment Variables
3. Add New:
   Name: NEXT_PUBLIC_GA_ID
   Value: G-XXXXXXXXXX (paste ID Anda)
   Environments: Production, Preview, Development
4. Klik "Save"
5. Redeploy project
```

## 🔍 **Verifikasi Setup**

### **Check Browser Console:**
```javascript
// Setelah redeploy, buka website Anda
// F12 → Console tab
// Harus muncul:
✅ Google Analytics loaded successfully
```

### **Check GA Dashboard:**
```javascript
// Di analytics.google.com
// Reports → Realtime → Overview
// Harus ada active users dalam 30 detik
```

## 🚨 **Jika Tidak Muncul:**

### **Problem: Measurement ID Format Salah**
```javascript
// ❌ Salah:
GA-XXXXXXXXXX
UA-XXXXXXXXXX

// ✅ Benar:
G-XXXXXXXXXX
```

### **Problem: Domain Belum Verified**
```javascript
// Di GA dashboard:
// Admin → Property → Data Streams
// Pastikan domain status: "Verified" ✅
```

### **Problem: GA Script Blocked**
```javascript
// Check jika ada CSP error di console:
// ❌ Refused to load... googletagmanager.com

// Solution: Sudah dihandle di middleware.ts ✅
```

## 📞 **Butuh Bantuan?**

### **Quick Debug:**
```javascript
// Di browser console:
console.log('GA ID:', process.env.NEXT_PUBLIC_GA_ID)

// Harus menampilkan: G-XXXXXXXXXX
```

### **Contact Support:**
- **Google Analytics:** analytics.google.com → Help
- **Vercel:** vercel.com → Support

---

**🎯 Target: 5 menit setup | 30 detik verification**
