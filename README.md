# TeamHub — Marketing Team Management Platform

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

### 4. Create demo data
Open http://localhost:3000, click "First time? Create demo data".

**Demo credentials:**
- Team Leader: `leader@team.com` / `leader123`
- Members: `fatima@team.com`, `khaled@team.com`, etc. / `member123`

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
