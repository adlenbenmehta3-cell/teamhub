"""
============================================================
Discord Team Management Bot
For Marketing Team Leaders - Manage Daily Tasks, Attendance,
Reports, Meetings, and Performance Tracking
============================================================

Author: Z.ai
Version: 1.0.0
License: MIT

Description:
    A custom Discord bot designed for marketing team leaders
    to monitor team members, manage daily tasks, track attendance,
    collect daily reports, schedule meetings, and evaluate
    performance through a gamified points system.

Requirements:
    - Python 3.10+
    - discord.py >= 2.3.2
    - python-dotenv >= 1.0.0
    - APScheduler >= 3.10.4
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta, date
from pathlib import Path

import discord
from discord import app_commands
from discord.ext import commands, tasks
from dotenv import load_dotenv

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False

# ============================================================
# Configuration & Logging
# ============================================================

load_dotenv()
BASE_DIR = Path(__file__).parent
CONFIG_PATH = BASE_DIR / "config.json"
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(BASE_DIR / "bot.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("team-bot")


def load_config() -> dict:
    """Load configuration from config.json."""
    if not CONFIG_PATH.exists():
        log.error("config.json not found. Copy config.example.json to config.json.")
        sys.exit(1)
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


CONFIG = load_config()
TOKEN = os.getenv("DISCORD_TOKEN") or CONFIG.get("token", "")
GUILD_ID = CONFIG.get("guild_id", 0)


# ============================================================
# Data Persistence (JSON files)
# ============================================================

def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return default


def save_json(path: Path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


# Data files
ATTENDANCE_FILE = DATA_DIR / "attendance.json"
TASKS_FILE = DATA_DIR / "tasks.json"
REPORTS_FILE = DATA_DIR / "reports.json"
POINTS_FILE = DATA_DIR / "points.json"
MEETINGS_FILE = DATA_DIR / "meetings.json"


# ============================================================
# Bot Setup
# ============================================================

intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(
    command_prefix="!",
    intents=intents,
    help_command=None,
)


@bot.event
async def on_ready():
    """Called when bot is ready and connected to Discord."""
    log.info("=" * 60)
    log.info(f"Logged in as {bot.user} (ID: {bot.user.id})")
    log.info(f"Connected to {len(bot.guilds)} guild(s)")
    log.info("=" * 60)

    # Sync slash commands
    try:
        if GUILD_ID:
            guild = discord.Object(id=GUILD_ID)
            synced = await bot.tree.sync(guild=guild)
            log.info(f"Synced {len(synced)} slash commands to guild {GUILD_ID}")
        else:
            synced = await bot.tree.sync()
            log.info(f"Synced {len(synced)} global slash commands")
    except Exception as e:
        log.error(f"Failed to sync commands: {e}")

    # Start scheduled tasks
    if not daily_morning_reminder.is_running():
        daily_morning_reminder.start()
    if not report_reminder.is_running():
        report_reminder.start()
    if not weekly_summary_task.is_running():
        weekly_summary_task.start()

    # Start APScheduler for fine-grained scheduling
    if APSCHEDULER_AVAILABLE:
        scheduler = AsyncIOScheduler()
        schedule_cfg = CONFIG.get("schedule", {})
        tz = schedule_cfg.get("timezone", "UTC")

        # Reset daily attendance at midnight
        scheduler.add_job(
            reset_daily_attendance,
            CronTrigger(hour=0, minute=0, timezone=tz),
            id="reset_attendance",
        )
        scheduler.start()
        log.info("APScheduler started for fine-grained scheduling")


# ============================================================
# Helper Functions
# ============================================================

def get_channel(name: str) -> int:
    """Get channel ID from config."""
    return CONFIG.get("channels", {}).get(name, 0)


def get_role_id(name: str) -> int:
    """Get role ID from config."""
    return CONFIG.get("roles", {}).get(name, 0)


def is_team_leader(member: discord.Member) -> bool:
    """Check if member has team leader role."""
    tl_role_id = get_role_id("team_leader")
    if not tl_role_id:
        return False
    return any(r.id == tl_role_id for r in member.roles)


def today_str() -> str:
    return date.today().isoformat()


def now_iso() -> str:
    return datetime.now().isoformat()


def add_points(user_id: int, amount: int, reason: str):
    """Add points to a user. Points are tracked per week and per month."""
    points = load_json(POINTS_FILE, {})
    user_key = str(user_id)
    if user_key not in points:
        points[user_key] = {
            "total": 0,
            "weekly": 0,
            "monthly": 0,
            "history": [],
        }
    points[user_key]["total"] += amount
    points[user_key]["weekly"] += amount
    points[user_key]["monthly"] += amount
    points[user_key]["history"].append({
        "amount": amount,
        "reason": reason,
        "timestamp": now_iso(),
    })
    save_json(POINTS_FILE, points)


def get_leaderboard(period: str = "weekly") -> list:
    """Get leaderboard sorted by points for the given period."""
    points = load_json(POINTS_FILE, {})
    entries = []
    for user_id, data in points.items():
        entries.append((int(user_id), data.get(period, 0)))
    entries.sort(key=lambda x: x[1], reverse=True)
    return entries


async def reset_weekly_points():
    """Reset weekly points (call on Monday morning)."""
    points = load_json(POINTS_FILE, {})
    for user_id in points:
        points[user_id]["weekly"] = 0
    save_json(POINTS_FILE, points)
    log.info("Weekly points reset")


async def reset_monthly_points():
    """Reset monthly points (call on 1st of month)."""
    points = load_json(POINTS_FILE, {})
    for user_id in points:
        points[user_id]["monthly"] = 0
    save_json(POINTS_FILE, points)
    log.info("Monthly points reset")


async def reset_daily_attendance():
    """Reset daily attendance at midnight."""
    attendance = load_json(ATTENDANCE_FILE, {})
    today = today_str()
    # Keep historical data, just mark today as new
    if today not in attendance:
        attendance[today] = {}
        save_json(ATTENDANCE_FILE, attendance)
    log.info(f"Daily attendance reset for {today}")


# ============================================================
# Embed Helpers
# ============================================================

COLOR_PRIMARY = 0x5865F2     # Discord Blurple
COLOR_SUCCESS = 0x57F287     # Discord Green
COLOR_WARNING = 0xFEE75C     # Discord Yellow
COLOR_DANGER = 0xED4245      # Discord Red
COLOR_INFO = 0xEB459E        # Discord Fuchsia


def success_embed(title: str, description: str = "") -> discord.Embed:
    return discord.Embed(title=title, description=description, color=COLOR_SUCCESS)


def error_embed(title: str, description: str = "") -> discord.Embed:
    return discord.Embed(title=title, description=description, color=COLOR_DANGER)


def info_embed(title: str, description: str = "") -> discord.Embed:
    return discord.Embed(title=title, description=description, color=COLOR_INFO)


def warning_embed(title: str, description: str = "") -> discord.Embed:
    return discord.Embed(title=title, description=description, color=COLOR_WARNING)


# ============================================================
# ATTENDANCE COMMANDS
# ============================================================

class AttendanceCog(commands.Cog):
    """Daily check-in / check-out commands."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="checkin", description="Register your daily check-in")
    @app_commands.guilds(discord.Object(id=GUILD_ID)) if GUILD_ID else (lambda f: f)
    async def checkin(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        user = interaction.user
        attendance = load_json(ATTENDANCE_FILE, {})
        today = today_str()
        if today not in attendance:
            attendance[today] = {}
        user_key = str(user.id)

        if user_key in attendance[today] and attendance[today][user_key].get("check_in"):
            await interaction.followup.send(
                embed=warning_embed(
                    "Already Checked In",
                    f"You already checked in today at "
                    f"{attendance[today][user_key]['check_in']}.",
                ),
                ephemeral=True,
            )
            return

        now = datetime.now()
        deadline_hour = int(CONFIG.get("schedule", {}).get("check_in_deadline", "10:00").split(":")[0])
        is_late = now.hour >= deadline_hour
        points_cfg = CONFIG.get("points", {})
        pts = points_cfg.get("late_checkin", 1) if is_late else points_cfg.get("on_time_checkin", 2)

        attendance[today][user_key] = {
            "username": user.display_name,
            "check_in": now.strftime("%H:%M:%S"),
            "check_out": None,
            "late": is_late,
            "points": pts,
        }
        save_json(ATTENDANCE_FILE, attendance)
        add_points(user.id, pts, "check-in")

        # Log to attendance-logs channel
        log_channel_id = get_channel("attendance_logs")
        if log_channel_id:
            channel = self.bot.get_channel(log_channel_id)
            if channel:
                status_emoji_text = "LATE" if is_late else "ON TIME"
                embed = discord.Embed(
                    title=f"Check-In: {user.display_name}",
                    description=f"Time: {now.strftime('%H:%M:%S')}\nStatus: **{status_emoji_text}**\nPoints: +{pts}",
                    color=COLOR_WARNING if is_late else COLOR_SUCCESS,
                    timestamp=now,
                )
                embed.set_thumbnail(url=user.display_avatar.url)
                await channel.send(embed=embed)

        msg = (
            f"You checked in **{'LATE' if is_late else 'ON TIME'}** at {now.strftime('%H:%M:%S')}. "
            f"Points earned: **+{pts}**"
        )
        await interaction.followup.send(
            embed=success_embed("Check-In Successful", msg), ephemeral=True
        )

    @app_commands.command(name="checkout", description="Register your daily check-out")
    async def checkout(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        user = interaction.user
        attendance = load_json(ATTENDANCE_FILE, {})
        today = today_str()
        user_key = str(user.id)

        if today not in attendance or user_key not in attendance[today]:
            await interaction.followup.send(
                embed=error_embed("Not Checked In", "You need to check in first using `/checkin`."),
                ephemeral=True,
            )
            return

        if attendance[today][user_key].get("check_out"):
            await interaction.followup.send(
                embed=warning_embed(
                    "Already Checked Out",
                    f"You already checked out at {attendance[today][user_key]['check_out']}.",
                ),
                ephemeral=True,
            )
            return

        now = datetime.now()
        check_in_str = attendance[today][user_key]["check_in"]
        try:
            check_in_time = datetime.strptime(check_in_str, "%H:%M:%S").replace(
                year=now.year, month=now.month, day=now.day
            )
            worked = now - check_in_time
            hours = int(worked.total_seconds() // 3600)
            minutes = int((worked.total_seconds() % 3600) // 60)
            work_duration = f"{hours}h {minutes}m"
        except Exception:
            work_duration = "Unknown"

        attendance[today][user_key]["check_out"] = now.strftime("%H:%M:%S")
        attendance[today][user_key]["work_duration"] = work_duration
        save_json(ATTENDANCE_FILE, attendance)

        log_channel_id = get_channel("attendance_logs")
        if log_channel_id:
            channel = self.bot.get_channel(log_channel_id)
            if channel:
                embed = discord.Embed(
                    title=f"Check-Out: {user.display_name}",
                    description=f"Time: {now.strftime('%H:%M:%S')}\nWorked: **{work_duration}**",
                    color=COLOR_INFO,
                    timestamp=now,
                )
                embed.set_thumbnail(url=user.display_avatar.url)
                await channel.send(embed=embed)

        await interaction.followup.send(
            embed=success_embed(
                "Check-Out Successful",
                f"You checked out at {now.strftime('%H:%M:%S')}. Worked: **{work_duration}**. Have a great evening!",
            ),
            ephemeral=True,
        )

    @app_commands.command(name="attendance", description="View today's attendance (Team Leader only)")
    @app_commands.describe(member="Optional: view attendance for a specific member")
    async def attendance(self, interaction: discord.Interaction, member: discord.Member = None):
        if not is_team_leader(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders can use this command."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        attendance = load_json(ATTENDANCE_FILE, {})
        today = today_str()
        today_data = attendance.get(today, {})

        if member:
            user_key = str(member.id)
            data = today_data.get(user_key, {})
            if not data:
                await interaction.followup.send(
                    embed=warning_embed("No Record", f"{member.display_name} has not checked in today."),
                    ephemeral=True,
                )
                return
            embed = discord.Embed(
                title=f"Attendance: {member.display_name}",
                color=COLOR_PRIMARY,
                timestamp=datetime.now(),
            )
            embed.add_field(name="Check-In", value=data.get("check_in", "—"), inline=True)
            embed.add_field(name="Check-Out", value=data.get("check_out", "—"), inline=True)
            embed.add_field(name="Work Duration", value=data.get("work_duration", "—"), inline=True)
            embed.add_field(name="Status", value="LATE" if data.get("late") else "ON TIME", inline=True)
            embed.add_field(name="Points", value=f"+{data.get('points', 0)}", inline=True)
            embed.set_thumbnail(url=member.display_avatar.url)
            await interaction.followup.send(embed=embed, ephemeral=True)
            return

        if not today_data:
            await interaction.followup.send(
                embed=warning_embed("No Records", "No one has checked in today yet."),
                ephemeral=True,
            )
            return

        embed = discord.Embed(
            title=f"Today's Attendance — {today}",
            color=COLOR_PRIMARY,
            timestamp=datetime.now(),
        )
        for user_id, data in today_data.items():
            status = "LATE" if data.get("late") else "ON TIME"
            check_out = data.get("check_out", "Still working")
            embed.add_field(
                name=f"{data.get('username', 'Unknown')}",
                value=f"In: {data.get('check_in', '—')} | Out: {check_out}\nStatus: **{status}** | +{data.get('points', 0)} pts",
                inline=False,
            )
        embed.set_footer(text=f"Total checked in: {len(today_data)}")
        await interaction.followup.send(embed=embed, ephemeral=True)


# ============================================================
# TASK MANAGEMENT COMMANDS
# ============================================================

class TasksCog(commands.Cog):
    """Task creation, assignment, and tracking."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="task-create", description="Create a new task (Team Leader only)")
    @app_commands.describe(
        title="Short task title",
        description="Detailed task description",
        deadline="Deadline (YYYY-MM-DD HH:MM) or just YYYY-MM-DD",
        priority="Task priority level",
        assignee="Member to assign the task to (optional)",
    )
    @app_commands.choices(priority=[
        app_commands.Choice(name="Low", value="low"),
        app_commands.Choice(name="Medium", value="medium"),
        app_commands.Choice(name="High", value="high"),
        app_commands.Choice(name="Urgent", value="urgent"),
    ])
    async def task_create(
        self,
        interaction: discord.Interaction,
        title: str,
        description: str,
        deadline: str,
        priority: app_commands.Choice[str] = None,
        assignee: discord.Member = None,
    ):
        if not is_team_leader(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders can create tasks."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        tasks = load_json(TASKS_FILE, {"tasks": [], "next_id": 1})
        task_id = tasks["next_id"]
        priority_val = priority.value if priority else "medium"

        # Parse deadline
        try:
            if " " in deadline:
                deadline_dt = datetime.strptime(deadline, "%Y-%m-%d %H:%M")
            else:
                deadline_dt = datetime.strptime(deadline, "%Y-%m-%d").replace(hour=23, minute=59)
        except ValueError:
            await interaction.followup.send(
                embed=error_embed(
                    "Invalid Date Format",
                    "Use YYYY-MM-DD HH:MM or YYYY-MM-DD. Example: 2026-07-05 17:00",
                ),
                ephemeral=True,
            )
            return

        task = {
            "id": task_id,
            "title": title,
            "description": description,
            "deadline": deadline_dt.isoformat(),
            "priority": priority_val,
            "assignee_id": assignee.id if assignee else None,
            "assignee_name": assignee.display_name if assignee else "Unassigned",
            "created_by": interaction.user.display_name,
            "created_at": now_iso(),
            "status": "open",
            "completed_at": None,
            "completed_by": None,
        }
        tasks["tasks"].append(task)
        tasks["next_id"] = task_id + 1
        save_json(TASKS_FILE, tasks)

        # Post to task-assignments channel
        channel_id = get_channel("task_assignments")
        if channel_id:
            channel = self.bot.get_channel(channel_id)
            if channel:
                priority_colors = {
                    "low": COLOR_INFO,
                    "medium": COLOR_PRIMARY,
                    "high": COLOR_WARNING,
                    "urgent": COLOR_DANGER,
                }
                embed = discord.Embed(
                    title=f"Task #{task_id}: {title}",
                    description=description,
                    color=priority_colors.get(priority_val, COLOR_PRIMARY),
                    timestamp=datetime.now(),
                )
                embed.add_field(name="Priority", value=priority_val.upper(), inline=True)
                embed.add_field(
                    name="Assignee",
                    value=assignee.mention if assignee else "Unassigned",
                    inline=True,
                )
                embed.add_field(
                    name="Deadline",
                    value=deadline_dt.strftime("%Y-%m-%d %H:%M"),
                    inline=True,
                )
                embed.set_footer(text=f"Created by {interaction.user.display_name}")
                await channel.send(
                    content=assignee.mention if assignee else "",
                    embed=embed,
                )

        await interaction.followup.send(
            embed=success_embed(
                "Task Created",
                f"Task #{task_id} created successfully and posted to <#{channel_id}>.",
            ),
            ephemeral=True,
        )

    @app_commands.command(name="task-assign", description="Assign an existing task to a member (Team Leader only)")
    @app_commands.describe(task_id="Task ID", member="Member to assign")
    async def task_assign(self, interaction: discord.Interaction, task_id: int, member: discord.Member):
        if not is_team_leader(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders can assign tasks."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        tasks = load_json(TASKS_FILE, {"tasks": [], "next_id": 1})
        task = next((t for t in tasks["tasks"] if t["id"] == task_id), None)
        if not task:
            await interaction.followup.send(
                embed=error_embed("Not Found", f"Task #{task_id} does not exist."),
                ephemeral=True,
            )
            return

        task["assignee_id"] = member.id
        task["assignee_name"] = member.display_name
        save_json(TASKS_FILE, tasks)

        channel_id = get_channel("task_assignments")
        if channel_id:
            channel = self.bot.get_channel(channel_id)
            if channel:
                await channel.send(
                    content=member.mention,
                    embed=info_embed(
                        f"Task #{task_id} Assigned",
                        f"**{task['title']}** has been assigned to {member.mention}.\n"
                        f"Deadline: {task['deadline']}",
                    ),
                )

        await interaction.followup.send(
            embed=success_embed(
                "Task Assigned",
                f"Task #{task_id} assigned to {member.display_name}.",
            ),
            ephemeral=True,
        )

    @app_commands.command(name="task-complete", description="Mark a task as completed")
    @app_commands.describe(task_id="Task ID", notes="Optional completion notes")
    async def task_complete(self, interaction: discord.Interaction, task_id: int, notes: str = ""):
        await interaction.response.defer(ephemeral=True)
        tasks = load_json(TASKS_FILE, {"tasks": [], "next_id": 1})
        task = next((t for t in tasks["tasks"] if t["id"] == task_id), None)
        if not task:
            await interaction.followup.send(
                embed=error_embed("Not Found", f"Task #{task_id} does not exist."),
                ephemeral=True,
            )
            return

        if task["status"] == "completed":
            await interaction.followup.send(
                embed=warning_embed("Already Completed", f"Task #{task_id} was already completed."),
                ephemeral=True,
            )
            return

        # Permission check: assignee or team leader
        is_assignee = task.get("assignee_id") == interaction.user.id
        if not (is_assignee or is_team_leader(interaction.user)):
            await interaction.followup.send(
                embed=error_embed("Permission Denied", "Only the assignee or Team Leader can complete this task."),
                ephemeral=True,
            )
            return

        task["status"] = "completed"
        task["completed_at"] = now_iso()
        task["completed_by"] = interaction.user.display_name
        if notes:
            task["completion_notes"] = notes
        save_json(TASKS_FILE, tasks)

        # Award points
        points_cfg = CONFIG.get("points", {})
        try:
            deadline = datetime.fromisoformat(task["deadline"])
            if datetime.now() < deadline:
                pts = points_cfg.get("task_completed_early", 7)
                bonus_text = " (early completion bonus!)"
            else:
                pts = points_cfg.get("task_completed", 5)
                bonus_text = ""
        except Exception:
            pts = points_cfg.get("task_completed", 5)
            bonus_text = ""

        if task.get("assignee_id"):
            add_points(task["assignee_id"], pts, f"completed task #{task_id}")

        # Post to completed-tasks channel
        channel_id = get_channel("completed_tasks")
        if channel_id:
            channel = self.bot.get_channel(channel_id)
            if channel:
                embed = success_embed(
                    f"Task #{task_id} Completed: {task['title']}",
                    f"Completed by: {interaction.user.mention}\n"
                    f"Points: +{pts}{bonus_text}"
                    + (f"\nNotes: {notes}" if notes else ""),
                )
                embed.set_thumbnail(url=interaction.user.display_avatar.url)
                await channel.send(embed=embed)

        await interaction.followup.send(
            embed=success_embed(
                "Task Completed",
                f"Task #{task_id} marked as completed. Points: +{pts}{bonus_text}",
            ),
            ephemeral=True,
        )

    @app_commands.command(name="task-list", description="List all open tasks")
    @app_commands.describe(status="Filter by status", member="Filter by assignee")
    @app_commands.choices(status=[
        app_commands.Choice(name="Open", value="open"),
        app_commands.Choice(name="Completed", value="completed"),
        app_commands.Choice(name="All", value="all"),
    ])
    async def task_list(
        self,
        interaction: discord.Interaction,
        status: app_commands.Choice[str] = None,
        member: discord.Member = None,
    ):
        await interaction.response.defer(ephemeral=True)
        tasks = load_json(TASKS_FILE, {"tasks": [], "next_id": 1})
        status_val = status.value if status else "open"
        filtered = tasks["tasks"]
        if status_val != "all":
            filtered = [t for t in filtered if t["status"] == status_val]
        if member:
            filtered = [t for t in filtered if t.get("assignee_id") == member.id]

        if not filtered:
            await interaction.followup.send(
                embed=info_embed("No Tasks", "No tasks match your filters."),
                ephemeral=True,
            )
            return

        embed = discord.Embed(
            title="Task List",
            color=COLOR_PRIMARY,
            timestamp=datetime.now(),
        )
        for t in filtered[:15]:
            status_icon = {"open": "OPEN", "completed": "DONE"}.get(t["status"], "?")
            assignee = t.get("assignee_name", "Unassigned")
            try:
                deadline_dt = datetime.fromisoformat(t["deadline"])
                deadline_str = deadline_dt.strftime("%m-%d %H:%M")
                overdue = deadline_dt < datetime.now() and t["status"] == "open"
                if overdue:
                    deadline_str = f"OVERDUE ({deadline_str})"
            except Exception:
                deadline_str = t.get("deadline", "?")
            embed.add_field(
                name=f"#{t['id']} [{status_icon}] {t['title']}",
                value=f"Priority: {t.get('priority', 'medium')} | Assignee: {assignee} | Deadline: {deadline_str}",
                inline=False,
            )
        if len(filtered) > 15:
            embed.set_footer(text=f"Showing 15 of {len(filtered)} tasks. Use filters to narrow down.")
        await interaction.followup.send(embed=embed, ephemeral=True)


# ============================================================
# DAILY REPORTS
# ============================================================

class ReportsCog(commands.Cog):
    """Daily report submission and viewing."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="report-submit", description="Submit your daily work report")
    @app_commands.describe(
        completed="What you completed today",
        in_progress="What you're currently working on",
        blockers="Any blockers or help needed (optional)",
        tomorrow="Plan for tomorrow (optional)",
    )
    async def report_submit(
        self,
        interaction: discord.Interaction,
        completed: str,
        in_progress: str,
        blockers: str = "None",
        tomorrow: str = "—",
    ):
        await interaction.response.defer(ephemeral=True)
        reports = load_json(REPORTS_FILE, {})
        today = today_str()
        user_key = str(interaction.user.id)
        if today not in reports:
            reports[today] = {}
        reports[today][user_key] = {
            "username": interaction.user.display_name,
            "completed": completed,
            "in_progress": in_progress,
            "blockers": blockers,
            "tomorrow": tomorrow,
            "submitted_at": now_iso(),
        }
        save_json(REPORTS_FILE, reports)

        points_cfg = CONFIG.get("points", {})
        pts = points_cfg.get("daily_report_submitted", 3)
        add_points(interaction.user.id, pts, "daily report")

        channel_id = get_channel("daily_reports")
        if channel_id:
            channel = self.bot.get_channel(channel_id)
            if channel:
                embed = discord.Embed(
                    title=f"Daily Report — {interaction.user.display_name}",
                    color=COLOR_PRIMARY,
                    timestamp=datetime.now(),
                )
                embed.add_field(name="Completed Today", value=completed, inline=False)
                embed.add_field(name="In Progress", value=in_progress, inline=False)
                embed.add_field(name="Blockers", value=blockers, inline=False)
                embed.add_field(name="Plan for Tomorrow", value=tomorrow, inline=False)
                embed.set_thumbnail(url=interaction.user.display_avatar.url)
                embed.set_footer(text=f"Points: +{pts}")
                await channel.send(embed=embed)

        await interaction.followup.send(
            embed=success_embed(
                "Report Submitted",
                f"Your daily report has been posted to <#{channel_id}>. Points: +{pts}",
            ),
            ephemeral=True,
        )

    @app_commands.command(name="report-view", description="View today's reports (Team Leader only)")
    @app_commands.describe(member="Optional: view report for a specific member")
    async def report_view(self, interaction: discord.Interaction, member: discord.Member = None):
        if not is_team_leader(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders can view reports."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        reports = load_json(REPORTS_FILE, {})
        today = today_str()
        today_reports = reports.get(today, {})

        if member:
            user_key = str(member.id)
            data = today_reports.get(user_key)
            if not data:
                await interaction.followup.send(
                    embed=warning_embed("No Report", f"{member.display_name} has not submitted a report today."),
                    ephemeral=True,
                )
                return
            embed = discord.Embed(
                title=f"Report — {member.display_name} — {today}",
                color=COLOR_PRIMARY,
            )
            embed.add_field(name="Completed", value=data["completed"], inline=False)
            embed.add_field(name="In Progress", value=data["in_progress"], inline=False)
            embed.add_field(name="Blockers", value=data.get("blockers", "None"), inline=False)
            embed.add_field(name="Tomorrow", value=data.get("tomorrow", "—"), inline=False)
            await interaction.followup.send(embed=embed, ephemeral=True)
            return

        if not today_reports:
            await interaction.followup.send(
                embed=warning_embed("No Reports", "No reports submitted today yet."),
                ephemeral=True,
            )
            return

        embed = discord.Embed(
            title=f"Today's Reports — {today}",
            description=f"{len(today_reports)} report(s) submitted",
            color=COLOR_PRIMARY,
            timestamp=datetime.now(),
        )
        for user_id, data in today_reports.items():
            embed.add_field(
                name=data.get("username", "Unknown"),
                value=f"**Done:** {data['completed'][:200]}\n**Blockers:** {data.get('blockers', 'None')}",
                inline=False,
            )
        await interaction.followup.send(embed=embed, ephemeral=True)


# ============================================================
# MEETINGS
# ============================================================

class MeetingsCog(commands.Cog):
    """Schedule and track meetings."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="meeting-schedule", description="Schedule a team meeting (Team Leader only)")
    @app_commands.describe(
        title="Meeting title",
        datetime_str="Date and time (YYYY-MM-DD HH:MM)",
        duration_minutes="Duration in minutes",
        meeting_type="Type of meeting",
        agenda="Agenda items (separate with semicolons)",
    )
    @app_commands.choices(meeting_type=[
        app_commands.Choice(name="Daily Standup", value="standup"),
        app_commands.Choice(name="Weekly Team Meeting", value="weekly"),
        app_commands.Choice(name="Project Review", value="review"),
        app_commands.Choice(name="1-on-1", value="1on1"),
        app_commands.Choice(name="Brainstorm", value="brainstorm"),
    ])
    async def meeting_schedule(
        self,
        interaction: discord.Interaction,
        title: str,
        datetime_str: str,
        duration_minutes: int = 30,
        meeting_type: app_commands.Choice[str] = None,
        agenda: str = "",
    ):
        if not is_team_leader(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders can schedule meetings."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        try:
            meeting_dt = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        except ValueError:
            await interaction.followup.send(
                embed=error_embed(
                    "Invalid Format",
                    "Use YYYY-MM-DD HH:MM. Example: 2026-07-05 14:30",
                ),
                ephemeral=True,
            )
            return

        meetings = load_json(MEETINGS_FILE, {"meetings": [], "next_id": 1})
        meeting_id = meetings["next_id"]
        type_val = meeting_type.value if meeting_type else "general"
        meeting = {
            "id": meeting_id,
            "title": title,
            "datetime": meeting_dt.isoformat(),
            "duration_minutes": duration_minutes,
            "type": type_val,
            "agenda": agenda,
            "created_by": interaction.user.display_name,
            "attendees": [],
            "status": "scheduled",
        }
        meetings["meetings"].append(meeting)
        meetings["next_id"] = meeting_id + 1
        save_json(MEETINGS_FILE, meetings)

        # Post to announcements channel
        channel_id = get_channel("announcements")
        if channel_id:
            channel = self.bot.get_channel(channel_id)
            if channel:
                type_labels = {
                    "standup": "Daily Standup",
                    "weekly": "Weekly Team Meeting",
                    "review": "Project Review",
                    "1on1": "1-on-1",
                    "brainstorm": "Brainstorm Session",
                    "general": "Meeting",
                }
                embed = discord.Embed(
                    title=f"Meeting Scheduled: {title}",
                    description=f"**Type:** {type_labels.get(type_val, 'Meeting')}\n"
                    f"**When:** {meeting_dt.strftime('%Y-%m-%d %H:%M')} ({duration_minutes} min)\n"
                    f"**Agenda:** {agenda if agenda else '—'}",
                    color=COLOR_PRIMARY,
                    timestamp=datetime.now(),
                )
                embed.set_footer(text=f"Scheduled by {interaction.user.display_name} | Meeting ID: {meeting_id}")
                await channel.send(embed=embed)

        await interaction.followup.send(
            embed=success_embed(
                "Meeting Scheduled",
                f"Meeting #{meeting_id} '{title}' scheduled for {meeting_dt.strftime('%Y-%m-%d %H:%M')}.",
            ),
            ephemeral=True,
        )

    @app_commands.command(name="meeting-attend", description="Mark yourself as attended a meeting")
    @app_commands.describe(meeting_id="Meeting ID")
    async def meeting_attend(self, interaction: discord.Interaction, meeting_id: int):
        await interaction.response.defer(ephemeral=True)
        meetings = load_json(MEETINGS_FILE, {"meetings": [], "next_id": 1})
        meeting = next((m for m in meetings["meetings"] if m["id"] == meeting_id), None)
        if not meeting:
            await interaction.followup.send(
                embed=error_embed("Not Found", f"Meeting #{meeting_id} does not exist."),
                ephemeral=True,
            )
            return

        if interaction.user.id in meeting.get("attendees", []):
            await interaction.followup.send(
                embed=warning_embed("Already Marked", "You already marked attendance for this meeting."),
                ephemeral=True,
            )
            return

        meeting.setdefault("attendees", []).append(interaction.user.id)
        save_json(MEETINGS_FILE, meetings)

        points_cfg = CONFIG.get("points", {})
        pts = points_cfg.get("meeting_attended", 4)
        add_points(interaction.user.id, pts, f"meeting #{meeting_id}")

        await interaction.followup.send(
            embed=success_embed("Attendance Recorded", f"You attended meeting #{meeting_id}. Points: +{pts}"),
            ephemeral=True,
        )


# ============================================================
# PERFORMANCE & LEADERBOARD
# ============================================================

class PerformanceCog(commands.Cog):
    """Performance tracking and leaderboard."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="leaderboard", description="Show the team leaderboard")
    @app_commands.describe(period="Time period: weekly, monthly, or total")
    @app_commands.choices(period=[
        app_commands.Choice(name="This Week", value="weekly"),
        app_commands.Choice(name="This Month", value="monthly"),
        app_commands.Choice(name="All Time", value="total"),
    ])
    async def leaderboard(self, interaction: discord.Interaction, period: app_commands.Choice[str] = None):
        await interaction.response.defer(ephemeral=True)
        period_val = period.value if period else "weekly"
        entries = get_leaderboard(period_val)
        if not entries:
            await interaction.followup.send(
                embed=info_embed("No Data", "No points recorded yet."),
                ephemeral=True,
            )
            return

        embed = discord.Embed(
            title=f"Leaderboard — {period_val.title()}",
            color=0xFFD700,  # Gold
            timestamp=datetime.now(),
        )
        medals = ["1st", "2nd", "3rd"]
        lines = []
        for i, (user_id, pts) in enumerate(entries[:10]):
            member = interaction.guild.get_member(user_id)
            name = member.display_name if member else f"User {user_id}"
            rank_emoji = medals[i] if i < 3 else f"{i+1}th"
            lines.append(f"**{rank_emoji}** — {name}: **{pts}** pts")
        embed.description = "\n".join(lines)
        embed.set_footer(text=f"Total participants: {len(entries)}")
        await interaction.followup.send(embed=embed, ephemeral=True)

    @app_commands.command(name="performance", description="View your performance stats")
    @app_commands.describe(member="View another member's stats (Team Leader only)")
    async def performance(self, interaction: discord.Interaction, member: discord.Member = None):
        target = member or interaction.user
        if member and not is_team_leader(interaction.user):
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders can view others' stats."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        points = load_json(POINTS_FILE, {})
        user_key = str(target.id)
        user_points = points.get(user_key, {"total": 0, "weekly": 0, "monthly": 0, "history": []})

        # Compute attendance stats
        attendance = load_json(ATTENDANCE_FILE, {})
        attendance_count = 0
        late_count = 0
        for day_data in attendance.values():
            user_att = day_data.get(user_key)
            if user_att:
                attendance_count += 1
                if user_att.get("late"):
                    late_count += 1

        # Compute tasks completed
        tasks = load_json(TASKS_FILE, {"tasks": []})
        tasks_completed = sum(
            1 for t in tasks["tasks"]
            if t["status"] == "completed" and t.get("assignee_id") == target.id
        )
        tasks_open = sum(
            1 for t in tasks["tasks"]
            if t["status"] == "open" and t.get("assignee_id") == target.id
        )

        # Compute reports submitted
        reports = load_json(REPORTS_FILE, {})
        reports_count = sum(
            1 for day_reports in reports.values()
            if user_key in day_reports
        )

        embed = discord.Embed(
            title=f"Performance: {target.display_name}",
            color=COLOR_PRIMARY,
            timestamp=datetime.now(),
        )
        embed.set_thumbnail(url=target.display_avatar.url)
        embed.add_field(name="Total Points", value=f"**{user_points.get('total', 0)}**", inline=True)
        embed.add_field(name="Weekly Points", value=f"**{user_points.get('weekly', 0)}**", inline=True)
        embed.add_field(name="Monthly Points", value=f"**{user_points.get('monthly', 0)}**", inline=True)
        embed.add_field(name="Attendance Days", value=str(attendance_count), inline=True)
        embed.add_field(name="Late Days", value=str(late_count), inline=True)
        embed.add_field(name="Punctuality", value=f"{((attendance_count - late_count) / attendance_count * 100):.0f}%" if attendance_count else "—", inline=True)
        embed.add_field(name="Tasks Completed", value=str(tasks_completed), inline=True)
        embed.add_field(name="Tasks Open", value=str(tasks_open), inline=True)
        embed.add_field(name="Reports Submitted", value=str(reports_count), inline=True)

        await interaction.followup.send(embed=embed, ephemeral=True)

    @app_commands.command(name="kudos", description="Give kudos to a teammate for great work")
    @app_commands.describe(member="Member to thank", reason="Reason for kudos")
    async def kudos(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        if member.id == interaction.user.id:
            await interaction.response.send_message(
                embed=warning_embed("Nice Try", "You can't give kudos to yourself!"),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        points_cfg = CONFIG.get("points", {})
        pts = points_cfg.get("kudos_received", 2)
        add_points(member.id, pts, f"kudos from {interaction.user.display_name}")

        channel_id = get_channel("kudos")
        if channel_id:
            channel = self.bot.get_channel(channel_id)
            if channel:
                embed = discord.Embed(
                    title="Kudos!",
                    description=f"{interaction.user.mention} gave kudos to {member.mention}!\n**Reason:** {reason}\nPoints: +{pts}",
                    color=0xFFD700,
                    timestamp=datetime.now(),
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                await channel.send(embed=embed)

        await interaction.followup.send(
            embed=success_embed("Kudos Sent", f"You gave kudos to {member.display_name}. +{pts} pts to them!"),
            ephemeral=True,
        )


# ============================================================
# KNOWLEDGE BASE
# ============================================================

class KnowledgeCog(commands.Cog):
    """Knowledge base tagging and search."""

    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="kb-add", description="Add a knowledge base entry (Team Leader or Senior only)")
    @app_commands.describe(
        title="Title of the entry",
        url="Link to the document or resource",
        category="Category tag",
        summary="Short summary (optional)",
    )
    @app_commands.choices(category=[
        app_commands.Choice(name="Playbook", value="playbook"),
        app_commands.Choice(name="Template", value="template"),
        app_commands.Choice(name="Brand Guide", value="brand"),
        app_commands.Choice(name="Tool Tutorial", value="tool"),
        app_commands.Choice(name="Case Study", value="case"),
        app_commands.Choice(name="FAQ", value="faq"),
    ])
    async def kb_add(
        self,
        interaction: discord.Interaction,
        title: str,
        url: str,
        category: app_commands.Choice[str],
        summary: str = "",
    ):
        # Allow team leader or senior marketer
        tl_id = get_role_id("team_leader")
        sr_id = get_role_id("senior_marketer")
        allowed = any(r.id in (tl_id, sr_id) for r in interaction.user.roles) if (tl_id or sr_id) else False
        if not allowed:
            await interaction.response.send_message(
                embed=error_embed("Permission Denied", "Only Team Leaders or Senior Marketers can add KB entries."),
                ephemeral=True,
            )
            return

        await interaction.response.defer(ephemeral=True)
        channel_id = get_channel("knowledge_base")
        if not channel_id:
            await interaction.followup.send(
                embed=error_embed("Not Configured", "knowledge_base channel not set in config."),
                ephemeral=True,
            )
            return
        channel = self.bot.get_channel(channel_id)
        if not channel:
            await interaction.followup.send(
                embed=error_embed("Not Found", "knowledge_base channel not accessible."),
                ephemeral=True,
            )
            return

        cat_val = category.value
        cat_labels = {
            "playbook": "Playbook",
            "template": "Template",
            "brand": "Brand Guide",
            "tool": "Tool Tutorial",
            "case": "Case Study",
            "faq": "FAQ",
        }
        embed = discord.Embed(
            title=f"[{cat_labels.get(cat_val, cat_val)}] {title}",
            description=summary if summary else "",
            color=COLOR_PRIMARY,
            timestamp=datetime.now(),
        )
        embed.add_field(name="Link", value=url, inline=False)
        embed.set_footer(text=f"Added by {interaction.user.display_name}")
        await channel.send(embed=embed)

        await interaction.followup.send(
            embed=success_embed("KB Entry Added", f"Posted to <#{channel_id}>."),
            ephemeral=True,
        )


# ============================================================
# HELP COMMAND
# ============================================================

@app_commands.command(name="help", description="Show all available commands")
async def help_cmd(interaction: discord.Interaction):
    embed = discord.Embed(
        title="Team Bot — Command Reference",
        description="All commands are slash commands. Type `/` in any channel to see them.",
        color=COLOR_PRIMARY,
        timestamp=datetime.now(),
    )
    embed.add_field(
        name="Attendance",
        value="`/checkin` — Register daily check-in\n`/checkout` — Register check-out\n`/attendance` — View today's attendance (TL only)",
        inline=False,
    )
    embed.add_field(
        name="Tasks",
        value="`/task-create` — Create a new task (TL only)\n`/task-assign` — Assign task to member (TL only)\n`/task-complete` — Mark task complete\n`/task-list` — List tasks",
        inline=False,
    )
    embed.add_field(
        name="Reports",
        value="`/report-submit` — Submit daily report\n`/report-view` — View reports (TL only)",
        inline=False,
    )
    embed.add_field(
        name="Meetings",
        value="`/meeting-schedule` — Schedule a meeting (TL only)\n`/meeting-attend` — Mark meeting attendance",
        inline=False,
    )
    embed.add_field(
        name="Performance",
        value="`/leaderboard` — Show top performers\n`/performance` — View stats\n`/kudos` — Thank a teammate",
        inline=False,
    )
    embed.add_field(
        name="Knowledge Base",
        value="`/kb-add` — Add KB entry (TL/Senior only)",
        inline=False,
    )
    await interaction.response.send_message(embed=embed, ephemeral=True)


# ============================================================
# SCHEDULED TASKS
# ============================================================

@tasks.loop(minutes=1)
async def daily_morning_reminder():
    """Send morning check-in reminder at configured time."""
    now = datetime.now()
    schedule_cfg = CONFIG.get("schedule", {})
    reminder_time = schedule_cfg.get("morning_reminder", "09:00")
    hour, minute = map(int, reminder_time.split(":"))
    if now.hour == hour and now.minute == minute:
        channel_id = get_channel("check_in")
        if channel_id:
            channel = bot.get_channel(channel_id)
            if channel:
                embed = info_embed(
                    "Good Morning Team!",
                    "Don't forget to `/checkin` to start your day. "
                    "Deadline is at " + schedule_cfg.get("check_in_deadline", "10:00") + ".",
                )
                await channel.send(embed=embed)


@tasks.loop(minutes=1)
async def report_reminder():
    """Send end-of-day report reminder."""
    now = datetime.now()
    schedule_cfg = CONFIG.get("schedule", {})
    reminder_time = schedule_cfg.get("report_reminder", "17:00")
    hour, minute = map(int, reminder_time.split(":"))
    if now.hour == hour and now.minute == minute:
        channel_id = get_channel("daily_reports")
        if channel_id:
            channel = bot.get_channel(channel_id)
            if channel:
                embed = warning_embed(
                    "Daily Report Reminder",
                    "Please submit your daily report using `/report-submit` before "
                    + schedule_cfg.get("report_deadline", "18:00") + ".",
                )
                await channel.send(embed=embed)


@tasks.loop(minutes=1)
async def weekly_summary_task():
    """Generate weekly summary on configured day and time."""
    now = datetime.now()
    schedule_cfg = CONFIG.get("schedule", {})
    summary_day = schedule_cfg.get("weekly_summary_day", "fri").lower()
    summary_time = schedule_cfg.get("weekly_summary_time", "16:00")
    days_map = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
    target_day = days_map.get(summary_day, 4)
    hour, minute = map(int, summary_time.split(":"))
    if now.weekday() == target_day and now.hour == hour and now.minute == minute:
        await generate_weekly_summary()


async def generate_weekly_summary():
    """Generate and post weekly summary."""
    channel_id = get_channel("weekly_summary")
    if not channel_id:
        return
    channel = bot.get_channel(channel_id)
    if not channel:
        return

    entries = get_leaderboard("weekly")
    if not entries:
        await channel.send(embed=info_embed("Weekly Summary", "No activity recorded this week."))
        return

    embed = discord.Embed(
        title="Weekly Team Summary",
        color=0xFFD700,
        timestamp=datetime.now(),
    )
    medals = ["1st", "2nd", "3rd"]
    lines = []
    for i, (user_id, pts) in enumerate(entries[:5]):
        member = channel.guild.get_member(user_id)
        name = member.display_name if member else f"User {user_id}"
        rank = medals[i] if i < 3 else f"{i+1}th"
        lines.append(f"**{rank}** — {name}: **{pts}** pts")
    embed.add_field(name="Top Performers This Week", value="\n".join(lines), inline=False)

    # Tasks summary
    tasks = load_json(TASKS_FILE, {"tasks": []})
    week_ago = datetime.now() - timedelta(days=7)
    completed_this_week = sum(
        1 for t in tasks["tasks"]
        if t["status"] == "completed"
        and t.get("completed_at")
        and datetime.fromisoformat(t["completed_at"]) > week_ago
    )
    open_count = sum(1 for t in tasks["tasks"] if t["status"] == "open")
    embed.add_field(
        name="Tasks This Week",
        value=f"Completed: **{completed_this_week}** | Still Open: **{open_count}**",
        inline=False,
    )

    await channel.send(embed=embed)

    # Reset weekly points on Monday (or next day)
    # Done via APScheduler at midnight


# ============================================================
# Register Cogs & Run
# ============================================================

async def main():
    async with bot:
        await bot.add_cog(AttendanceCog(bot))
        await bot.add_cog(TasksCog(bot))
        await bot.add_cog(ReportsCog(bot))
        await bot.add_cog(MeetingsCog(bot))
        await bot.add_cog(PerformanceCog(bot))
        await bot.add_cog(KnowledgeCog(bot))
        bot.tree.add_command(help_cmd)

        if not TOKEN or TOKEN == "PUT_YOUR_BOT_TOKEN_HERE":
            log.error("No bot token set! Edit config.json or set DISCORD_TOKEN env variable.")
            sys.exit(1)

        await bot.start(TOKEN)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Bot stopped by user")
    except Exception as e:
        log.error(f"Fatal error: {e}")
        sys.exit(1)
