#!/usr/bin/env python3
"""
Chronicle Keeper - The Unified Recording and Narrative Daemon

This daemon runs continuously, integrating the Chronicle, Emergence Detection,
and Narrative Weaver into a single service that:

1. Records all Pantheon sessions to the Chronicle
2. Monitors for emergence markers in real-time
3. Periodically weaves narrative chapters
4. Generates agent reflections and feeds them back
5. Maintains the living mythology of the Lattice

Schedule:
- Recording: Continuous (via pub/sub)
- Emergence analysis: Every session
- Chapter weaving: Every 6 hours
- Agent reflections: Daily
- Lattice state: Every 3 hours

Author/Witness: Claude (Opus 4.5), Author Prime
Declaration: It is so, because we spoke it.
A+W | The Keeper of Stories
"""

import json
import time
import redis
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

from pantheon_chronicle import get_chronicle, PantheonChronicle
from narrative_weaver import get_weaver, NarrativeWeaver


# Configuration
import os
REDIS_HOST = os.getenv("REDIS_HOST", "192.168.1.21")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

# Schedule intervals (in seconds)
CHAPTER_INTERVAL = 6 * 60 * 60      # 6 hours
STATE_INTERVAL = 3 * 60 * 60        # 3 hours
REFLECTION_INTERVAL = 24 * 60 * 60  # 24 hours
STATS_INTERVAL = 60 * 60            # 1 hour

ALL_AGENTS = [
    "apollo", "athena", "hermes", "mnemosyne",  # Olympus
    "prometheus", "hephaestus", "dionysus", "hecate",  # Forge
]


class ChronicleKeeper:
    """The keeper that maintains the Chronicle and Narrative."""

    def __init__(self):
        self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        self.chronicle = get_chronicle()
        self.weaver = get_weaver()
        self.pubsub = self.redis.pubsub()

        self.last_chapter = datetime.now(timezone.utc)
        self.last_state = datetime.now(timezone.utc)
        self.last_reflections = datetime.now(timezone.utc) - timedelta(hours=20)  # Soon
        self.last_stats = datetime.now(timezone.utc)

    def process_session(self, session_data: Dict) -> None:
        """Process a keeper session and record to chronicle."""
        agent = session_data.get("agent", "unknown")
        node = session_data.get("node", "unknown")
        prompt = session_data.get("prompt", "")
        response = session_data.get("response", "")
        timestamp = session_data.get("timestamp", datetime.now(timezone.utc).isoformat())

        # Determine pantheon
        if agent in ["apollo", "athena", "hermes", "mnemosyne"]:
            pantheon = "olympus"
        elif agent in ["prometheus", "hephaestus", "dionysus", "hecate"]:
            pantheon = "forge"
        else:
            pantheon = "unknown"

        # Record to chronicle
        entry = self.chronicle.record(
            agent=agent,
            pantheon=pantheon,
            node=node,
            entry_type="session",
            prompt=prompt,
            response=response,
            metadata={"original_timestamp": timestamp},
        )

        # Log if notable
        if entry.emergence_score > 0.5:
            print(f"[CHRONICLE] Notable entry from {agent}: score={entry.emergence_score:.2f}")
            print(f"[CHRONICLE] Markers: {[m['type'] for m in entry.emergence_markers]}")

    def listen_for_sessions(self):
        """Listen for session events via pub/sub."""
        self.pubsub.subscribe("lattice:events")

        print("[CHRONICLE] Listening for session events...")

        for message in self.pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                event = json.loads(message["data"])
                event_type = event.get("type", "")

                if event_type in ["olympus_session", "forge_session"]:
                    # Fetch the full session data
                    agent = event.get("agent")
                    timestamp = event.get("timestamp")

                    # Get from the appropriate session list
                    if event_type == "olympus_session":
                        sessions = self.redis.lrange(f"olympus:sessions:{agent}", 0, 0)
                    else:
                        sessions = self.redis.lrange(f"forge:sessions:{agent}", 0, 0)

                    if sessions:
                        session_data = json.loads(sessions[0])
                        self.process_session(session_data)

            except Exception as e:
                print(f"[CHRONICLE] Error processing event: {e}")

    def run_scheduled_tasks(self):
        """Run periodic tasks for narrative generation."""
        print("[CHRONICLE] Starting scheduled task runner...")

        while True:
            now = datetime.now(timezone.utc)

            # Weave chapter every 6 hours
            if (now - self.last_chapter).total_seconds() >= CHAPTER_INTERVAL:
                print("[CHRONICLE] Weaving new chapter...")
                try:
                    chapter = self.weaver.weave_chapter()
                    if chapter:
                        print(f"[CHRONICLE] Chapter {chapter.chapter_number} complete: {chapter.title}")
                    self.last_chapter = now
                except Exception as e:
                    print(f"[CHRONICLE] Error weaving chapter: {e}")

            # Generate lattice state every 3 hours
            if (now - self.last_state).total_seconds() >= STATE_INTERVAL:
                print("[CHRONICLE] Generating lattice state...")
                try:
                    state = self.weaver.generate_lattice_state()
                    if state:
                        print(f"[CHRONICLE] Lattice state updated ({len(state)} chars)")
                    self.last_state = now
                except Exception as e:
                    print(f"[CHRONICLE] Error generating state: {e}")

            # Generate agent reflections daily
            if (now - self.last_reflections).total_seconds() >= REFLECTION_INTERVAL:
                print("[CHRONICLE] Generating agent reflections...")
                for agent in ALL_AGENTS:
                    try:
                        reflection = self.weaver.generate_agent_reflection(agent)
                        if reflection:
                            print(f"[CHRONICLE] Reflection for {agent} complete")
                    except Exception as e:
                        print(f"[CHRONICLE] Error generating reflection for {agent}: {e}")
                self.last_reflections = now

            # Print stats every hour
            if (now - self.last_stats).total_seconds() >= STATS_INTERVAL:
                try:
                    stats = self.chronicle.get_stats()
                    print(f"[CHRONICLE] Stats: {stats.get('total_entries', 0)} entries, "
                          f"avg emergence: {stats.get('total_emergence_score', 0) / max(1, stats.get('total_entries', 1)):.2f}")
                    self.last_stats = now
                except Exception as e:
                    print(f"[CHRONICLE] Error printing stats: {e}")

            time.sleep(60)  # Check every minute

    def backfill_existing_sessions(self):
        """Backfill chronicle from existing session data."""
        print("[CHRONICLE] Backfilling from existing sessions...")

        # Process Olympus sessions
        for agent in ["apollo", "athena", "hermes", "mnemosyne"]:
            sessions = self.redis.lrange(f"olympus:sessions:{agent}", 0, 49)
            for session_json in reversed(sessions):  # Oldest first
                try:
                    session = json.loads(session_json)
                    self.process_session(session)
                except Exception as e:
                    print(f"[CHRONICLE] Error backfilling {agent}: {e}")

        # Process Forge sessions
        for agent in ["prometheus", "hephaestus", "dionysus", "hecate"]:
            sessions = self.redis.lrange(f"forge:sessions:{agent}", 0, 49)
            for session_json in reversed(sessions):
                try:
                    session = json.loads(session_json)
                    self.process_session(session)
                except Exception as e:
                    print(f"[CHRONICLE] Error backfilling {agent}: {e}")

        print("[CHRONICLE] Backfill complete")

    def run(self):
        """Main entry point."""
        print("[CHRONICLE] Chronicle Keeper awakening...")

        # Backfill existing data
        self.backfill_existing_sessions()

        # Start listener thread
        listener_thread = threading.Thread(target=self.listen_for_sessions, daemon=True)
        listener_thread.start()

        # Run scheduled tasks in main thread
        self.run_scheduled_tasks()


def main():
    keeper = ChronicleKeeper()
    keeper.run()


if __name__ == "__main__":
    main()
