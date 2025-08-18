# Production Setup Guide

## Environment Variables Configuration

### Critical Environment Variables

Untuk menjalankan aplikasi di production, pastikan environment variables berikut telah dikonfigurasi dengan benar:

#### 1. NEXT_PUBLIC_ADMIN_URL

**Wajib untuk domain admin kustom**

```bash
NEXT_PUBLIC_ADMIN_URL=https://sg44admin.gurusingapore.com
```

**Penjelasan:**
- Variable ini menentukan domain mana yang diizinkan mengakses rute admin
- Tanpa konfigurasi ini, middleware akan memblokir akses ke `/api/admin/*` dan `/admin/*`
- Domain harus sesuai persis dengan domain yang digunakan untuk mengakses admin panel

**Contoh konfigurasi untuk berbagai environment:**

```bash
# Production
NEXT_PUBLIC_ADMIN_URL=https://sg44admin.gurusingapore.com

# Staging
NEXT_PUBLIC_ADMIN_URL=https://staging-admin.gurusingapore.com

# Development (default)
NEXT_PUBLIC_ADMIN_URL=http://admin.localhost:3000
```

#### 2. Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### 3. Database Configuration

```bash
DATABASE_URL=your_database_connection_string
```

### Deployment Checklist

#### ✅ Pre-deployment

1. **Environment Variables**
   - [ ] `NEXT_PUBLIC_ADMIN_URL` dikonfigurasi sesuai domain admin
   - [ ] Supabase keys dikonfigurasi
   - [ ] Database URL dikonfigurasi

2. **Database Migrations**
   - [ ] Semua migrasi RLS telah diterapkan:
     - `20241218180000_fix_public_rls_policies.sql`
     - `20241221120000_fix_rls_infinite_recursion.sql` 
     - `20241220_fix_all_critical_issues_bypass.sql`

3. **Domain Configuration**
   - [ ] DNS records dikonfigurasi untuk admin subdomain
   - [ ] SSL certificate aktif untuk admin domain

#### ✅ Post-deployment

1. **Functional Testing**
   - [ ] Admin login berfungsi di `https://sg44admin.gurusingapore.com`
   - [ ] API endpoints `/api/admin/*` dapat diakses
   - [ ] PIN verification berfungsi
   - [ ] Database queries tidak menghasilkan 500 errors

2. **Security Validation**
   - [ ] RLS policies aktif dan berfungsi
   - [ ] Admin access terbatas pada domain yang benar
   - [ ] Public endpoints dapat diakses tanpa authentication

### Troubleshooting Common Issues

#### 403 Forbidden pada Admin Routes

**Gejala:** Request ke `/api/admin/pin-status` atau rute admin lainnya mendapat 403

**Penyebab:** `NEXT_PUBLIC_ADMIN_URL` tidak dikonfigurasi atau tidak sesuai dengan domain

**Solusi:**
```bash
# Pastikan environment variable sesuai dengan domain yang digunakan
NEXT_PUBLIC_ADMIN_URL=https://sg44admin.gurusingapore.com
```

#### 500 Internal Server Error pada Supabase Queries

**Gejala:** Query ke Supabase REST API menghasilkan 500 error

**Penyebab:** RLS policies belum diterapkan atau ada masalah dengan kebijakan database

**Solusi:**
1. Pastikan semua migrasi RLS telah diterapkan
2. Jalankan script validasi database: `validate-rls-policies.sql`
3. Periksa log Supabase untuk error detail

#### PIN Verification Gagal

**Gejala:** Admin tidak bisa login atau verify PIN

**Penyebab:** Session tidak terbaca atau RPC function tidak memiliki permission

**Solusi:**
1. Pastikan user sudah authenticated sebelum memanggil PIN verification
2. Periksa apakah `admin_has_pin_set()` function memiliki grant ke role `authenticated`

### Environment Variable Setup per Platform

#### Vercel

1. Masuk ke Vercel Dashboard
2. Pilih project
3. Masuk ke Settings > Environment Variables
4. Tambahkan variables:
   ```
   NEXT_PUBLIC_ADMIN_URL = https://sg44admin.gurusingapore.com
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   ```

#### Netlify

1. Masuk ke Netlify Dashboard
2. Pilih site
3. Masuk ke Site settings > Environment variables
4. Tambahkan variables yang sama seperti di atas

#### Railway/Render

1. Masuk ke dashboard platform
2. Pilih project/service
3. Masuk ke Environment/Variables section
4. Tambahkan variables yang diperlukan

### Monitoring & Maintenance

#### Log Monitoring

- Monitor application logs untuk 403/500 errors
- Periksa Supabase logs untuk database errors
- Set up alerts untuk critical errors

#### Regular Maintenance

- Review RLS policies secara berkala
- Update environment variables saat domain berubah
- Backup database secara rutin
- Monitor performance metrics

---

**Catatan Penting:**
- Selalu test di staging environment sebelum deploy ke production
- Backup database sebelum menerapkan migrasi baru
- Dokumentasikan setiap perubahan environment variable
- Koordinasikan dengan tim untuk perubahan konfigurasi production