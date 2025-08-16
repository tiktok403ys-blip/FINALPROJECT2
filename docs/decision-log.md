# Decision Log

Dokumen ini mencatat seluruh keputusan penting selama proyek, termasuk konteks, opsi yang dipertimbangkan, keputusan akhir, dampak, dan rencana tindak lanjut.

Format entri:
- Tanggal
- ID Keputusan
- Topik
- Keputusan
- Alasan / Pertimbangan
- Dampak
- Tindak Lanjut / Aksi
- Status

---

## 2025-08-15 — DL-0001 — Webhook Notifikasi Player Reviews
- Topik: Pemanfaatan webhook untuk notifikasi admin terkait review pemain (pending/approval)
- Keputusan: Pertahankan fungsionalitas webhook yang ada
- Alasan:
  - Terintegrasi dengan alur admin saat ini (Bell icon, polling, halaman /admin/player-reviews)
  - Dapat mengirimkan notifikasi ke Slack melalui SLACK_WEBHOOK_URL pada sisi server
  - Trigger database hanya aktif ketika URL/secret dikonfigurasi sehingga aman jika tidak diaktifkan
- Dampak:
  - Tidak perlu perubahan kode untuk saat ini; dokumentasi akan menandai konfigurasi sebagai opsional
  - Opsional untuk mengaktifkan Slack notification di environment production (Vercel)
- Tindak Lanjut:
  - Dokumentasikan variabel environment: WEBHOOK_SECRET, SLACK_WEBHOOK_URL
  - Pastikan app.webhook_player_review_url dan app.webhook_secret diset jika notifikasi diperlukan
  - Tambahkan catatan di panduan deployment production
- Status: Disetujui

---

## 2025-08-15 — DL-0002 — Inisiasi P0.1 Konsolidasi SQL
- Topik: Konsolidasi script SQL di folder /scripts agar siap production dan mudah dieksekusi
- Keputusan: Mulai fase P0.1 untuk menyusun rencana konsolidasi SQL
- Ruang Lingkup Konsolidasi:
  - Identifikasi script duplikat dan versi "fixed" vs original (mis. 01-create-tables.sql vs 01-create-tables-fixed.sql, 12-setup-supabase-auth.sql vs 12-setup-supabase-auth-fixed.sql, 14-setup-admin-roles*.sql)
  - Rangkaikan urutan eksekusi final (canonical migration path) dari 01..N tanpa kebingungan
  - Tandai script opsional (contoh: 13-trigger-webhook-player-review.sql) sebagai optional default-inactive bila URL tidak dikonfigurasi

- Identifikasi Database SQL yang Dikonsolidasi:
  - PostgreSQL (Supabase) — seluruh schema public yang digunakan oleh aplikasi (casinos, player_reviews, news, bonuses, partners, profiles, admin_audit_log, dsb.)

- Strategi Migrasi Data:
  - Gunakan pendekatan migrasi bertahap: 
    1) Buat baseline migration terpadu (01-XX) yang clean untuk fresh install
    2) Untuk environment yang sudah ada, buat skrip delta/patch dari kondisi saat ini ke baseline baru
  - Jaga kompatibilitas ke belakang: hindari perubahan destruktif; gunakan ALTER tabel kolumn-per-kolumn dengan default/NULL-safe
  - Nonaktifkan trigger/constraint sementara jika perlu saat bulk copy; aktifkan kembali setelah verifikasi
  - Rencanakan verifikasi checksum row counts per tabel setelah migrasi

- Dampak pada Aplikasi yang Ada:
  - Potensi perubahan minimal pada RLS policies dan fungsi auth; perlu regression test pada: login/register, admin actions, CRUD konten, submit review
  - Webhook tetap tidak aktif kecuali dikonfigurasi; tidak memblokir aplikasi

- Jadwal & Sumber Daya:
  - Estimasi fase P0.1: 3–5 hari kerja
    - Hari 1: Audit semua skrip, petakan dependensi dan duplikasi
    - Hari 2–3: Susun urutan final; buat skrip baseline + catatan delta
    - Hari 4: Uji di staging (Supabase proyek sandbox)
    - Hari 5: Finalisasi, dokumentasi, dan persiapan eksekusi di production
  - Sumber Daya: 1 engineer backend (SQL), 1 reviewer/QA

- Metrik Keberhasilan:
  - 100% skrip SQL di scripts/ terklasifikasi: core vs optional vs legacy
  - 0 error saat eksekusi end-to-end di environment staging
  - Aplikasi lulus regression test kritikal (auth, admin review moderation, konten)
  - Dokumentasi eksekusi migrasi jelas (SQL_EXECUTION_GUIDE.md diperbarui)

- Tindak Lanjut / Aksi (Next Steps):
  - [ ] Lakukan audit menyeluruh direktori scripts/ dan buat peta dependensi
  - [ ] Buat daftar final script canonical 01..N untuk fresh install
  - [ ] Tandai dan dokumentasikan script optional (termasuk webhook)
  - [ ] Rancang dan dokumentasikan jalur upgrade untuk environment existing
  - [ ] Siapkan checklist pengujian dan verifikasi pasca migrasi
- Status: In Progress

---

## 2025-08-15 — DL-0003 — Rencana Detail P0.1 Konsolidasi SQL
- Ringkasan: Rencana operasional terperinci untuk konsolidasi skrip SQL di folder /scripts agar siap eksekusi di production (Vercel + Supabase), meminimalkan risiko, dan memastikan dokumentasi jelas.

- Identifikasi Skrip & Klasifikasi:
  - Core (baseline install):
    - 01-create-tables.sql atau 01-create-tables-fixed.sql (pilih satu canonical)
    - 02-enable-rls.sql
    - 02-seed-data.sql / 03-seed-data-fixed.sql (pilih canonical seed minimal)
    - 05-add-footer-and-partners.sql atau 05-add-footer-and-partners-fixed.sql (pilih canonical)
    - 07-add-reviews-and-logos.sql
    - 09-add-casino-screenshots.sql
    - 10-setup-auth-policies.sql dan/atau 11-fix-auth-policies.sql (gabungkan kebijakan final)
    - 11-create-player-reviews.sql
    - 12-setup-supabase-auth.sql atau 12-setup-supabase-auth-fixed.sql (pilih canonical)
    - 12-update-player-reviews-policy-throttle.sql (kebijakan throttling insert)
    - 13-add-admin-security.sql (audit log dan field admin di profiles)
    - 14-setup-admin-roles*.sql (pilih 14-setup-admin-roles-final-fixed.sql sebagai kandidat canonical karena paling komprehensif dan defensif)
    - 15-ensure-profiles-table.sql (sinkronisasi struktur profiles)
    - 16-bonuses-extend.sql
    - 14-bonus-votes.sql
    - 17-bonuses-custom-text.sql
  - Opsional:
    - 13-trigger-webhook-player-review.sql (aktif bila env/setting tersedia)
  - Legacy/Deprecated:
    - Versi awal yang digantikan oleh berkas *-fixed atau *-final (mis. 14-setup-admin-roles.sql) — akan diarsipkan atau dicap sebagai legacy.

- Strategi Konsolidasi & Migrasi:
  1) Pilih satu jalur canonical 01..N untuk fresh install (baseline) dengan skrip yang bersih dan idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS, DO $$ BEGIN/EXCEPTION untuk duplicate_object).
  2) Gabungkan duplikasi/fixed ke dalam skrip canonical dengan urutan yang konsisten: schema -> RLS -> policies -> fungsi -> seed -> optional.
  3) Untuk environment existing (production), buat skrip delta non-destruktif yang:
     - Menambahkan kolom dengan IF NOT EXISTS, menjaga default/NULL safe.
     - Men-drop dan recreate RLS policy menggunakan DROP POLICY IF EXISTS + CREATE POLICY final.
     - Menggunakan fungsi helper (is_admin) versi final dengan SECURITY DEFINER dan penanganan EXCEPTION aman.
     - Tidak menghapus tabel/data tanpa backup; tidak mengubah type tanpa USING yang aman.
  4) Webhook tetap opsional: jangan buat dependency keras; hanya aktif bila app.webhook_player_review_url & app.webhook_secret diset.
  5) Dokumentasikan urutan eksekusi di SQL_EXECUTION_GUIDE.md dan tandai mana yang wajib vs opsional.

- Dampak terhadap Aplikasi:
  - RLS dan fungsi admin berpotensi mempengaruhi akses admin UI; perlu regression test pada: login, akses halaman admin, CRUD casinos/bonuses/news, moderasi player_reviews.
  - Tidak ada perubahan pada API endpoint kecuali perbaikan kebijakan akses di DB.
  - Webhook tidak mengubah UX jika tidak diaktifkan; jika aktif, notifikasi Slack berjalan seperti saat ini.

- Jadwal & Sumber Daya (Operasional):
  - D0: Finalisasi daftar canonical dan draft baseline script.
  - D1: Implementasi konsolidasi + pembuatan skrip delta upgrade.
  - D2: Uji di Supabase sandbox; verifikasi RLS, fungsi, trigger, dan integrasi app Next.js.
  - D3: Persiapan produksi: update SQL_EXECUTION_GUIDE.md, backup plan, dan checklist rollout.
  - Sumber Daya: 1 engineer (SQL/Postgres), 1 QA reviewer; keterlibatan PO untuk sign-off.

- Metrik Keberhasilan (Detail):
  - Eksekusi skrip canonical 01..N sukses tanpa error di sandbox (0 error).
  - Aplikasi lulus smoke test: halaman publik, auth, admin CRUD, submit & moderasi review, bonus votes.
  - RLS audit: pg_policies sesuai ekspektasi untuk tabel inti (casinos, bonuses, news, partners, profiles, player_reviews, admin_audit_log).
  - Monitoring: tidak ada error fatal pada Vercel logs setelah deploy.

- Checklist Tindakan Lanjut (P0.1):
  - [ ] Tetapkan skrip canonical per nomor (konfirmasi: 14-setup-admin-roles-final-fixed.sql sebagai baseline roles/policies admin).
  - [ ] Tandai skrip legacy menjadi folder scripts/legacy/ (atau beri prefiks LEGACY_ tanpa memutus referensi historis).
  - [ ] Buat baseline.sql gabungan 01..N untuk fresh install (tanpa seed berat; seed minimal saja bila perlu).
  - [ ] Susun delta-upgrade.sql dari state saat ini ke baseline (idempotent, non-destruktif).
  - [ ] Perbarui SQL_EXECUTION_GUIDE.md dengan langkah dan variabel env terkait webhook.
  - [ ] Siapkan script verifikasi: hitung row count per tabel inti + inspect kebijakan via pg_policies.
  - [ ] Rencana rollback: snapshot DB (point-in-time) dan langkah revert kebijakan.

- Catatan Webhook:
  - 13-trigger-webhook-player-review.sql ditandai opsional dan default-inactive bila app.webhook_player_review_url kosong.
  - Pastikan variabel env: WEBHOOK_SECRET (server), SLACK_WEBHOOK_URL (opsional) didokumentasikan; tidak wajib untuk menjalankan aplikasi.

Status: Planned