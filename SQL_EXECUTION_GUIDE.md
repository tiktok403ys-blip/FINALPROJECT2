# 🔧 Panduan Eksekusi SQL - P0.1 (Consolidated)

Panduan ini menggantikan instruksi lama dan menyederhanakan eksekusi SQL menjadi dua skenario: Fresh Install (baseline.sql) dan Upgrade dari DB yang sudah ada (delta-upgrade.sql).

## 📦 Opsi Eksekusi

- Fresh install (environment baru): jalankan `scripts/baseline.sql`
- Upgrade existing (sudah punya data/tables): jalankan `scripts/delta-upgrade.sql`

> Catatan: Fitur notifikasi Slack via webhook bersifat opsional namun disiapkan. Aktif bila ENV sudah di-setup pada Vercel.

---

## 1) Persiapan

- Supabase project aktif dan kredensial siap
- Aplikasi Next.js sudah terhubung ke Supabase (URL dan anon key)
- Pada Vercel (Production), set ENV berikut untuk mengaktifkan notifikasi Slack:
  - `WEBHOOK_SECRET` = secret kuat Anda (contoh: string acak minimal 32 chars)
  - `SLACK_WEBHOOK_URL` = Incoming Webhook URL dari Slack

> Jika ENV tidak diset, webhook tetap terpasang tetapi tidak akan mengirim apa pun.

---

## 2) Fresh Install (baseline.sql)

1. Buka Supabase SQL Editor
2. Copy seluruh isi `scripts/baseline.sql`
3. Execute sekali (idempotent; aman di environment bersih)
4. Hasil yang dibuat:
   - Core tables: casinos, bonuses, leaderboard, news, forum_posts, forum_comments, reports
   - Auth & profiles (RLS, trigger handle_new_user)
   - Footer & partners (RLS + policies)
   - Admin roles & helper (enum user_role, is_admin, verify_admin_pin, set_admin_pin)
   - Player reviews + webhook function & trigger (opsional)
   - Default data footer

Verifikasi cepat:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1;
SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
```

Aktivasi webhook (opsional, runtime):
```sql
--   select set_config('app.webhook_player_review_url', 'https://YOUR_DOMAIN/api/webhooks/player-review', false);
--   select set_config('app.webhook_secret', 'YOUR_SECRET', false);
-- 
-- ATAU untuk pengaturan persistent (recommend untuk production):
--   ALTER DATABASE your_db_name SET app.webhook_player_review_url = 'https://YOUR_DOMAIN/api/webhooks/player-review';
--   ALTER DATABASE your_db_name SET app.webhook_secret = 'YOUR_SECRET';
```

---

## 3) Upgrade (delta-upgrade.sql)

1. Buka Supabase SQL Editor
2. Copy seluruh isi `scripts/delta-upgrade.sql`
3. Execute sekali (transaksional dan non-destruktif)
4. Hasil yang diselaraskan:
   - Pembuatan tabel yang belum ada (core, footer, partners, player_reviews)
   - RLS dan policies distandardisasi
   - Admin helpers dan enum user_role dipastikan tersedia
   - Webhook function + trigger disiapkan

Verifikasi cepat (sama seperti di atas) + cek trigger webhook:
```sql
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname='trg_notify_new_player_review';
```

---

## 4) Rollback dan Keamanan

- Selalu buat snapshot/backup sebelum menjalankan script di Production
- Seluruh perubahan pada `delta-upgrade.sql` berada dalam transaksi `BEGIN; ... COMMIT;`
- Untuk menonaktifkan webhook tanpa mengubah code:
```sql
select set_config('app.webhook_player_review_url', '', false);
```

---

## 5) Troubleshooting

- Jika terdapat error policy sudah ada: script sudah drop-if-exists sebelum create; jalankan ulang jika perlu
- Jika tipe enum `user_role` sudah ada: script secara otomatis melewati pembuatan tipe
- Jika `on_auth_user_created` trigger sudah ada, script mengganti fungsi secara aman (OR REPLACE)

---

## 6) Langkah Berikutnya

1. Pastikan admin user dibuat pada Supabase Auth Dashboard (email produksi Anda)
2. Update role admin:
```sql
UPDATE profiles SET role='admin'::user_role WHERE id=(SELECT id FROM auth.users WHERE email='YOUR_ADMIN_EMAIL');
```
3. Set PIN admin via function:
```sql
SELECT set_admin_pin('YOUR_ADMIN_EMAIL', 'PIN_KUAT');
```
4. Uji end-to-end:
   - Login → akses admin UI (PIN)
   - Buat `player_reviews` dan cek notifikasi Slack (jika ENV sudah di-setup)

---

Dokumen ini adalah sumber kebenaran terbaru untuk eksekusi SQL P0.1 di Production. Jika ada kebutuhan khusus (misal menghapus fitur forum), beri tahu saya untuk menyesuaikan baseline/delta.
