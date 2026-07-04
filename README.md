# Innov8 Brands — Brand Management Platform

منصة متكاملة لإدارة فريق التسويق | Complete marketing team management platform

## ✨ Features | الميزات

- **🌍 Bilingual** — Full Arabic (RTL) + English (LTR) support with language switcher
- **⏰ Attendance** — Daily check-in/check-out with punctuality scoring
- **✅ Tasks** — Create, assign, track, and complete tasks with priorities and deadlines
- **📝 Daily Reports** — Structured reports with **Google Drive link submission** for daily work
- **📅 Meetings** — Schedule meetings and track attendance
- **🏆 Leaderboard** — Points system with weekly/monthly rankings + peer kudos
- **📚 Knowledge Base** — Tagged articles (Playbooks, Templates, Brand Guides, etc.)
- **📢 Announcements** — Team-wide announcements with pinning
- **👥 Team Management** — Add/edit/remove members and roles (Team Leader only)

## 🛠 Tech Stack

- **Next.js 16** with App Router
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui**
- **Prisma ORM** + **SQLite**
- **Arabic fonts**: Cairo + Tajawal
- **English font**: Inter

## 🚀 Quick Start

### 1. Install dependencies
```bash
bun install
# or
npm install
```

### 2. Set up the database
```bash
cp .env.example .env
bun run db:push
```

### 3. Run the dev server
```bash
bun run dev
```

### 4. First-time setup
Open http://localhost:3000. You'll see a setup dialog automatically.
- Enter your name (e.g., "Adlene")
- Choose a password (6+ characters)
- Confirm password

This creates the **admin account** (email: `admin@team.com`). You are now logged in as the admin.

### 5. Add team members
As admin, go to "Team Management" → "New Member" and create accounts for your workers. Give them their credentials — they cannot self-register.

## 👑 Admin-Only Mode

This platform is **admin-only**:
- ✅ No self-registration (sign-up) for workers
- ✅ Only the admin can create, edit, and delete worker accounts
- ✅ Only the admin can create tasks, meetings, and announcements
- ✅ Admin email is fixed: `admin@team.com`

Workers can only:
- Check in/out
- View and complete assigned tasks
- Submit daily reports (with Google Drive link)
- View leaderboard and knowledge base
- Send kudos to peers

## 🌐 Language Switching

- Click the language button (ع / EN) in the top-right corner
- The entire UI switches between Arabic (RTL) and English (LTR)
- Language preference is saved in localStorage

## 📊 Daily Workflow

1. **Morning**: Team members check in
2. **Throughout day**: Work on assigned tasks
3. **End of day**: Submit daily report with:
   - What was completed
   - What's in progress
   - Blockers
   - Tomorrow's plan
   - **Google Drive link** with the day's work files
4. **Friday**: Auto-generated weekly summary

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes (auth, attendance, tasks, etc.)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Main page (single-route app)
├── components/
│   ├── modules/          # 9 feature modules
│   │   ├── dashboard.tsx
│   │   ├── attendance.tsx
│   │   ├── tasks.tsx
│   │   ├── reports.tsx   # Includes Google Drive link feature
│   │   ├── meetings.tsx
│   │   ├── leaderboard.tsx
│   │   ├── knowledge-base.tsx
│   │   ├── announcements.tsx
│   │   └── team.tsx
│   ├── app-shell.tsx
│   ├── login-screen.tsx
│   ├── language-provider.tsx
│   └── language-switcher.tsx
└── lib/
    ├── auth.ts           # Server-side auth utilities
    ├── auth-labels.ts    # Client-safe labels + date helpers
    ├── db.ts             # Prisma client
    ├── i18n.ts           # AR + EN translations
    └── points.ts         # Points config + helpers

prisma/
└── schema.prisma         # Database schema
```

## 📝 License

MIT — Free to use, modify, and distribute.

## ⚠️ Important Note on Vercel Deployment

The current deployment uses **SQLite on Vercel serverless**, which has a limitation:
each serverless function invocation may hit a different container with its own
ephemeral `/tmp` directory. This means data may not persist reliably between
requests on cold instances.

**For production use**, please migrate to a persistent database:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (recommended)
- [Neon Postgres](https://neon.tech)
- [Supabase](https://supabase.com)

The local development version (with `npm run dev`) works perfectly because it
uses a single SQLite file on disk.
