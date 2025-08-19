# Setup Instructions - Step by Step

## 🚀 Langkah-langkah Setup Databasee

## 1. Buat Project Supabase Baru
- Kunjungi [supabase.com](https://supabase.com)
- Klik "New Project"
- Isi nama project dan password database
- Tunggu hingga project selesai dibuat (2-3 menit)

### 2. Jalankan SQL Scripts (Konsolidasi P0.1)

- Untuk fresh install: jalankan `scripts/baseline.sql` sekali di SQL Editor Supabase (idempotent)
- Untuk upgrade database yang sudah ada: jalankan `scripts/delta-upgrade.sql`
- Detail lengkap lihat `SQL_EXECUTION_GUIDE.md`

> Catatan: Webhook Slack opsional. Bila tidak ada ENV, fitur ini tidak aktif.

### 3. Enable Authentication

**Email Auth (Sudah aktif by default)**
- Pergi ke Authentication > Settings
- Pastikan "Enable email confirmations" sesuai kebutuhan

**Google OAuth (Opsional)**
- Pergi ke Authentication > Providers
- Enable Google provider
- Tambahkan Google OAuth credentials jika diperlukan

### 4. Get API Keys
- Pergi ke Settings > API
- Copy `Project URL` dan `anon public key`

### 5. Setup Environment Variables
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://your-domain.com
\`\`\`

### 6. Test Database Connection
Jalankan query test di SQL Editor:
\`\`\`sql
SELECT COUNT(*) as total_casinos FROM casinos;
SELECT COUNT(*) as total_news FROM news;
SELECT COUNT(*) as total_posts FROM forum_posts;
\`\`\`

Jika semua query berhasil, database sudah siap!

## 🔧 Troubleshooting

### Error: "permission denied to set parameter"
- **Solusi**: Skip baris `ALTER DATABASE` di script
- Script sudah diperbaiki untuk menghindari error ini

### Error: "relation does not exist"  
- **Solusi**: Pastikan menjalankan scripts sesuai urutan
- Untuk fresh install, jalankan `scripts/baseline.sql` saja

### Error: "function gen_random_uuid() does not exist"
- **Solusi**: Supabase sudah support UUID by default
- Script sudah menggunakan `gen_random_uuid()`

### RLS Policy Issues
- **Solusi**: Script `baseline.sql` sudah mengatur RLS dan policies
- Tidak perlu menjalankan script terpisah lagi

## ✅ Verification Checklist

- [ ] Tables created successfully (7 tables)
- [ ] RLS enabled on all tables  
- [ ] Sample data inserted (casinos, news, forum posts, etc.)
- [ ] Admin function created
- [ ] Indexes created for performance
- [ ] API keys copied to environment variables
- [ ] Authentication working (test login/register)

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Website akan bisa diakses dengan data real-time dari Supabase.
