# Legacy SQL Scripts - P0.1 Archive

Script ini adalah arsip script SQL yang tidak dimasukkan dalam `baseline.sql` dan `delta-upgrade.sql` tapi masih tersimpan untuk referensi.

## Scripts yang tidak digunakan:

- **01-create-tables.sql** → Digantikan dengan 01-create-tables-fixed.sql
- **02-enable-rls.sql** → Fungsi sudah terintegrasi dalam baseline
- **02-seed-data.sql** → Data seed manual tidak diperlukan dalam P0.1 (menghindari test/dummy data)
- **03-add-admin-features.sql** → Digantikan dengan 14-setup-admin-roles-final-fixed.sql
- **03-seed-data-fixed.sql** → Data seed manual tidak diperlukan dalam P0.1
- **04-admin-features-fixed.sql** → Digantikan dengan 14-setup-admin-roles-final-fixed.sql
- **05-add-footer-and-partners.sql** → Digantikan dengan 05-add-footer-and-partners-fixed.sql
- **06-insert-partners-data.sql** → Data partner disederhanakan dalam baseline
- **07-add-reviews-and-logos.sql** → Tidak dikategorikan sebagai canonical P0.1
- **08-update-reports-table.sql** → Sudah terintegrasi dalam baseline
- **09-add-casino-screenshots.sql** → Tidak dikategorikan sebagai canonical P0.1
- **10-setup-auth-policies.sql** → Digantikan dengan 12-setup-supabase-auth-fixed.sql
- **11-create-player-reviews.sql** → Terintegrasi dalam baseline (player_reviews)
- **11-fix-auth-policies.sql** → Sudah terintegrasi dalam baseline
- **12-setup-supabase-auth.sql** → Digantikan dengan 12-setup-supabase-auth-fixed.sql
- **12-update-player-reviews-policy-throttle.sql** → Tidak dikategorikan sebagai canonical P0.1
- **13-add-admin-security.sql** → Digantikan dengan 14-setup-admin-roles-final-fixed.sql
- **14-bonus-votes.sql** → Tidak dikategorikan sebagai canonical P0.1
- **14-setup-admin-roles.sql** → Digantikan dengan 14-setup-admin-roles-final-fixed.sql
- **14-setup-admin-roles-final.sql** → Digantikan dengan 14-setup-admin-roles-final-fixed.sql
- **14-setup-admin-roles-fixed.sql** → Digantikan dengan 14-setup-admin-roles-final-fixed.sql
- **16-bonuses-extend.sql** → Tidak dikategorikan sebagai canonical P0.1
- **17-bonuses-custom-text.sql** → Tidak dikategorikan sebagai canonical P0.1

## Canonical Scripts (tetap aktif):

- **01-create-tables-fixed.sql** ✅ Digunakan dalam baseline
- **05-add-footer-and-partners-fixed.sql** ✅ Digunakan dalam baseline
- **12-setup-supabase-auth-fixed.sql** ✅ Digunakan dalam baseline
- **13-trigger-webhook-player-review.sql** ✅ Digunakan dalam baseline (opsional)
- **14-setup-admin-roles-final-fixed.sql** ✅ Digunakan dalam baseline
- **15-ensure-profiles-table.sql** ✅ Digunakan dalam baseline

## Archive Note:

Script ini akan dipindahkan ke folder `legacy/` setelah implementasi P0.1 selesai untuk menghindari kebingungan dan menjaga repositori tetap clean.

Jika ada kebutuhan spesifik dari script legacy, beri tahu untuk mempertimbangkan penambahan dalam baseline atau delta sesuai kebutuhan.