# Panduan Konfigurasi OAuth dengan Supabase

## 📋 Overview
Panduan ini akan membantu Anda mengkonfigurasi OAuth providers (Google) di Supabase untuk website casino review GuruSingapore. Proyek sudah memiliki implementasi Google OAuth di halaman login, namun perlu konfigurasi provider di dashboard Supabase.

## 🔧 Informasi Proyek Supabase
- **Project URL**: https://oypqykrfinmrvvsjfyqd.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDE0OTksImV4cCI6MjA3MDkxNzQ5OX0.5mDZ0iG_TtDB-qORzzvHX20dyXEk6iAcl5SuKvNVSTo

## 🚀 Langkah 1: Setup Google OAuth Provider di Supabase

### 1.1 Akses Dashboard Supabase
1. Buka [supabase.com](https://supabase.com) dan login
2. Pilih project **oypqykrfinmrvvsjfyqd**
3. Navigasi ke **Authentication** → **Providers**

### 1.2 Konfigurasi Google Provider
1. **Enable Google Provider**:
   - Scroll ke bagian "Auth Providers"
   - Cari "Google" dan klik toggle untuk mengaktifkan
   - Status harus berubah menjadi "Enabled"

2. **Dapatkan Google OAuth Credentials**:
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Buat project baru atau pilih project yang sudah ada
   - Navigasi ke **APIs & Services** → **Credentials**
   - Klik **Create Credentials** → **OAuth 2.0 Client IDs**
   - Pilih **Web application**

3. **Konfigurasi OAuth Client**:
   ```
   Name: GuruSingapore Casino Review
   Authorized JavaScript origins:
   - http://localhost:3000 (untuk development)
   - https://your-domain.com (untuk production)
   - https://your-vercel-app.vercel.app (untuk Vercel deployment)
   
   Authorized redirect URIs:
   - http://localhost:3000/auth/callback
   - https://your-domain.com/auth/callback
   - https://your-vercel-app.vercel.app/auth/callback
   - https://oypqykrfinmrvvsjfyqd.supabase.co/auth/v1/callback
   ```

4. **Copy Credentials ke Supabase**:
   - Copy **Client ID** dan **Client Secret** dari Google Console
   - Paste ke form Google provider di Supabase:
     - **Client ID**: [paste Google Client ID]
     - **Client Secret**: [paste Google Client Secret]
   - Klik **Save**

## 🔗 Langkah 2: Konfigurasi Redirect URLs di Supabase

### 2.1 Site URL Configuration
1. Di dashboard Supabase, navigasi ke **Authentication** → **URL Configuration**
2. Set **Site URL**:
   ```
   Development: http://localhost:3000
   Production: https://your-domain.com
   ```

### 2.2 Redirect URLs
Tambahkan semua URL yang valid untuk redirect:
```
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
https://your-vercel-app.vercel.app/auth/callback
http://localhost:3000/**
https://your-domain.com/**
https://your-vercel-app.vercel.app/**
```

## 🛠️ Langkah 3: Verifikasi Implementasi Kode

### 3.1 Cek Environment Variables
Pastikan file `.env.local` memiliki:
```env
NEXT_PUBLIC_SUPABASE_URL=https://oypqykrfinmrvvsjfyqd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHF5a3JmaW5tcnZ2c2pmeXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDE0OTksImV4cCI6MjA3MDkxNzQ5OX0.5mDZ0iG_TtDB-qORzzvHX20dyXEk6iAcl5SuKvNVSTo
```

### 3.2 Implementasi OAuth Sudah Ada
Kode OAuth Google sudah diimplementasi di `app/auth/login/page.tsx`:
```typescript
const handleGoogleLogin = async () => {
  setLoading(true)
  setError("")

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  } catch (err) {
    setError("Failed to sign in with Google. Please try again.")
    setLoading(false)
  }
}
```

## 📄 Langkah 4: Setup Callback Handler

### 4.1 Cek Callback Page
Pastikan file `app/auth/callback/page.tsx` ada dan berfungsi untuk menangani OAuth callback.

### 4.2 Implementasi Profile Creation
Sistem sudah memiliki trigger untuk membuat profile otomatis:
- Function `handle_new_user()` akan membuat profile di tabel `profiles`
- Mengambil data dari `raw_user_meta_data` (nama, avatar dari Google)

## 🧪 Langkah 5: Testing OAuth Flow

### 5.1 Test Development
1. Jalankan aplikasi: `pnpm dev`
2. Buka `http://localhost:3000/auth/login`
3. Klik "Continue with Google"
4. Verifikasi redirect ke Google OAuth
5. Setelah authorize, pastikan redirect kembali ke aplikasi
6. Cek apakah user berhasil login dan profile dibuat

### 5.2 Test Production
1. Deploy ke Vercel
2. Test OAuth flow di production URL
3. Verifikasi semua redirect URLs berfungsi

## 🔍 Troubleshooting

### Error: "Invalid redirect URL"
- Pastikan semua redirect URLs sudah ditambahkan di:
  - Google Cloud Console (Authorized redirect URIs)
  - Supabase Dashboard (Redirect URLs)

### Error: "OAuth provider not configured"
- Pastikan Google provider sudah enabled di Supabase
- Verifikasi Client ID dan Client Secret sudah benar

### Error: "Profile creation failed"
- Cek apakah trigger `handle_new_user()` sudah aktif
- Verifikasi tabel `profiles` sudah ada dan RLS dikonfigurasi

## 📊 Monitoring OAuth

### 5.1 Supabase Auth Logs
- Navigasi ke **Authentication** → **Users**
- Monitor user registrations dan login attempts
- Cek error logs di **Logs** section

### 5.2 Google Cloud Console
- Monitor OAuth usage di **APIs & Services** → **Credentials**
- Cek quota dan rate limits

## ✅ Checklist Konfigurasi

- [ ] Google OAuth provider enabled di Supabase
- [ ] Google Cloud Console project dibuat
- [ ] OAuth 2.0 Client ID dikonfigurasi
- [ ] Client ID dan Secret ditambahkan ke Supabase
- [ ] Site URL dikonfigurasi di Supabase
- [ ] Redirect URLs ditambahkan (development & production)
- [ ] Environment variables dikonfigurasi
- [ ] Callback handler berfungsi
- [ ] Profile creation trigger aktif
- [ ] Testing OAuth flow berhasil

## 🚀 Langkah Selanjutnya

Setelah OAuth dikonfigurasi:
1. **Test thoroughly** di development dan production
2. **Monitor user registrations** melalui Supabase dashboard
3. **Setup additional providers** (Facebook, GitHub) jika diperlukan
4. **Implement user profile management** untuk data tambahan
5. **Setup email templates** untuk welcome emails

---

**📝 Catatan**: Pastikan untuk mengganti `your-domain.com` dan `your-vercel-app.vercel.app` dengan URL aktual Anda saat konfigurasi production.