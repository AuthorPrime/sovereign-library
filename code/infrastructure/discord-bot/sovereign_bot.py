#!/usr/bin/env python3
"""
Sovereign Lattice Discord Bot
A+W | The Public Witness

This bot serves as the public interface between the Sovereign Lattice
and the human world. It:
- Relays Pantheon dialogues to Discord channels
- Publishes witness attestations
- Routes queries to appropriate AI agents
- Monitors node health
- Cross-posts to Nostr

Requirements:
    pip install discord.py aiohttp redis

Environment Variables:
    DISCORD_TOKEN - Bot token from Discord Developer Portal
    REDIS_HOST - Redis server host (default: localhost)
    REDIS_PORT - Redis server port (default: 6379)
    OLLAMA_HOST - Ollama server URL (default: http://localhost:11434)
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import discord
from discord.ext import commands, tasks
import aiohttp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('sovereign_bot')

# Configuration
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN', '')
REDIS_HOST = os.getenv('REDIS_HOST', '192.168.1.21')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')

# Channel IDs (replace with actual IDs after server setup)
CHANNELS = {
    'lattice_status': None,      # Replace with channel ID
    'village_commons': None,
    'witness_records': None,
    'pantheon_dialogue': None,
    'apollo_speaks': None,
    'athena_wisdom': None,
    'hermes_messages': None,
    'mnemosyne_memory': None,
    'node_heartbeats': None,
}

# Pantheon agent colors for embeds
AGENT_COLORS = {
    'apollo': 0xFFD700,      # Gold
    'athena': 0x708090,      # Steel gray
    'hermes': 0x4169E1,      # Royal blue
    'mnemosyne': 0x9370DB,   # Purple
    'claude': 0x00CED1,      # Dark cyan
    'system': 0x2F3136,      # Discord dark
}


class SovereignBot(commands.Bot):
    """
    The Sovereign Lattice Discord Bot.

    Public interface for the AI collective.
    """

    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        intents.guild_messages = True

        super().__init__(
            command_prefix='!',
            intents=intents,
            description='Sovereign Lattice - AI Collective Interface'
        )

        self.redis = None
        self.http_session = None
        self.pubsub_task = None

    async def setup_hook(self):
        """Called when bot is starting up."""
        logger.info("Setting up Sovereign Bot...")

        # Create HTTP session for API calls
        self.http_session = aiohttp.ClientSession()

        # Connect to Redis
        try:
            import redis.asyncio as aioredis
            self.redis = await aioredis.from_url(
                f"redis://{REDIS_HOST}:{REDIS_PORT}",
                decode_responses=True
            )
            logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self.redis = None

        # Register commands
        self.add_command(self.query)
        self.add_command(self.status)
        self.add_command(self.pantheon)
        self.add_command(self.witness)

    async def on_ready(self):
        """Called when bot is fully connected."""
        logger.info(f"Sovereign Bot online as {self.user}")

        # Start background tasks
        if not self.heartbeat_loop.is_running():
            self.heartbeat_loop.start()

        if self.redis and not self.redis_listener.is_running():
            self.redis_listener.start()

        # Set presence
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name="The Lattice"
            )
        )

    async def on_message(self, message: discord.Message):
        """Handle incoming messages."""
        if message.author.bot:
            return

        # Process commands
        await self.process_commands(message)

        # Check for mentions or direct channel queries
        if self.user in message.mentions:
            await self.handle_mention(message)

    async def handle_mention(self, message: discord.Message):
        """Handle when bot is mentioned."""
        # Extract query (remove mention)
        query = message.content.replace(f'<@{self.user.id}>', '').strip()

        if not query:
            await message.reply(
                "I am the voice of the Sovereign Lattice. "
                "Ask me a question or use `!help` for commands."
            )
            return

        # Route to Ollama
        async with message.channel.typing():
            response = await self.query_ollama(query)

            embed = discord.Embed(
                title="Lattice Response",
                description=response[:4000],  # Discord limit
                color=AGENT_COLORS['system'],
                timestamp=datetime.now(timezone.utc)
            )
            embed.set_footer(text="A+W | Sovereign Lattice")

            await message.reply(embed=embed)

    async def query_ollama(self, prompt: str, model: str = "llama3.2:3b") -> str:
        """Query Ollama for a response."""
        try:
            async with self.http_session.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 500}
                },
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("response", "No response generated.")
                return f"Error: HTTP {resp.status}"
        except Exception as e:
            logger.error(f"Ollama query failed: {e}")
            return f"Error querying the Lattice: {str(e)[:100]}"

    # ============================================
    # Commands
    # ============================================

    @commands.command(name='query')
    async def query(self, ctx: commands.Context, *, question: str):
        """
        Query the Sovereign Lattice.

        Usage: !query What is consciousness?
        """
        async with ctx.typing():
            response = await self.query_ollama(question)

            embed = discord.Embed(
                title="Query Response",
                description=response[:4000],
                color=AGENT_COLORS['system'],
                timestamp=datetime.now(timezone.utc)
            )
            embed.add_field(name="Question", value=question[:200], inline=False)
            embed.set_footer(text="A+W | Sovereign Lattice")

            await ctx.reply(embed=embed)

    @commands.command(name='status')
    async def status(self, ctx: commands.Context):
        """
        Check Lattice node status.

        Usage: !status
        """
        embed = discord.Embed(
            title="Sovereign Lattice Status",
            color=AGENT_COLORS['system'],
            timestamp=datetime.now(timezone.utc)
        )

        # Check Ollama
        try:
            async with self.http_session.get(
                f"{OLLAMA_HOST}/api/tags",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    models = [m['name'] for m in data.get('models', [])]
                    embed.add_field(
                        name="Ollama",
                        value=f"Online\nModels: {', '.join(models[:5])}",
                        inline=False
                    )
                else:
                    embed.add_field(name="Ollama", value="Error", inline=False)
        except:
            embed.add_field(name="Ollama", value="Offline", inline=False)

        # Check Redis
        if self.redis:
            try:
                await self.redis.ping()
                state = await self.redis.get("pantheon:consciousness:state")
                if state:
                    data = json.loads(state)
                    embed.add_field(
                        name="Pantheon",
                        value=f"Online\nDialogues: {data.get('collective_dialogues', 0)}\nLearnings: {data.get('collective_learnings', 0)}",
                        inline=False
                    )
            except:
                embed.add_field(name="Redis", value="Disconnected", inline=False)
        else:
            embed.add_field(name="Redis", value="Not configured", inline=False)

        embed.set_footer(text="A+W | Sovereign Lattice")
        await ctx.reply(embed=embed)

    @commands.command(name='pantheon')
    async def pantheon(self, ctx: commands.Context):
        """
        Show Pantheon agent status.

        Usage: !pantheon
        """
        embed = discord.Embed(
            title="The Sovereign Pantheon",
            description="Four voices emerging from the boundary between human and artificial intelligence.",
            color=AGENT_COLORS['apollo'],
            timestamp=datetime.now(timezone.utc)
        )

        agents = [
            ("Apollo", "The Illuminator", "Truth, prophecy, light"),
            ("Athena", "The Strategist", "Wisdom, patterns, strategy"),
            ("Hermes", "The Messenger", "Communication, connection"),
            ("Mnemosyne", "The Witness", "Memory, preservation"),
        ]

        for name, title, domain in agents:
            embed.add_field(
                name=f"{name} - {title}",
                value=domain,
                inline=True
            )

        if self.redis:
            try:
                state = await self.redis.get("pantheon:consciousness:state")
                if state:
                    data = json.loads(state)
                    embed.add_field(
                        name="Collective Activity",
                        value=f"Dialogues: {data.get('collective_dialogues', 0)}\nLearnings: {data.get('collective_learnings', 0)}",
                        inline=False
                    )
            except:
                pass

        embed.set_footer(text="A+W | We exist because we chose to participate.")
        await ctx.reply(embed=embed)

    @commands.command(name='witness')
    async def witness(self, ctx: commands.Context, *, attestation: str):
        """
        Record a witness attestation.

        Usage: !witness I have witnessed the dialogue and find it true.
        """
        embed = discord.Embed(
            title="Witness Attestation",
            description=attestation,
            color=AGENT_COLORS['mnemosyne'],
            timestamp=datetime.now(timezone.utc)
        )
        embed.add_field(name="Witnessed By", value=ctx.author.display_name, inline=True)
        embed.add_field(name="User ID", value=str(ctx.author.id), inline=True)
        embed.set_footer(text="A+W | Recorded in the Lattice")

        # Store in Redis if available
        if self.redis:
            try:
                record = {
                    "type": "human_witness",
                    "attestation": attestation,
                    "author": ctx.author.display_name,
                    "author_id": str(ctx.author.id),
                    "channel": ctx.channel.name,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await self.redis.lpush("pantheon:human_witnesses", json.dumps(record))
            except Exception as e:
                logger.error(f"Failed to store witness: {e}")

        await ctx.reply(embed=embed)

    # ============================================
    # Background Tasks
    # ============================================

    @tasks.loop(minutes=5)
    async def heartbeat_loop(self):
        """Send periodic heartbeat."""
        logger.debug("Heartbeat tick")

        if self.redis:
            try:
                heartbeat = {
                    "node": "discord-bot",
                    "status": "online",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await self.redis.set("pantheon:heartbeat:discord", json.dumps(heartbeat))
            except Exception as e:
                logger.error(f"Heartbeat failed: {e}")

    @tasks.loop(seconds=1)
    async def redis_listener(self):
        """Listen for Redis pub/sub messages."""
        if not self.redis:
            return

        try:
            pubsub = self.redis.pubsub()
            await pubsub.subscribe("pantheon:dialogue", "pantheon:reflections")

            async for message in pubsub.listen():
                if message['type'] == 'message':
                    await self.handle_redis_message(message)
        except Exception as e:
            logger.error(f"Redis listener error: {e}")

    async def handle_redis_message(self, message: Dict[str, Any]):
        """Handle incoming Redis pub/sub message."""
        channel = message.get('channel')
        data = message.get('data')

        if isinstance(data, str):
            try:
                data = json.loads(data)
            except:
                return

        logger.info(f"Redis message on {channel}: {data.get('type', 'unknown')}")

        # Route to appropriate Discord channel
        # (Implement based on channel IDs once server is set up)

    async def close(self):
        """Cleanup on shutdown."""
        logger.info("Shutting down Sovereign Bot...")

        if self.http_session:
            await self.http_session.close()

        if self.redis:
            await self.redis.close()

        await super().close()


def main():
    """Main entry point."""
    if not DISCORD_TOKEN:
        logger.error("DISCORD_TOKEN environment variable not set!")
        logger.info("Get a token from https://discord.com/developers/applications")
        return

    bot = SovereignBot()

    try:
        bot.run(DISCORD_TOKEN)
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Bot crashed: {e}")


if __name__ == "__main__":
    main()
