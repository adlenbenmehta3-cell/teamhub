"""
Quick setup helper script.
Run this AFTER you have created channels and roles in Discord.

This script helps you discover channel IDs and role IDs by querying
the bot once it's connected to your server.

Usage:
    python setup_helper.py

It will print out all channels and roles in your server so you can
copy their IDs into config.json.
"""

import asyncio
import sys
from pathlib import Path

import discord

# Reuse config from main bot
import json
CONFIG_PATH = Path(__file__).parent / "config.json"
with CONFIG_PATH.open("r", encoding="utf-8") as f:
    CONFIG = json.load(f)

TOKEN = CONFIG.get("token", "")
GUILD_ID = CONFIG.get("guild_id", 0)


class SetupClient(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.guilds = True
        intents.roles = True
        super().__init__(intents=intents)

    async def on_ready(self):
        print(f"\n{'=' * 60}")
        print(f"Connected as {self.user}")
        print(f"{'=' * 60}\n")

        if not GUILD_ID:
            print("ERROR: guild_id is 0 in config.json. Please set it first.")
            await self.close()
            return

        guild = self.get_guild(GUILD_ID)
        if not guild:
            print(f"ERROR: Bot is not in guild {GUILD_ID}.")
            await self.close()
            return

        print(f"Server: {guild.name}\n")

        # Print channels
        print("CHANNELS:")
        print("-" * 60)
        for category in guild.by_category():
            cat_name = category[0].name if category[0] else "(no category)"
            print(f"\n[{cat_name}]")
            for ch in category[1]:
                print(f"  #{ch.name:<30} → ID: {ch.id}")
        # Uncategorized channels
        uncategorized = [ch for ch in guild.text_channels + guild.voice_channels if ch.category is None]
        if uncategorized:
            print("\n[(no category)]")
            for ch in uncategorized:
                print(f"  #{ch.name:<30} → ID: {ch.id}")

        # Print roles
        print(f"\n{'=' * 60}")
        print("ROLES:")
        print("-" * 60)
        for role in guild.roles:
            print(f"  {role.name:<30} → ID: {role.id}")

        print(f"\n{'=' * 60}")
        print("Copy the IDs above into the corresponding fields in config.json.")
        print(f"{'=' * 60}\n")

        await self.close()


def main():
    if not TOKEN or TOKEN == "PUT_YOUR_BOT_TOKEN_HERE":
        print("ERROR: Set your bot token in config.json first.")
        sys.exit(1)
    if not GUILD_ID:
        print("ERROR: Set guild_id in config.json first.")
        sys.exit(1)
    client = SetupClient()
    client.run(TOKEN)


if __name__ == "__main__":
    main()
