# Project Brief: GuruSingapore Casino Platform

## Project Overview

GuruSingapore adalah platform web komprehensif yang menyediakan informasi, review, dan panduan mengenai kasino online untuk pasar Singapura. Platform ini menggabungkan informasi kasino, sistem review pengguna, berita industri, dan program bonus dalam satu ekosistem digital yang terintegrasi.

## Tujuan Proyek

### Tujuan Utama
1. **Menyediakan Informasi Kasino Terpercaya** - Platform satu atap untuk informasi kasino online yang akurat dan terkini
2. **Sistem Review Transparan** - Memungkinkan pengguna memberikan dan membaca review autentik tentang pengalaman bermain
3. **Portal Berita Industri** - Menyajikan berita dan update terbaru dari industri kasino online
4. **Program Bonus Terintegrasi** - Menampilkan dan mengelola berbagai penawaran bonus dari partner kasino

### Tujuan Teknis
1. **Optimasi Performance** - Mencapai loading time <3 detik dan Core Web Vitals yang optimal
2. **Skalabilitas** - Mendukung pertumbuhan traffic dan data tanpa degradasi performa
3. **Keamanan** - Implementasi security best practices untuk melindungi data pengguna
4. **SEO Excellence** - Ranking tinggi di search engine untuk keyword target

## Ruang Lingkup Proyek

### Dalam Lingkup
- ✅ **Frontend Web Application** (Next.js 14, React, TypeScript)
- ✅ **Admin Panel** dengan sistem autentikasi dan role management
- ✅ **Database Management** (Supabase PostgreSQL)
- ✅ **User Authentication** dan profile management
- ✅ **Casino Information System** dengan screenshot dan detail
- ✅ **Player Reviews System** dengan approval workflow
- ✅ **News Management System** untuk artikel dan update
- ✅ **Bonus Programs** dengan voting dan feedback
- ✅ **Responsive Design** untuk desktop dan mobile
- ✅ **Real-time Notifications** untuk admin (webhook system)
- ✅ **Content Management** melalui admin interface

### Luar Lingkup
- ❌ **Direct Casino Integration** - Tidak ada integrasi langsung dengan sistem kasino
- ❌ **Payment Processing** - Tidak menangani transaksi finansial
- ❌ **Mobile Apps** - Fokus pada web platform saja
- ❌ **Multi-language Support** - Prioritas pada bahasa Inggris
- ❌ **Email Marketing System** - Komunikasi melalui platform saja
- ❌ **Advanced Analytics Dashboard** - Menggunakan external tools

## Stakeholder

### Internal Team
- **Product Owner** - Menentukan fitur dan prioritas bisnis
- **Lead Developer** - Arsitektur teknis dan implementasi
- **Content Manager** - Pengelolaan konten kasino dan artikel
- **Admin User** - Operasional harian dan moderasi review

### External Partners
- **Casino Partners** - Penyedia informasi dan program bonus
- **Hosting Provider** - Vercel untuk deployment dan CDN
- **Database Provider** - Supabase untuk backend services
- **End Users** - Pengunjung platform dan reviewer

## Arsitektur Teknis

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: Supabase (PostgreSQL) dengan RLS policies
- **Authentication**: Supabase Auth dengan custom admin roles
- **Deployment**: Vercel dengan continuous deployment
- **File Storage**: Supabase Storage untuk images dan assets

### Struktur Database
```
├── casinos (Casino information)
├── reviews (Expert reviews) 
├── player_reviews (User-generated reviews)
├── news (News articles)
├── bonuses (Bonus programs)
├── bonus_votes (User bonus ratings)
├── partners (Casino partnerships)
├── footer_sections (CMS content)
├── site_settings (Configuration)
├── profiles (User profiles)
├── admin_audit_log (Admin actions)
└── reports (User reports)
```

### Fitur Utama
1. **Public Pages**: Homepage, Casino listings, Reviews, News, Bonus programs
2. **User System**: Registration, login, profile, review submission
3. **Admin Panel**: Content management, user moderation, analytics
4. **Real-time Features**: Live notifications, instant updates
5. **SEO Optimization**: Structured data, meta tags, sitemap

## Metrik Keberhasilan

### Performance Metrics
- **Page Load Speed**: <3 seconds (95th percentile)
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Uptime**: >99.9% availability
- **Mobile Performance**: Score >90 di PageSpeed Insights

### Business Metrics
- **User Engagement**: >3 pages per session average
- **Review Quality**: >70% review approval rate
- **Content Freshness**: Daily news updates, weekly casino updates
- **Partner Integration**: Successful bonus tracking dan reporting

### Security & Compliance
- **Data Protection**: Secure user data handling
- **Admin Security**: Multi-factor authentication untuk admin
- **Database Security**: RLS policies dan access controls
- **Code Quality**: TypeScript strict mode, ESLint compliance

## Fase Implementasi

### Fase 1: Foundation & Cleanup (Current)
- ✅ Core functionality implementation
- 🔄 **P0.1: SQL Consolidation** - Database script optimization
- 🔄 **P0.2: Bundle Optimization** - Performance improvements

### Fase 2: Enhancement & Optimization
- **P1: SEO & Performance** - Structured data, caching, optimization
- **P1: Service Worker** - Offline functionality dan caching
- **P1: Monitoring** - Error tracking dan performance monitoring

### Fase 3: Advanced Features
- **P2: Security Enhancements** - Rate limiting, advanced auth
- **P2: Analytics Integration** - User behavior tracking
- **P2: Content Expansion** - Additional casino data

## Considerasi Deployment

### Production Environment
- **Platform**: Vercel Pro plan untuk optimal performance
- **Database**: Supabase Pro dengan connection pooling
- **Domain**: Custom domain dengan SSL certificate
- **CDN**: Global edge network untuk fast content delivery

### Environment Variables
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin Security
ADMIN_PIN_HASH=
SUPER_ADMIN_EMAIL=

# Webhook (Optional)
WEBHOOK_SECRET=
SLACK_WEBHOOK_URL=

# Production Settings
NODE_ENV=production
```

### Monitoring & Maintenance
- **Error Tracking**: Integration dengan Sentry/LogRocket (planned)
- **Performance Monitoring**: Vercel Analytics dan Web Vitals
- **Database Health**: Supabase dashboard monitoring
- **Security Updates**: Regular dependency updates

---

**Document Version**: 1.0  
**Last Updated**: {{ current_date }}  
**Status**: Active Development  
**Next Review**: Setelah P0.1 completion