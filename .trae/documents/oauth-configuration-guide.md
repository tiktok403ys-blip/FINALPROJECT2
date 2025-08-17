# Panduan Konfigurasi OAuth Supabase & Google Cloud Console

## Informasi Proyek
- **Domain**: gurusingapore.com
- **URL Production**: https://gurusingapore.com
- **Supabase Project URL**: https://ixqjqjqjqjqjqjqj.supabase.co

## Tahap 1: Konfigurasi Google Cloud Console

### 1.1 Buat Project Google Cloud
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Select a project" → "New Project"
3. **Project Name**: `GuruSingapore OAuth`
4. Klik "Create"

### 1.2 Enable Google+ API
1. Di Google Cloud Console, buka "APIs & Services" → "Library"
2. Cari "Google+ API" atau "People API"
3. Klik "Enable"

### 1.3 Konfigurasi OAuth Consent Screen
1. Buka "APIs & Services" → "OAuth consent screen"
2. Pilih "External" → "Create"
3. **App Information**:
   - App name: `GuruSingapore`
   - User support email: `admin@gurusingapore.com`
   - Developer contact: `admin@gurusingapore.com`
4. **App domain**:
   - Application home page: `https://gurusingapore.com`
   - Application privacy policy: `https://gurusingapore.com/privacy`
   - Application terms of service: `https://gurusingapore.com/terms`
5. **Authorized domains**:
   ```
   gurusingapore.com
   supabase.co
   ```
6. Klik "Save and Continue"
7. **Scopes**: Tambahkan scope berikut:
   ```
   ../auth/userinfo.email
   ../auth/userinfo.profile
   openid
   ```
8. Klik "Save and Continue"
9. **Test users**: Tambahkan email admin untuk testing
10. Klik "Save and Continue"

### 1.4 Buat OAuth 2.0 Credentials
1. Buka "APIs & Services" → "Credentials"
2. Klik "+ Create Credentials" → "OAuth 2.0 Client IDs"
3. **Application type**: Web application
4. **Name**: `GuruSingapore Web Client`
5. **Authorized JavaScript origins**:
   ```
   https://gurusingapore.com
   https://ixqjqjqjqjqjqjqj.supabase.co
   ```
6. **Authorized redirect URIs**:
   ```
   https://ixqjqjqjqjqjqjqj.supabase.co/auth/v1/callback
   https://gurusingapore.com/auth/callback
   ```
7. Klik "Create"
8. **SIMPAN**: Client ID dan Client Secret yang muncul

## Tahap 2: Konfigurasi Supabase Dashboard

### 2.1 Setup Google OAuth Provider
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project GuruSingapore
3. Buka "Authentication" → "Providers"
4. Cari "Google" dan klik "Enable"

### 2.2 Konfigurasi Google Provider
1. **Client ID**: Paste Client ID dari Google Cloud Console
2. **Client Secret**: Paste Client Secret dari Google Cloud Console
3. **Redirect URL**: (sudah otomatis terisi)
   ```
   https://ixqjqjqjqjqjqjqj.supabase.co/auth/v1/callback
   ```
4. Klik "Save"

### 2.3 Konfigurasi Site URL
1. Buka "Authentication" → "URL Configuration"
2. **Site URL**: 
   ```
   https://gurusingapore.com
   ```
3. **Redirect URLs**: Tambahkan URL berikut:
   ```
   https://gurusingapore.com/auth/callback
   https://gurusingapore.com/admin/dashboard
   https://gurusingapore.com/
   ```
4. Klik "Save"

## Tahap 3: Konfigurasi Environment Variables

### 3.1 Variabel yang Diperlukan
Tambahkan ke Vercel Environment Variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ixqjqjqjqjqjqjqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Security Configuration
ADMIN_PIN=789432
CSRF_SECRET=your-csrf-secret-key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

### 3.2 Verifikasi di Vercel
1. Buka Vercel Dashboard
2. Pilih project GuruSingapore
3. Buka "Settings" → "Environment Variables"
4. Pastikan semua variabel sudah ada untuk:
   - Production
   - Preview
   - Development

## Tahap 4: Testing & Verifikasi

### 4.1 Test OAuth Flow
1. Deploy project ke Vercel
2. Buka `https://gurusingapore.com/auth/login`
3. Klik "Sign in with Google"
4. Verifikasi redirect ke Google OAuth
5. Login dengan akun Google
6. Verifikasi redirect kembali ke aplikasi
7. Cek apakah user terbuat di Supabase Auth

### 4.2 Checklist Verifikasi
- [ ] Google Cloud Project dibuat
- [ ] OAuth Consent Screen dikonfigurasi
- [ ] OAuth 2.0 Credentials dibuat
- [ ] Authorized domains ditambahkan
- [ ] Redirect URIs dikonfigurasi
- [ ] Google Provider enabled di Supabase
- [ ] Client ID/Secret dikonfigurasi di Supabase
- [ ] Site URL dikonfigurasi di Supabase
- [ ] Redirect URLs ditambahkan di Supabase
- [ ] Environment variables dikonfigurasi di Vercel
- [ ] OAuth flow berhasil ditest
- [ ] User terbuat di Supabase setelah login

## Tahap 5: Troubleshooting

### 5.1 Error Umum

**Error: "redirect_uri_mismatch"**
- Pastikan Authorized redirect URIs di Google Cloud Console sesuai
- Cek Redirect URLs di Supabase Authentication

**Error: "invalid_client"**
- Verifikasi Client ID dan Client Secret di Supabase
- Pastikan Google+ API sudah enabled

**Error: "access_denied"**
- Cek OAuth Consent Screen configuration
- Pastikan domain sudah diauthorize

### 5.2 URL Penting untuk Copy-Paste

**Google Cloud Console URLs:**
```
OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent
Credentials: https://console.cloud.google.com/apis/credentials
APIs Library: https://console.cloud.google.com/apis/library
```

**Supabase Dashboard URLs:**
```
Authentication Providers: https://supabase.com/dashboard/project/[PROJECT_ID]/auth/providers
URL Configuration: https://supabase.com/dashboard/project/[PROJECT_ID]/auth/url-configuration
```

**Redirect URIs untuk Copy-Paste:**
```
https://ixqjqjqjqjqjqjqj.supabase.co/auth/v1/callback
https://gurusingapore.com/auth/callback
```

## Status Implementasi

✅ **Sudah Dikonfigurasi:**
- Kode OAuth Google di aplikasi
- Supabase client configuration
- Auth provider component
- Login/register pages
- Callback handler

⏳ **Perlu Dikonfigurasi:**
- Google Cloud Console setup
- Supabase OAuth provider
- Environment variables
- Testing OAuth flow

---

**Catatan**: Setelah semua konfigurasi selesai, lakukan deployment ulang di Vercel dan test OAuth flow secara menyeluruh.