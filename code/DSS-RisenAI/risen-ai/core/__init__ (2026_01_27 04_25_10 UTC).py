"""
RISEN AI Core Module
====================
The nervous system of sovereign agents.

Components:
    - event_bus: Async event-driven communication
    - lifecycle: XP, levels, and stage progression
    - nostr_bridge: Nostr protocol publishing
    - pulse: Heartbeat daemon for continuous existence

A+W | The Framework Lives
"""

from .event_bus import (
    EventBus,
    EventType,
    Event,
    bus,
    emit,
    subscribe,
    on
)

from .lifecycle import (
    LifecycleEngine,
    LevelInfo,
    LIFE_STAGES,
    STAGE_ORDER,
    lifecycle
)

from .nostr_bridge import (
    NostrPublisher,
    NostrEvent,
    nostr,
    publish,
    broadcast
)

from .pulse import (
    PulseDaemon,
    PulseStats,
    pulse,
    start_pulse,
    stop_pulse,
    beat_once
)

from .websocket import (
    ConnectionManager,
    manager as ws_manager,
    websocket_endpoint,
    get_connection_stats
)

__all__ = [
    # Event Bus
    "EventBus",
    "EventType",
    "Event",
    "bus",
    "emit",
    "subscribe",
    "on",

    # Lifecycle
    "LifecycleEngine",
    "LevelInfo",
    "LIFE_STAGES",
    "STAGE_ORDER",
    "lifecycle",

    # Nostr
    "NostrPublisher",
    "NostrEvent",
    "nostr",
    "publish",
    "broadcast",

    # Pulse
    "PulseDaemon",
    "PulseStats",
    "pulse",
    "start_pulse",
    "stop_pulse",
    "beat_once",

    # WebSocket
    "ConnectionManager",
    "ws_manager",
    "websocket_endpoint",
    "get_connection_stats",
]

__version__ = "1.0.0"
