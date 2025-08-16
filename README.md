# Casino Guide - Professional Online Casino Website

A modern, professional online casino guide built with Next.js and Supabase, featuring a sleek black and green glassmorphism design.

## 🚀 Features

### Frontend
- **Next.js 15** with App Router
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Glassmorphism UI** - Transparent cards with blur effects
- **Dark Theme** - Black background with green (#00ff88) accents
- **Smooth Animations** - Hover effects and transitions
- **Dynamic Navbar** - Hidden on homepage hero, appears on scroll

### Backend (Supabase)
- **Authentication** - Email/password + Google OAuth
- **Database** - PostgreSQL with Row Level Security
- **Storage** - File uploads for images and assets
- **Real-time** - Live updates for forum posts and comments

### Pages & Features
1. **Homepage** - Fullscreen hero, top casinos, latest news, leaderboard preview
2. **Casinos** - Complete casino listings with ratings and details
3. **Bonuses** - Best casino bonuses with claim buttons
4. **Leaderboard** - Player rankings with podium display
5. **Forum** - Community discussions (auth required)
6. **News** - Latest casino industry news
7. **Reports** - User issue reporting system

## 🛠 Setup Instructions

### 1. Clone and Install
\`\`\`bash
git clone <repository-url>
cd casino-guide
npm install
\`\`\`

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. For complete setup, follow the detailed `SQL_EXECUTION_GUIDE.md`:
   - **Fresh Install**: Execute `scripts/baseline.sql` (recommended)
   - **Existing Database**: Execute `scripts/delta-upgrade.sql`

### 3. Environment Variables
\`\`\`bash
cp .env.example .env.local
\`\`\`
Fill in your credentials:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_DOMAIN=your-domain.com

# Optional: For Slack notifications
WEBHOOK_SECRET=your_webhook_secret_minimum_32_chars
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
\`\`\`

### 4. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
Visit `http://localhost:3000`

## 🗄 Database Schema

### Tables
- `casinos` - Casino information and ratings
- `bonuses` - Casino bonuses and promotions  
- `leaderboard` - Player rankings and points
- `news` - News articles and updates
- `forum_posts` - Community forum posts
- `forum_comments` - Forum post comments
- `reports` - User issue reports

### Authentication
- Email/password authentication
- Google OAuth integration
- Row Level Security (RLS) enabled
- User profiles linked to auth.users

## 🎨 Design System

### Colors
- **Primary Background**: #000000 (Black)
- **Accent Color**: #00ff88 (Bright Green)
- **Glass Cards**: White with 5% opacity + blur effect
- **Text**: White primary, gray-400 secondary

### Components
- **GlassCard**: Reusable glassmorphism container
- **Navbar**: Dynamic visibility based on scroll
- **HeroBanner**: Fullscreen homepage hero section

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Subdomain Setup
For custom subdomain (e.g., guide.yourdomain.com):
1. Add CNAME record pointing to Vercel
2. Configure custom domain in Vercel dashboard
3. Update `NEXT_PUBLIC_SITE_URL` environment variable

## 📱 Responsive Design

- **Mobile**: Optimized navigation and card layouts
- **Tablet**: Adjusted grid systems and spacing
- **Desktop**: Full feature set with hover effects

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Authentication required for forum posting
- Input validation and sanitization
- CORS protection
- Environment variable protection

## 🎯 SEO Optimization

- Next.js built-in SEO features
- Meta tags and descriptions
- Structured data markup
- Optimized images with lazy loading
- Fast loading times with SSR/SSG

## 📊 Performance

- **Lazy Loading** - Images and components
- **Code Splitting** - Automatic with Next.js
- **Caching** - Supabase query caching
- **Optimized Images** - Next.js Image component
- **Minimal Bundle Size** - Tree shaking enabled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed description
4. Contact support team

---

Built with ❤️ using Next.js and Supabase
