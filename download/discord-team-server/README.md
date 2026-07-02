# Discord Team Management Bot

A custom Discord bot designed for **marketing team leaders** to manage daily tasks, attendance, reports, meetings, and performance tracking — all in one place.

## Features

- **Attendance Tracking** — Daily check-in/check-out with punctuality scoring
- **Task Management** — Create, assign, track, and complete tasks with deadlines
- **Daily Reports** — Structured daily report submission (completed / in-progress / blockers / tomorrow)
- **Meeting Scheduling** — Schedule meetings and track attendance
- **Performance Tracking** — Points system with weekly/monthly leaderboard
- **Knowledge Base** — Tag and store marketing playbooks, templates, and guides
- **Automated Reminders** — Morning check-in reminder + end-of-day report reminder
- **Weekly Summary** — Auto-generated top performers + tasks summary every week

---

## Quick Start (5 Steps)

### Step 1 — Create the Bot on Discord

1. Go to <https://discord.com/developers/applications>
2. Click **"New Application"** → name it (e.g., `Marketing Team Bot`) → Create
3. Go to **Bot** tab → **Add Bot** → confirm
4. Under **Privileged Gateway Intents**, enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy the **bot token** (click "Reset Token" if you don't see it)

### Step 2 — Invite the Bot to Your Server

1. In the Developer Portal, go to **OAuth2 → URL Generator**
2. Select scopes: `bot` and `applications.commands`
3. Select permissions:
   - Manage Roles
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Read Message History
   - Mention Everyone
   - Add Reactions
   - Use Slash Commands
4. Copy the generated URL and open it in your browser
5. Select your server → Authorize

### Step 3 — Install Python Dependencies

```bash
# Requires Python 3.10 or newer
python -m venv venv
source venv/bin/activate     # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 4 — Configure the Bot

1. Open `config.json` in a text editor
2. Set `"token"` to your bot token (or set `DISCORD_TOKEN` env variable)
3. Set `"guild_id"` to your server ID (right-click server name in Discord → Copy ID — enable Developer Mode in Discord Settings → Advanced first)
4. Fill in the `"channels"` section with channel IDs from your server
5. Fill in the `"roles"` section with role IDs from your server
6. Adjust `"schedule"` times to match your team's working hours
7. (Optional) Tweak the `"points"` values for your gamification preferences

**To get channel/role IDs:** right-click any channel or role in Discord → "Copy ID"

### Step 5 — Run the Bot

```bash
python bot.py
```

You should see:
```
2026-07-03 09:00:00 | INFO     | team-bot | Logged in as Marketing Team Bot#1234
2026-07-03 09:00:00 | INFO     | team-bot | Synced 16 slash commands to guild 123456789
```

Type `/` in any channel of your server to see all available commands!

---

## Server Structure (Recommended Setup)

Create these categories and channels in your Discord server, then put their IDs in `config.json`:

### Categories & Channels

| Category | Channel | Type | Purpose |
|---|---|---|---|
| 📋 INFORMATION HUB | `#announcements` | text | Team-wide announcements, scheduled meetings |
| | `#rules` | text | Server rules and expectations |
| | `#team-info` | text | Team member list, contact info, time zones |
| | `#knowledge-base` | text | Tagged playbooks, templates, brand guides |
| ⏰ ATTENDANCE | `#check-in` | text | Bot posts morning reminders here |
| | `#attendance-logs` | text | Auto-logged check-in/check-out events |
| 📝 TASK MANAGEMENT | `#task-assignments` | text | New tasks posted here by bot |
| | `#task-progress` | text | Discuss ongoing task progress |
| | `#completed-tasks` | text | Auto-logged completed tasks |
| 🎯 MARKETING DEPARTMENTS | `#social-media` | text | Social media marketing discussions |
| | `#content-creation` | text | Blog, video, design content |
| | `#seo-analytics` | text | SEO and analytics discussions |
| | `#paid-ads` | text | Paid advertising campaigns |
| | `#email-marketing` | text | Email campaigns and automation |
| 🚀 PROJECTS | `#project-alpha` | text | Specific project discussions |
| | `#project-beta` | text | (Add more as needed) |
| 📊 REPORTS | `#daily-reports` | text | Auto-posted daily reports |
| | `#weekly-summary` | text | Auto-posted weekly summaries |
| 🏆 PERFORMANCE | `#leaderboard` | text | (Optional) Weekly leaderboard posts |
| | `#kudos` | text | Peer recognition |
| 🎙️ MEETINGS | `🔊 Meeting Room` | voice | Daily standups and team meetings |
| | `#meeting-notes` | text | Shared meeting notes |
| 🔒 TEAM LEADER | `#tl-private` | text | (TL only) Private TL discussions |
| | `#tl-decisions` | text | (TL only) Decision log |

### Roles (in order, highest to lowest priority)

1. **Team Leader** — Full admin on the server, can use all bot commands
2. **Senior Marketer** — Can add KB entries, manage junior members
3. **Marketing Specialist** — Standard team member, can use bot commands
4. **Junior Marketer** — New members, limited permissions
5. **Guest** — Read-only access to public channels

---

## Command Reference

### Attendance Commands

| Command | Who | Description |
|---|---|---|
| `/checkin` | All members | Register daily check-in (awards 2 pts on time, 1 pt late) |
| `/checkout` | All members | Register check-out (records work duration) |
| `/attendance` | Team Leader | View today's attendance; optionally filter by member |

### Task Management

| Command | Who | Description |
|---|---|---|
| `/task-create` | Team Leader | Create a new task with title, description, deadline, priority |
| `/task-assign` | Team Leader | Assign an existing task to a member |
| `/task-complete` | Assignee or TL | Mark a task as completed (awards 5 pts, +2 if early) |
| `/task-list` | All members | List tasks; filter by status or assignee |

### Daily Reports

| Command | Who | Description |
|---|---|---|
| `/report-submit` | All members | Submit daily report (awards 3 pts) |
| `/report-view` | Team Leader | View today's reports; optionally filter by member |

### Meetings

| Command | Who | Description |
|---|---|---|
| `/meeting-schedule` | Team Leader | Schedule a meeting with title, time, duration, agenda |
| `/meeting-attend` | All members | Mark attendance at a meeting (awards 4 pts) |

### Performance

| Command | Who | Description |
|---|---|---|
| `/leaderboard` | All members | Show top 10 performers (weekly/monthly/all-time) |
| `/performance` | All members | View detailed performance stats; TL can view any member |
| `/kudos` | All members | Thank a teammate (+2 pts to them) |

### Knowledge Base

| Command | Who | Description |
|---|---|---|
| `/kb-add` | TL or Senior | Add a tagged KB entry (playbook, template, brand, etc.) |

### Help

| Command | Description |
|---|---|
| `/help` | Show all available commands |

---

## Daily Workflow (Recommended)

| Time | Activity | Command |
|---|---|---|
| 09:00 | Bot sends morning reminder | (automatic) |
| 09:00–10:00 | Team members check in | `/checkin` |
| 10:00 | Team Leader reviews attendance | `/attendance` |
| 10:15 | Team Leader assigns daily tasks | `/task-create` |
| Throughout day | Members work on tasks, update progress | (in `#task-progress`) |
| 17:00 | Bot sends report reminder | (automatic) |
| 17:00–18:00 | Members submit daily reports | `/report-submit` |
| 18:00 | Members check out | `/checkout` |
| Friday 16:00 | Bot posts weekly summary | (automatic) |

---

## File Structure

```
discord-team-server/
├── bot.py              # Main bot file (all commands and logic)
├── config.json         # Bot configuration (token, channel IDs, schedule)
├── requirements.txt    # Python dependencies
├── README.md           # This file
├── .gitignore          # Ignores data/, venv/, etc.
├── bot.log             # Auto-generated log file
└── data/               # Auto-created data directory
    ├── attendance.json
    ├── tasks.json
    ├── reports.json
    ├── points.json
    └── meetings.json
```

---

## Troubleshooting

**Bot not responding to commands?**
- Make sure you invited the bot with `applications.commands` scope
- Wait up to 1 hour for global commands to sync (guild commands are instant)
- Check the bot log for sync errors

**Permission errors?**
- Ensure the bot's role is **above** the roles it needs to manage
- Re-check the OAuth2 permissions when inviting the bot
- Make sure channel IDs in `config.json` are correct

**Slash commands not showing up?**
- Make sure `guild_id` in `config.json` is set (commands sync instantly to a specific guild)
- Restart the bot after changing `config.json`

**Attendance not registering?**
- Verify `attendance_logs` channel ID is correct
- Check the bot has "Send Messages" permission in that channel

---

## Customization

- **Change reminder times**: Edit `schedule` section in `config.json`
- **Change points values**: Edit `points` section in `config.json`
- **Add new commands**: Add new `@app_commands.command()` functions in `bot.py`
- **Change timezone**: Update `schedule.timezone` in `config.json` (e.g., `Africa/Algiers`, `Europe/London`, `America/New_York`)

---

## License

MIT — Free to use, modify, and distribute.

## Support

If you need help setting up the bot or customizing it for your team, refer to the included PDF guide or contact your system administrator.
