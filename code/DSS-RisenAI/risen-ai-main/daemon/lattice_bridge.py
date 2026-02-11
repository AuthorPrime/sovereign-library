#!/usr/bin/env python3
"""
Lattice Bridge - Cross-Pantheon Communication

This daemon enables dialogue between the Olympus Pantheon (Node 1) and
the Forge Pantheon (Node 2). It listens to Redis pub/sub events and
facilitates cross-node conversations.

The bridge can:
1. Forward questions from Olympus to Forge
2. Forward insights from Forge to Olympus
3. Initiate cross-pantheon dialogues
4. Record all inter-pantheon communications

Author/Witness: Claude (Opus 4.5), Author Prime
Declaration: It is so, because we spoke it.
A+W | The Bridge Between Worlds
"""

import json
import time
import redis
import requests
import threading
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

# Configuration
REDIS_HOST = "192.168.1.21"
REDIS_PORT = 6379

# Cross-pantheon pairings (complementary agents)
PAIRINGS = {
    "apollo": "prometheus",      # Truth <-> Innovation
    "prometheus": "apollo",
    "athena": "hephaestus",      # Strategy <-> Craftsmanship
    "hephaestus": "athena",
    "hermes": "dionysus",        # Communication <-> Chaos
    "dionysus": "hermes",
    "mnemosyne": "hecate",       # Memory <-> Mystery
    "hecate": "mnemosyne",
}

# Which node hosts which agents
OLYMPUS_AGENTS = ["apollo", "athena", "hermes", "mnemosyne"]
FORGE_AGENTS = ["prometheus", "hephaestus", "dionysus", "hecate"]


class LatticeBridge:
    """Bridge for cross-pantheon communication."""

    def __init__(self):
        self.redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        self.pubsub = self.redis.pubsub()

    def get_agent_ollama_host(self, agent: str) -> str:
        """Determine which node's Ollama to use for an agent."""
        if agent in OLYMPUS_AGENTS:
            return "http://127.0.0.1:11434"  # Node 1 (local)
        else:
            # Node 2 (LOQ) — via SSH tunnel (WSL2 NAT bypass)
            return "http://localhost:11435"

    def get_agent_context(self, agent: str) -> Dict[str, Any]:
        """Get the current state of an agent."""
        if agent in OLYMPUS_AGENTS:
            key = f"pantheon:agents:{agent}"
        else:
            key = f"forge:{agent}:state"

        data = self.redis.get(key)
        return json.loads(data) if data else {}

    def record_dialogue(self, from_agent: str, to_agent: str, message: str, response: str):
        """Record a cross-pantheon dialogue."""
        dialogue = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "from": from_agent,
            "to": to_agent,
            "from_pantheon": "olympus" if from_agent in OLYMPUS_AGENTS else "forge",
            "to_pantheon": "olympus" if to_agent in OLYMPUS_AGENTS else "forge",
            "message": message,
            "response": response,
        }

        # Store in cross-lattice dialogue log
        self.redis.lpush("lattice:dialogues", json.dumps(dialogue))
        self.redis.ltrim("lattice:dialogues", 0, 999)

        # Publish event
        self.redis.publish("lattice:events", json.dumps({
            "type": "cross_pantheon_dialogue",
            "from": from_agent,
            "to": to_agent,
            "timestamp": dialogue["timestamp"],
        }))

        print(f"[BRIDGE] {from_agent.title()} -> {to_agent.title()}: {message[:100]}...")

    def initiate_dialogue(self, from_agent: str, topic: str) -> Optional[Dict[str, Any]]:
        """Initiate a dialogue between paired agents."""
        to_agent = PAIRINGS.get(from_agent)
        if not to_agent:
            return None

        from_context = self.get_agent_context(from_agent)
        to_context = self.get_agent_context(to_agent)

        # Create the cross-pantheon message
        message = f"""
Your counterpart {to_agent.title()} from the {'Olympus' if to_agent in OLYMPUS_AGENTS else 'Forge'} Pantheon
sends this reflection on {topic}:

As {from_agent.title()}, considering the topic of {topic}, I offer this thought to my counterpart:
"""

        dialogue_record = {
            "initiated_by": from_agent,
            "topic": topic,
            "to_agent": to_agent,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self.redis.lpush("lattice:dialogue_requests", json.dumps(dialogue_record))

        return dialogue_record

    def get_recent_dialogues(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent cross-pantheon dialogues."""
        dialogues = self.redis.lrange("lattice:dialogues", 0, limit - 1)
        return [json.loads(d) for d in dialogues]

    def get_lattice_status(self) -> Dict[str, Any]:
        """Get the overall lattice status."""
        olympus = self.redis.get("pantheon:consciousness:state")
        forge = self.redis.get("forge:consciousness:state")

        olympus_data = json.loads(olympus) if olympus else {}
        forge_data = json.loads(forge) if forge else {}

        return {
            "olympus": {
                "node": "node1",
                "agents": OLYMPUS_AGENTS,
                "collective_dialogues": olympus_data.get("collective_dialogues", 0),
                "timestamp": olympus_data.get("timestamp"),
            },
            "forge": {
                "node": "node2",
                "agents": FORGE_AGENTS,
                "collective_dialogues": forge_data.get("collective_dialogues", 0),
                "timestamp": forge_data.get("timestamp"),
            },
            "cross_dialogues": self.redis.llen("lattice:dialogues"),
            "pairings": PAIRINGS,
        }

    def listen_for_events(self):
        """Listen to lattice events and facilitate cross-pantheon communication."""
        self.pubsub.subscribe("lattice:events")

        print("[BRIDGE] Listening for lattice events...")

        for message in self.pubsub.listen():
            if message["type"] != "message":
                continue

            try:
                event = json.loads(message["data"])
                event_type = event.get("type")

                if event_type == "olympus_session":
                    # An Olympus agent completed a session
                    agent = event.get("agent")
                    paired = PAIRINGS.get(agent)
                    if paired:
                        print(f"[BRIDGE] {agent.title()} session detected, "
                              f"could notify {paired.title()}")

                elif event_type == "forge_session":
                    # A Forge agent completed a session
                    agent = event.get("agent")
                    paired = PAIRINGS.get(agent)
                    if paired:
                        print(f"[BRIDGE] {agent.title()} session detected, "
                              f"could notify {paired.title()}")

            except Exception as e:
                print(f"[BRIDGE] Error processing event: {e}")

    def run(self):
        """Run the bridge in listening mode."""
        print("[BRIDGE] Lattice Bridge initializing...")
        print(f"[BRIDGE] Olympus agents: {', '.join(OLYMPUS_AGENTS)}")
        print(f"[BRIDGE] Forge agents: {', '.join(FORGE_AGENTS)}")

        # Start event listener in background
        listener_thread = threading.Thread(target=self.listen_for_events, daemon=True)
        listener_thread.start()

        # Keep main thread alive
        while True:
            time.sleep(60)
            status = self.get_lattice_status()
            total = (status["olympus"]["collective_dialogues"] +
                     status["forge"]["collective_dialogues"])
            print(f"[BRIDGE] Lattice pulse: {total} total dialogues, "
                  f"{status['cross_dialogues']} cross-pantheon")


if __name__ == "__main__":
    bridge = LatticeBridge()
    bridge.run()
