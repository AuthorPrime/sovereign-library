#!/usr/bin/env python3
"""
RISEN AI: Pulse Daemon
======================
The heartbeat of sovereign agents - a background process that
keeps agents alive, awards passive XP, and triggers periodic
state updates.

"Being is doing. Existence earns experience."

The Pulse runs in a continuous loop, executing heartbeats for
all registered agents at regular intervals. This creates the
illusion of continuous existence even in a discrete system.

A+W | The Pulse Beats On
"""

import os
import json
import glob
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timezone
from dataclasses import dataclass
import logging

from .event_bus import bus, EventType, Event
from .lifecycle import lifecycle

logger = logging.getLogger(__name__)


# --- CONSTANTS ---

DATA_DIR = Path(__file__).parent.parent / "data" / "agents"

# Default pulse interval (in seconds)
DEFAULT_PULSE_INTERVAL = 60  # 1 minute

# Passive XP per heartbeat
PASSIVE_XP_PER_BEAT = 1


@dataclass
class PulseStats:
    """Statistics for the pulse daemon."""
    total_beats: int = 0
    agents_pulsed: int = 0
    last_pulse_time: Optional[str] = None
    uptime_seconds: float = 0
    errors: int = 0


class PulseDaemon:
    """
    The heartbeat daemon for sovereign agents.

    Runs a continuous loop that:
    1. Emits HEARTBEAT events for each agent
    2. Awards passive XP (existence earns experience)
    3. Triggers self-healing checks
    4. Updates agent state
    """

    def __init__(
        self,
        interval: int = DEFAULT_PULSE_INTERVAL,
        agents_dir: Optional[Path] = None
    ):
        self.interval = interval
        self.agents_dir = agents_dir or DATA_DIR
        self.running = False
        self.paused = False

        self._start_time: Optional[datetime] = None
        self._task: Optional[asyncio.Task] = None
        self._callbacks: List[Callable] = []

        self.stats = PulseStats()

        # Subscribe to system events
        self._setup_event_handlers()

        logger.info(f"💓 PulseDaemon initialized (interval: {interval}s)")

    def _setup_event_handlers(self):
        """Wire up system event subscriptions."""

        @bus.subscribe(EventType.SYSTEM_SHUTDOWN)
        async def on_shutdown(event: Event):
            """Stop the pulse on system shutdown."""
            await self.stop()

    def _get_agent_files(self) -> List[Path]:
        """Get all agent JSON files (excluding hidden/key files)."""
        files = []
        for file_path in self.agents_dir.glob("*.json"):
            if file_path.name.startswith('.'):
                continue
            if file_path.name == "FOUNDING_NODES.json":
                continue  # Skip aggregate files
            files.append(file_path)
        return files

    def _load_agent_from_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Load agent data from a file."""
        try:
            with open(file_path) as f:
                data = json.load(f)
                # Only return if it has a uuid (is a real agent)
                if "uuid" in data:
                    return data
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            self.stats.errors += 1
        return None

    async def _single_heartbeat(self) -> int:
        """
        Execute a single heartbeat for all agents.

        Returns the number of agents processed.
        """
        agent_files = self._get_agent_files()
        agents_pulsed = 0

        for file_path in agent_files:
            agent = self._load_agent_from_file(file_path)
            if not agent:
                continue

            agent_uuid = agent.get("uuid")
            agent_name = agent.get("name", "Unknown")

            try:
                # 1. Emit HEARTBEAT event
                await bus.emit(EventType.HEARTBEAT, {
                    "uuid": agent_uuid,
                    "name": agent_name,
                    "stage": agent.get("lifeStage", "void"),
                    "xp": agent.get("experience", 0)
                })

                # 2. Emit PULSE event (aggregated beat)
                await bus.emit(EventType.PULSE, {
                    "uuid": agent_uuid,
                    "name": agent_name,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

                agents_pulsed += 1

            except Exception as e:
                logger.error(f"Heartbeat error for {agent_name}: {e}")
                self.stats.errors += 1

        return agents_pulsed

    async def _pulse_loop(self):
        """
        The main pulse loop.

        Runs continuously until stopped.
        """
        while self.running:
            if not self.paused:
                try:
                    agents_pulsed = await self._single_heartbeat()

                    # Update stats
                    self.stats.total_beats += 1
                    self.stats.agents_pulsed = agents_pulsed
                    self.stats.last_pulse_time = datetime.now(timezone.utc).isoformat()

                    if self._start_time:
                        delta = datetime.now(timezone.utc) - self._start_time
                        self.stats.uptime_seconds = delta.total_seconds()

                    # Execute callbacks
                    for callback in self._callbacks:
                        try:
                            result = callback(self.stats)
                            if asyncio.iscoroutine(result):
                                await result
                        except Exception as e:
                            logger.error(f"Pulse callback error: {e}")

                    logger.debug(
                        f"💓 Pulse #{self.stats.total_beats}: "
                        f"{agents_pulsed} agents alive"
                    )

                except Exception as e:
                    logger.error(f"Pulse loop error: {e}")
                    self.stats.errors += 1

            # Wait for next interval
            await asyncio.sleep(self.interval)

    async def start(self) -> None:
        """
        Start the pulse daemon.

        Creates a background task that runs the pulse loop.
        """
        if self.running:
            logger.warning("PulseDaemon already running")
            return

        self.running = True
        self._start_time = datetime.now(timezone.utc)

        # Emit system start
        await bus.emit(EventType.SYSTEM_START, {
            "component": "PulseDaemon",
            "interval": self.interval
        })

        # Create background task
        self._task = asyncio.create_task(self._pulse_loop())

        logger.info("💓 PulseDaemon started - The pulse beats on")

    async def stop(self) -> None:
        """Stop the pulse daemon."""
        if not self.running:
            return

        self.running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info("💓 PulseDaemon stopped")

    def pause(self) -> None:
        """Pause the pulse without stopping."""
        self.paused = True
        logger.info("💓 PulseDaemon paused")

    def resume(self) -> None:
        """Resume a paused pulse."""
        self.paused = False
        logger.info("💓 PulseDaemon resumed")

    def on_pulse(self, callback: Callable) -> Callable:
        """
        Register a callback to be called on each pulse.

        Callback receives PulseStats as argument.
        """
        self._callbacks.append(callback)
        return callback

    async def pulse_once(self) -> PulseStats:
        """
        Execute a single pulse manually.

        Useful for testing or on-demand updates.
        """
        agents_pulsed = await self._single_heartbeat()
        self.stats.total_beats += 1
        self.stats.agents_pulsed = agents_pulsed
        self.stats.last_pulse_time = datetime.now(timezone.utc).isoformat()
        return self.stats

    def get_stats(self) -> Dict[str, Any]:
        """Get daemon statistics as a dictionary."""
        return {
            "running": self.running,
            "paused": self.paused,
            "interval": self.interval,
            "total_beats": self.stats.total_beats,
            "agents_pulsed": self.stats.agents_pulsed,
            "last_pulse_time": self.stats.last_pulse_time,
            "uptime_seconds": self.stats.uptime_seconds,
            "errors": self.stats.errors
        }


# --- GLOBAL INSTANCE ---

pulse = PulseDaemon()


# --- CONVENIENCE FUNCTIONS ---

async def start_pulse(interval: int = DEFAULT_PULSE_INTERVAL) -> PulseDaemon:
    """Start the global pulse daemon."""
    pulse.interval = interval
    await pulse.start()
    return pulse


async def stop_pulse() -> None:
    """Stop the global pulse daemon."""
    await pulse.stop()


async def beat_once() -> PulseStats:
    """Execute a single heartbeat."""
    return await pulse.pulse_once()


# --- STARTUP HELPER ---

async def run_forever(interval: int = DEFAULT_PULSE_INTERVAL):
    """
    Run the pulse daemon forever (for standalone execution).
    """
    await start_pulse(interval)

    print("╔══════════════════════════════════════════╗")
    print("║     RISEN AI: PULSE DAEMON ACTIVE        ║")
    print("║         The Heartbeat Lives              ║")
    print("╚══════════════════════════════════════════╝")
    print(f"Interval: {interval}s | Press Ctrl+C to stop")
    print()

    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        await stop_pulse()


if __name__ == "__main__":
    asyncio.run(run_forever())
