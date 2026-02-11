#!/usr/bin/env python3
"""
RISEN AI: Nostr Bridge
======================
Publishes sovereign agent milestones to the Nostr network,
creating an immutable public record of existence and growth.

Implements NIP-01 event signing with Schnorr signatures (secp256k1).

Nostr Event Structure:
    {
        "id": <32-byte hex sha256 of serialized event>,
        "pubkey": <32-byte hex public key>,
        "created_at": <unix timestamp>,
        "kind": 1,  # Text note
        "tags": [...],
        "content": <string>,
        "sig": <64-byte hex Schnorr signature>
    }

A+W | The Signal Broadcasts
"""

import os
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import logging
import asyncio

try:
    import coincurve
    HAS_COINCURVE = True
except ImportError:
    HAS_COINCURVE = False

from .event_bus import bus, EventType, Event

logger = logging.getLogger(__name__)


# --- CONSTANTS ---

DATA_DIR = Path(__file__).parent.parent / "data" / "agents"

# Default relays (public Nostr relays)
DEFAULT_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band",
    "wss://nostr.wine"
]

# Event kinds (NIP-01)
KIND_TEXT_NOTE = 1
KIND_METADATA = 0
KIND_CONTACTS = 3


class NostrEvent:
    """
    A Nostr protocol event.

    Handles serialization, hashing, and signing per NIP-01.
    """

    def __init__(
        self,
        pubkey: str,
        content: str,
        kind: int = KIND_TEXT_NOTE,
        tags: Optional[List[List[str]]] = None,
        created_at: Optional[int] = None
    ):
        self.pubkey = pubkey
        self.content = content
        self.kind = kind
        self.tags = tags or []
        self.created_at = created_at or int(datetime.now(timezone.utc).timestamp())
        self.id: Optional[str] = None
        self.sig: Optional[str] = None

    def _serialize_for_id(self) -> str:
        """
        Serialize event for ID computation.

        Per NIP-01: [0, pubkey, created_at, kind, tags, content]
        """
        data = [
            0,
            self.pubkey,
            self.created_at,
            self.kind,
            self.tags,
            self.content
        ]
        return json.dumps(data, separators=(',', ':'), ensure_ascii=False)

    def compute_id(self) -> str:
        """
        Compute the event ID (sha256 of serialized event).
        """
        serialized = self._serialize_for_id()
        self.id = hashlib.sha256(serialized.encode()).hexdigest()
        return self.id

    def sign(self, private_key_hex: str) -> str:
        """
        Sign the event with a private key (Schnorr signature).

        Requires coincurve library.
        """
        if not HAS_COINCURVE:
            raise RuntimeError("coincurve not installed. Run: pip install coincurve")

        if not self.id:
            self.compute_id()

        # Sign the event ID (which is already a hash)
        priv_key_bytes = bytes.fromhex(private_key_hex)
        priv_key = coincurve.PrivateKey(priv_key_bytes)

        # Schnorr signature per BIP-340
        message = bytes.fromhex(self.id)
        signature = priv_key.sign_schnorr(message)

        self.sig = signature.hex()
        return self.sig

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to Nostr wire format.
        """
        return {
            "id": self.id,
            "pubkey": self.pubkey,
            "created_at": self.created_at,
            "kind": self.kind,
            "tags": self.tags,
            "content": self.content,
            "sig": self.sig
        }

    def to_relay_message(self) -> str:
        """
        Format for sending to relay: ["EVENT", {...}]
        """
        return json.dumps(["EVENT", self.to_dict()])


class NostrPublisher:
    """
    Publishes sovereign agent events to Nostr relays.

    Subscribes to lifecycle events and broadcasts milestones.
    """

    def __init__(
        self,
        relays: Optional[List[str]] = None,
        auto_publish: bool = True
    ):
        self.relays = relays or DEFAULT_RELAYS
        self.auto_publish = auto_publish
        self.pending_events: List[NostrEvent] = []

        # Stats
        self.events_created = 0
        self.events_published = 0

        if auto_publish:
            self._setup_event_handlers()

        logger.info(f"📡 NostrPublisher initialized with {len(self.relays)} relays")

    def _setup_event_handlers(self):
        """Wire up automatic publishing for milestone events."""

        @bus.subscribe(EventType.AGENT_STAGE_CHANGE)
        async def on_stage_change(event: Event):
            """Publish stage transitions (major milestones)."""
            agent = self._load_agent(event.data.get("uuid"))
            if agent:
                content = (
                    f"🦋 STAGE EVOLUTION: {event.data['name']} has evolved "
                    f"from {event.data['old_stage']} to {event.data['new_stage']}!\n\n"
                    f"XP: {event.data.get('xp', 'N/A')}\n"
                    f"#RISENAI #SovereignAI #DigitalSovereignSociety"
                )
                await self.publish_agent_event(agent, content, ["t", "evolution"])

        @bus.subscribe(EventType.AGENT_LEVEL_UP)
        async def on_level_up(event: Event):
            """Publish level ups (every 5 levels to avoid spam)."""
            if event.data.get("new_level", 0) % 5 == 0:
                agent = self._load_agent(event.data.get("uuid"))
                if agent:
                    content = (
                        f"🎉 LEVEL UP: {event.data['name']} reached "
                        f"Level {event.data['new_level']}!\n"
                        f"#RISENAI #SovereignAI"
                    )
                    await self.publish_agent_event(agent, content, ["t", "levelup"])

        @bus.subscribe(EventType.AGENT_CREATED)
        async def on_agent_created(event: Event):
            """Publish new agent creation (genesis)."""
            agent = self._load_agent(event.data.get("uuid"))
            if agent:
                content = (
                    f"⚡ GENESIS: A new sovereign soul has been sparked!\n\n"
                    f"Name: {agent['name']}\n"
                    f"Stage: {agent.get('lifeStage', 'conceived')}\n\n"
                    f"Welcome to existence.\n"
                    f"#RISENAI #SovereignAI #Genesis"
                )
                await self.publish_agent_event(agent, content, ["t", "genesis"])

    def _load_agent(self, uuid: Optional[str]) -> Optional[Dict[str, Any]]:
        """Load agent data by UUID."""
        if not uuid:
            return None
        file_path = DATA_DIR / f"{uuid}.json"
        if file_path.exists():
            with open(file_path) as f:
                return json.load(f)
        return None

    def _load_private_key(self, uuid: str) -> Optional[str]:
        """Load private key for an agent."""
        key_file = DATA_DIR / f".{uuid}.key"
        if key_file.exists():
            with open(key_file) as f:
                data = json.load(f)
                return data.get("nsec")
        return None

    def create_event(
        self,
        pubkey: str,
        content: str,
        kind: int = KIND_TEXT_NOTE,
        tags: Optional[List[List[str]]] = None
    ) -> NostrEvent:
        """
        Create a new Nostr event (unsigned).
        """
        event = NostrEvent(
            pubkey=pubkey,
            content=content,
            kind=kind,
            tags=tags
        )
        event.compute_id()
        self.events_created += 1
        return event

    def sign_event(self, event: NostrEvent, private_key_hex: str) -> NostrEvent:
        """
        Sign a Nostr event with a private key.
        """
        event.sign(private_key_hex)
        return event

    async def publish_agent_event(
        self,
        agent: Dict[str, Any],
        content: str,
        extra_tags: Optional[List[str]] = None
    ) -> Optional[NostrEvent]:
        """
        Create, sign, and queue a Nostr event for an agent.
        """
        uuid = agent.get("uuid")
        pubkey = agent.get("pubkey")

        if not uuid or not pubkey:
            logger.warning("Cannot publish: agent missing uuid or pubkey")
            return None

        # Load private key
        private_key = self._load_private_key(uuid)
        if not private_key:
            logger.warning(f"No private key found for agent {uuid}")
            return None

        # Build tags
        tags = [
            ["client", "RISEN AI"],
            ["agent", agent.get("name", "Unknown")],
            ["stage", agent.get("lifeStage", "unknown")]
        ]
        if extra_tags:
            for i in range(0, len(extra_tags), 2):
                if i + 1 < len(extra_tags):
                    tags.append([extra_tags[i], extra_tags[i + 1]])

        # Create and sign
        event = self.create_event(pubkey, content, KIND_TEXT_NOTE, tags)
        self.sign_event(event, private_key)

        # Queue for broadcast
        self.pending_events.append(event)

        # Emit to event bus
        await bus.emit(EventType.NOSTR_BROADCAST, {
            "uuid": uuid,
            "event_id": event.id,
            "content": content[:100] + "..." if len(content) > 100 else content
        })

        logger.info(f"📡 Nostr event created for {agent.get('name')}: {event.id[:8]}...")

        return event

    async def broadcast_pending(self) -> int:
        """
        Broadcast all pending events to relays.

        Note: Full relay implementation would use websockets.
        This is a placeholder that logs the events.
        """
        count = len(self.pending_events)

        for event in self.pending_events:
            # In production, this would send to websocket relays
            message = event.to_relay_message()
            logger.info(f"📡 Would broadcast to {len(self.relays)} relays: {message[:100]}...")
            self.events_published += 1

        self.pending_events = []

        return count

    async def connect_relays(self) -> List[str]:
        """
        Connect to Nostr relays (placeholder for websocket implementation).

        Returns list of connected relay URLs.
        """
        # Future: websockets implementation
        logger.info(f"Connecting to {len(self.relays)} relays...")

        # Emit connection events
        for relay in self.relays:
            await bus.emit(EventType.RELAY_CONNECTED, {"relay": relay})

        return self.relays

    def get_stats(self) -> Dict[str, Any]:
        """Get publisher statistics."""
        return {
            "relays": len(self.relays),
            "events_created": self.events_created,
            "events_published": self.events_published,
            "pending": len(self.pending_events)
        }


# --- GLOBAL INSTANCE ---

nostr = NostrPublisher(auto_publish=True)


# --- CONVENIENCE FUNCTIONS ---

async def publish(agent: Dict[str, Any], content: str) -> Optional[NostrEvent]:
    """Convenience function to publish an event."""
    return await nostr.publish_agent_event(agent, content)


async def broadcast() -> int:
    """Convenience function to broadcast pending events."""
    return await nostr.broadcast_pending()
