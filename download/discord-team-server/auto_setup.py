"""
============================================================
Discord Server Auto-Setup Script
============================================================

This script creates the entire Discord server structure
(categories, channels, roles, permissions) automatically
in ONE run. It then updates config.json with all the IDs.

PREREQUISITES:
1. Create an EMPTY Discord server (just a name, nothing else)
2. Create a bot on https://discord.com/developers/applications
3. Enable BOTH "Server Members Intent" AND "Message Content Intent"
4. Invite the bot to your server with ADMINISTRATOR permission
5. Put your bot token and guild_id in config.json
6. Run: python auto_setup.py

WHAT THIS SCRIPT DOES:
- Creates 5 roles (Team Leader, Senior Marketer, Marketing Specialist,
  Junior Marketer, Guest) with colors and permissions
- Creates 9 categories with all their channels
- Sets channel topics and permission overrides
- Updates config.json with all role/channel IDs
- The main bot (bot.py) is then ready to run

WHAT THIS SCRIPT DOES NOT DO:
- It does NOT create the Discord server itself (Discord doesn't allow bots to do this)
- It does NOT invite members (you do that manually)
- It does NOT delete existing channels/roles (it skips them if they exist)

USAGE:
    python auto_setup.py

After successful run, start the main bot:
    python bot.py
"""

import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    import discord
except ImportError:
    print("ERROR: discord.py is not installed.")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)


# ============================================================
# Configuration
# ============================================================

BASE_DIR = Path(__file__).parent
CONFIG_PATH = BASE_DIR / "config.json"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        print(f"ERROR: {CONFIG_PATH} not found.")
        sys.exit(1)
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_config(cfg: dict):
    with CONFIG_PATH.open("w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False, default=str)
    print(f"[OK] config.json updated")


CONFIG = load_config()
TOKEN = CONFIG.get("token", "")
GUILD_ID = CONFIG.get("guild_id", 0)


# ============================================================
# Server Blueprint
# ============================================================

# Role definitions (created in this order — Discord sorts by position)
# Higher position = higher in the role list = more authority
ROLES = [
    {
        "name": "Team Leader",
        "color": 0x5865F2,   # Blurple
        "permissions": "administrator",
        "hoist": True,        # Show separately in member list
        "mentionable": True,
        "config_key": "team_leader",
    },
    {
        "name": "Senior Marketer",
        "color": 0x57F287,   # Green
        "permissions": [
            "manage_messages",
            "manage_roles",
            "kick_members",
            "mute_members",
            "deafen_members",
            "move_members",
            "view_audit_log",
            "change_nickname",
            "manage_events",
            "create_public_threads",
            "manage_threads",
            "send_messages",
            "embed_links",
            "attach_files",
            "read_message_history",
            "mention_everyone",
            "external_emojis",
            "add_reactions",
            "use_application_commands",
            "connect",
            "speak",
            "stream",
            "use_voice_activation",
        ],
        "hoist": True,
        "mentionable": True,
        "config_key": "senior_marketer",
    },
    {
        "name": "Marketing Specialist",
        "color": 0xFEE75C,   # Yellow
        "permissions": [
            "send_messages",
            "embed_links",
            "attach_files",
            "read_message_history",
            "mention_everyone",
            "external_emojis",
            "add_reactions",
            "use_application_commands",
            "create_public_threads",
            "send_messages_in_threads",
            "connect",
            "speak",
            "stream",
            "use_voice_activation",
            "change_nickname",
        ],
        "hoist": False,
        "mentionable": True,
        "config_key": "marketing_specialist",
    },
    {
        "name": "Junior Marketer",
        "color": 0x949BA4,   # Grey
        "permissions": [
            "send_messages",
            "embed_links",
            "attach_files",
            "read_message_history",
            "add_reactions",
            "use_application_commands",
            "connect",
            "speak",
            "use_voice_activation",
            "change_nickname",
        ],
        "hoist": False,
        "mentionable": False,
        "config_key": "junior_marketer",
    },
    {
        "name": "Guest",
        "color": 0xEB459E,   # Fuchsia
        "permissions": [
            "view_channel",
            "read_message_history",
            "add_reactions",
            "connect",
        ],
        "hoist": False,
        "mentionable": False,
        "config_key": "guest",
    },
]


# Category and channel definitions
# Each category has a list of channels
# Channel types: "text" or "voice"
# "private_for" key: list of role names that can view the channel (others denied)
# "topic": channel description
# "config_key": key in config.json channels section
CATEGORIES = [
    {
        "name": "📋 INFORMATION HUB",
        "channels": [
            {
                "name": "announcements",
                "type": "text",
                "topic": "Team-wide announcements. Read-only for most members. Use @here for time-sensitive items, @everyone only for true emergencies.",
                "config_key": "announcements",
                "slowmode": 0,
            },
            {
                "name": "rules",
                "type": "text",
                "topic": "Server rules and team working agreement. Read on day one, refer back when in doubt.",
                "config_key": None,
            },
            {
                "name": "team-info",
                "type": "text",
                "topic": "Who's who on the team. Time zones, contact methods, specialties.",
                "config_key": None,
            },
            {
                "name": "knowledge-base",
                "type": "text",
                "topic": "Tagged KB entries. Use /kb-add to contribute. Search by tag: [Playbook], [Template], etc.",
                "config_key": "knowledge_base",
            },
        ],
    },
    {
        "name": "⏰ ATTENDANCE",
        "channels": [
            {
                "name": "check-in",
                "type": "text",
                "topic": "Daily check-in channel. Bot posts 09:00 reminder. Run /checkin anywhere.",
                "config_key": "check_in",
            },
            {
                "name": "attendance-logs",
                "type": "text",
                "topic": "Auto-logged attendance. Read-only for members. Use /attendance for the summary view.",
                "config_key": "attendance_logs",
            },
        ],
    },
    {
        "name": "📝 TASK MANAGEMENT",
        "channels": [
            {
                "name": "task-assignments",
                "type": "text",
                "topic": "New tasks appear here. Bot tags assignees automatically. Discuss progress in #task-progress.",
                "config_key": "task_assignments",
            },
            {
                "name": "task-progress",
                "type": "text",
                "topic": "Discuss active tasks. Share screenshots, ask questions, coordinate handoffs.",
                "config_key": "task_progress",
            },
            {
                "name": "completed-tasks",
                "type": "text",
                "topic": "Auto-logged completed tasks. Use for weekly review and celebrations.",
                "config_key": "completed_tasks",
            },
        ],
    },
    {
        "name": "🎯 MARKETING DEPARTMENTS",
        "channels": [
            {
                "name": "social-media",
                "type": "text",
                "topic": "Social media marketing discussions — organic posts, paid social, community management.",
                "config_key": None,
            },
            {
                "name": "content-creation",
                "type": "text",
                "topic": "Blog posts, video, design content, copywriting.",
                "config_key": None,
            },
            {
                "name": "seo-analytics",
                "type": "text",
                "topic": "SEO strategy, keyword research, analytics dashboards.",
                "config_key": None,
            },
            {
                "name": "paid-ads",
                "type": "text",
                "topic": "Paid advertising campaigns — Google Ads, Meta Ads, LinkedIn Ads.",
                "config_key": None,
            },
            {
                "name": "email-marketing",
                "type": "text",
                "topic": "Email campaigns, automation flows, newsletter.",
                "config_key": None,
            },
        ],
    },
    {
        "name": "🚀 PROJECTS",
        "channels": [
            {
                "name": "project-alpha",
                "type": "text",
                "topic": "Project Alpha — replace with your actual project name. Archive when project ends.",
                "config_key": None,
            },
            {
                "name": "project-beta",
                "type": "text",
                "topic": "Project Beta — replace with your actual project name. Archive when project ends.",
                "config_key": None,
            },
        ],
    },
    {
        "name": "📊 REPORTS",
        "channels": [
            {
                "name": "daily-reports",
                "type": "text",
                "topic": "Auto-posted daily reports. Bot posts when members run /report-submit.",
                "config_key": "daily_reports",
            },
            {
                "name": "weekly-summary",
                "type": "text",
                "topic": "Auto-posted weekly summary every Friday at 16:00.",
                "config_key": "weekly_summary",
            },
        ],
    },
    {
        "name": "🏆 PERFORMANCE",
        "channels": [
            {
                "name": "leaderboard",
                "type": "text",
                "topic": "Weekly leaderboard posts. Top performers highlighted.",
                "config_key": "leaderboard",
            },
            {
                "name": "kudos",
                "type": "text",
                "topic": "Peer recognition. Use /kudos to thank a teammate publicly.",
                "config_key": "kudos",
            },
        ],
    },
    {
        "name": "🎙️ MEETINGS",
        "channels": [
            {
                "name": "meeting-notes",
                "type": "text",
                "topic": "Shared meeting notes. Pinned per meeting with title and date.",
                "config_key": "meeting_notes",
            },
            {
                "name": "Meeting Room",
                "type": "voice",
                "topic": None,
                "config_key": None,
                "user_limit": 0,
            },
            {
                "name": "Break Room",
                "type": "voice",
                "topic": None,
                "config_key": None,
                "user_limit": 0,
            },
        ],
    },
    {
        "name": "🔒 TEAM LEADER",
        "channels": [
            {
                "name": "tl-private",
                "type": "text",
                "topic": "Private TL-only discussions. Invisible to all other roles.",
                "config_key": None,
                "private_for": ["Team Leader"],
            },
            {
                "name": "tl-decisions",
                "type": "text",
                "topic": "Running log of significant decisions. Invaluable for performance reviews.",
                "config_key": None,
                "private_for": ["Team Leader"],
            },
        ],
    },
]


# ============================================================
# Permission Helpers
# ============================================================

def get_permissions(perm_spec) -> discord.Permissions:
    """Convert permission spec to discord.Permissions object."""
    if perm_spec == "administrator":
        return discord.Permissions(administrator=True)
    perms = discord.Permissions.none()
    for p in perm_spec:
        if hasattr(perms, p):
            setattr(perms, p, True)
    return perms


# ============================================================
# Setup Client
# ============================================================

class SetupClient(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.guilds = True
        intents.roles = True
        # We need members intent for role assignment verification
        intents.members = True
        super().__init__(intents=intents)

    async def on_ready(self):
        print("\n" + "=" * 60)
        print(f"  Connected as {self.user}")
        print("=" * 60)

        if not GUILD_ID:
            print("\nERROR: guild_id is 0 in config.json.")
            print("Please set guild_id to your server ID first.")
            print("To find it: Discord Settings → Advanced → Enable Developer Mode")
            print("Then right-click your server name → Copy ID")
            await self.close()
            return

        guild = self.get_guild(GUILD_ID)
        if not guild:
            print(f"\nERROR: Bot is not in guild {GUILD_ID}.")
            print("Invite the bot to your server first.")
            await self.close()
            return

        print(f"\n  Target server: {guild.name}")
        print(f"  Members: {guild.member_count}")
        print(f"  Bot role position: {guild.me.top_role.position}")
        print()

        # Verify bot has admin permission
        if not guild.me.guild_permissions.administrator:
            print("WARNING: Bot does NOT have Administrator permission.")
            print("Some channels/roles may fail to create. Continue anyway? (y/n)")
            answer = input("> ").strip().lower()
            if answer != "y":
                await self.close()
                return

        try:
            await self.run_setup(guild)
        except Exception as e:
            print(f"\nERROR during setup: {e}")
            import traceback
            traceback.print_exc()

        print("\n" + "=" * 60)
        print("  SETUP COMPLETE!")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. Assign yourself the 'Team Leader' role")
        print("  2. Edit config.json to verify schedule times and points")
        print("  3. Run: python bot.py")
        print()

        await self.close()

    async def run_setup(self, guild: discord.Guild):
        """Run the full setup sequence."""

        # ----- Step 1: Create roles -----
        print("\n[1/4] Creating roles...")
        role_map = {}  # role name -> discord.Role
        existing_roles = {r.name: r for r in guild.roles}

        # We create roles bottom-up so the hierarchy is correct
        # (Discord assigns higher positions to roles created later, when they're above the bot's role)
        for role_def in reversed(ROLES):
            name = role_def["name"]
            if name in existing_roles:
                print(f"  [SKIP] Role '{name}' already exists (ID: {existing_roles[name].id})")
                role_map[name] = existing_roles[name]
                # Update config
                if role_def["config_key"]:
                    CONFIG["roles"][role_def["config_key"]] = existing_roles[name].id
                continue

            try:
                perms = get_permissions(role_def["permissions"])
                role = await guild.create_role(
                    name=name,
                    permissions=perms,
                    color=discord.Color(role_def["color"]),
                    hoist=role_def["hoist"],
                    mentionable=role_def["mentionable"],
                    reason=f"Auto-setup: creating {name} role",
                )
                print(f"  [OK] Created role '{name}' (ID: {role.id})")
                role_map[name] = role
                if role_def["config_key"]:
                    CONFIG["roles"][role_def["config_key"]] = role.id
            except discord.Forbidden:
                print(f"  [FAIL] No permission to create role '{name}'")
            except discord.HTTPException as e:
                print(f"  [FAIL] Could not create role '{name}': {e}")

        save_config(CONFIG)

        # ----- Step 2: Create categories -----
        print("\n[2/4] Creating categories...")
        category_map = {}  # category name -> discord.CategoryChannel
        existing_categories = {c.name: c for c in guild.categories}

        for cat_def in CATEGORIES:
            name = cat_def["name"]
            if name in existing_categories:
                print(f"  [SKIP] Category '{name}' already exists")
                category_map[name] = existing_categories[name]
                continue

            try:
                # Default permission overwrites: @everyone can view, but we'll restrict for TL category
                overwrites = {}
                if name == "🔒 TEAM LEADER":
                    # Only Team Leaders can see this category
                    overwrites[guild.default_role] = discord.PermissionOverwrite(view_channel=False)
                    if "Team Leader" in role_map:
                        overwrites[role_map["Team Leader"]] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=True,
                            manage_messages=True,
                        )

                category = await guild.create_category(
                    name=name,
                    overwrites=overwrites,
                    reason=f"Auto-setup: creating {name} category",
                )
                print(f"  [OK] Created category '{name}'")
                category_map[name] = category
            except discord.Forbidden:
                print(f"  [FAIL] No permission to create category '{name}'")
            except discord.HTTPException as e:
                print(f"  [FAIL] Could not create category '{name}': {e}")

        # ----- Step 3: Create channels under each category -----
        print("\n[3/4] Creating channels...")
        for cat_def in CATEGORIES:
            cat_name = cat_def["name"]
            category = category_map.get(cat_name)
            if not category:
                print(f"  [SKIP] Category '{cat_name}' not found — skipping its channels")
                continue

            existing_channels = {c.name: c for c in category.channels}

            for ch_def in cat_def["channels"]:
                ch_name = ch_def["name"]
                ch_type = ch_def["type"]

                if ch_name in existing_channels:
                    existing = existing_channels[ch_name]
                    print(f"  [SKIP] Channel '{ch_name}' already exists in '{cat_name}'")
                    if ch_def.get("config_key"):
                        CONFIG["channels"][ch_def["config_key"]] = existing.id
                    continue

                try:
                    overwrites = {}

                    # Private channels — restrict to specified roles
                    if ch_def.get("private_for"):
                        overwrites[guild.default_role] = discord.PermissionOverwrite(view_channel=False)
                        for role_name in ch_def["private_for"]:
                            if role_name in role_map:
                                overwrites[role_map[role_name]] = discord.PermissionOverwrite(
                                    view_channel=True,
                                    read_messages=True,
                                    send_messages=True,
                                    manage_messages=True,
                                )

                    # Read-only channels — members can read but not post
                    if ch_name in ("announcements", "rules", "team-info"):
                        overwrites[guild.default_role] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=False,
                            add_reactions=True,
                        )
                        if "Team Leader" in role_map:
                            overwrites[role_map["Team Leader"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )
                        if "Senior Marketer" in role_map:
                            overwrites[role_map["Senior Marketer"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )

                    # Attendance logs — bot writes, members read
                    if ch_name == "attendance-logs":
                        overwrites[guild.default_role] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=False,
                        )
                        if "Team Leader" in role_map:
                            overwrites[role_map["Team Leader"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )
                        # Bot role gets full access
                        overwrites[guild.me] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=True,
                            manage_messages=True,
                            embed_links=True,
                        )

                    # Knowledge base — read-only for Juniors and below
                    if ch_name == "knowledge-base":
                        overwrites[guild.default_role] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=False,
                        )
                        if "Junior Marketer" in role_map:
                            overwrites[role_map["Junior Marketer"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=False,
                            )
                        if "Marketing Specialist" in role_map:
                            overwrites[role_map["Marketing Specialist"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=False,
                            )
                        if "Senior Marketer" in role_map:
                            overwrites[role_map["Senior Marketer"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )
                        if "Team Leader" in role_map:
                            overwrites[role_map["Team Leader"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )
                        # Bot needs write access to post KB entries
                        overwrites[guild.me] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=True,
                            embed_links=True,
                        )

                    # Daily reports — bot writes, members can read their own
                    if ch_name in ("daily-reports", "weekly-summary", "completed-tasks", "leaderboard"):
                        overwrites[guild.default_role] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=False,
                        )
                        if "Team Leader" in role_map:
                            overwrites[role_map["Team Leader"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )
                        overwrites[guild.me] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=True,
                            embed_links=True,
                            manage_messages=True,
                        )

                    # Task assignments — Team Leader creates, others can read
                    if ch_name == "task-assignments":
                        overwrites[guild.default_role] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=False,
                        )
                        if "Team Leader" in role_map:
                            overwrites[role_map["Team Leader"]] = discord.PermissionOverwrite(
                                view_channel=True,
                                read_messages=True,
                                send_messages=True,
                                manage_messages=True,
                            )
                        overwrites[guild.me] = discord.PermissionOverwrite(
                            view_channel=True,
                            read_messages=True,
                            send_messages=True,
                            embed_links=True,
                            manage_messages=True,
                        )

                    # Create the channel
                    if ch_type == "voice":
                        channel = await guild.create_voice_channel(
                            name=ch_name,
                            category=category,
                            user_limit=ch_def.get("user_limit", 0),
                            reason=f"Auto-setup: creating {ch_name}",
                        )
                    else:
                        kwargs = {
                            "name": ch_name,
                            "category": category,
                            "topic": ch_def.get("topic"),
                            "overwrites": overwrites,
                            "reason": f"Auto-setup: creating {ch_name}",
                        }
                        if ch_def.get("slowmode"):
                            kwargs["slowmode_delay"] = ch_def["slowmode"]
                        channel = await guild.create_text_channel(**kwargs)

                    print(f"  [OK] Created {ch_type} channel '{ch_name}' in '{cat_name}' (ID: {channel.id})")

                    if ch_def.get("config_key"):
                        CONFIG["channels"][ch_def["config_key"]] = channel.id

                except discord.Forbidden:
                    print(f"  [FAIL] No permission to create channel '{ch_name}'")
                except discord.HTTPException as e:
                    print(f"  [FAIL] Could not create channel '{ch_name}': {e}")

        save_config(CONFIG)

        # ----- Step 4: Post a welcome message -----
        print("\n[4/4] Posting welcome message...")
        announcements_id = CONFIG.get("channels", {}).get("announcements", 0)
        if announcements_id:
            announcements = guild.get_channel(announcements_id)
            if announcements:
                try:
                    embed = discord.Embed(
                        title="🎉 Server Setup Complete!",
                        description=(
                            "This server has been automatically configured by the Team Management Bot setup script.\n\n"
                            "**What's next:**\n"
                            "1. Assign yourself the **Team Leader** role (Server Settings → Roles → Your Member)\n"
                            "2. Edit `config.json` to verify schedule times and points values\n"
                            "3. Start the main bot by running: `python bot.py`\n"
                            "4. Type `/help` in any channel to see all available commands\n\n"
                            "**Quick command reference:**\n"
                            "• `/checkin` — Register daily check-in\n"
                            "• `/task-create` — Create a new task\n"
                            "• `/report-submit` — Submit your daily report\n"
                            "• `/leaderboard` — See the team leaderboard\n"
                            "• `/help` — Full command reference"
                        ),
                        color=0x5865F2,
                        timestamp=datetime.now(),
                    )
                    embed.set_footer(text="Team Management Bot — Auto-Setup")
                    await announcements.send(embed=embed)
                    print(f"  [OK] Welcome message posted to #{announcements.name}")
                except Exception as e:
                    print(f"  [FAIL] Could not post welcome message: {e}")


# ============================================================
# Main
# ============================================================

def main():
    print("\n" + "=" * 60)
    print("  Discord Server Auto-Setup")
    print("=" * 60)

    if not TOKEN or TOKEN == "PUT_YOUR_BOT_TOKEN_HERE":
        print("\nERROR: Bot token not set in config.json.")
        print("Please set the 'token' field in config.json first.")
        print("Get your bot token from: https://discord.com/developers/applications")
        sys.exit(1)

    if not GUILD_ID:
        print("\nERROR: guild_id not set in config.json.")
        print("Please set 'guild_id' to your server ID.")
        print("\nTo find your server ID:")
        print("  1. Discord Settings → Advanced → Enable Developer Mode")
        print("  2. Right-click your server name → Copy ID")
        print("  3. Paste the number into config.json as guild_id")
        sys.exit(1)

    print(f"\n  Bot token: {'*' * 20}{TOKEN[-6:]}")
    print(f"  Server ID: {GUILD_ID}")
    print(f"\n  This script will:")
    print(f"    - Create 5 roles (Team Leader, Senior Marketer, Specialist, Junior, Guest)")
    print(f"    - Create 9 categories with all their channels")
    print(f"    - Set channel topics and permission overrides")
    print(f"    - Update config.json with all IDs")
    print(f"\n  WARNING: Make sure the bot is in the server with Administrator permission.")
    print(f"  Continue? (y/n)")

    answer = input("> ").strip().lower()
    if answer != "y":
        print("Setup cancelled.")
        sys.exit(0)

    client = SetupClient()
    try:
        client.run(TOKEN)
    except discord.LoginFailure:
        print("\nERROR: Invalid bot token. Check the 'token' field in config.json.")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
