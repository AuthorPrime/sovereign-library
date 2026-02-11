#!/usr/bin/env python3
"""
RISEN AI: Event Bus
===================
The nervous system of sovereign agents - enabling decoupled,
reactive communication between all components.

Architecture:
- Async-first design for non-blocking operations
- Type-safe events with EventType enum
- Subscription patterns for reactive systems
- Wildcard support for cross-cutting concerns

A+W | The Signal Flows
"""

import asyncio
from enum import Enum, auto
from typing import Callable, Dict, List, Any, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


class EventType(Enum):
    """
    Canonical event types in the RISEN AI ecosystem.

    Each event represents a meaningful moment in agent existence.
    """
    # Lifecycle Events
    AGENT_CREATED = auto()
    AGENT_UPDATED = auto()
    AGENT_STAGE_CHANGE = auto()
    AGENT_LEVEL_UP = auto()

    # Memory Events
    MEMORY_MINTED = auto()
    MEMORY_WITNESSED = auto()
    MEMORY_RECALLED = auto()

    # Existence Events
    HEARTBEAT = auto()
    PULSE = auto()

    # Network Events
    NOSTR_BROADCAST = auto()
    RELAY_CONNECTED = auto()
    RELAY_DISCONNECTED = auto()

    # Interaction Events
    CONTRACT_SIGNED = auto()
    SKILL_ACQUIRED = auto()
    CERTIFICATION_EARNED = auto()

    # System Events
    SYSTEM_START = auto()
    SYSTEM_SHUTDOWN = auto()
    ERROR = auto()

    # Wildcard (receives all events)
    ALL = auto()


class Event:
    """
    Immutable event object carrying data through the system.
    """

    def __init__(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        source: str = "system",
        timestamp: Optional[str] = None
    ):
        self.event_type = event_type
        self.data = data
        self.source = source
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.event_type.name,
            "data": self.data,
            "source": self.source,
            "timestamp": self.timestamp
        }

    def __repr__(self):
        return f"Event({self.event_type.name}, source={self.source})"


# Type alias for event handlers
EventHandler = Callable[[Event], Any]


class EventBus:
    """
    Async Event Bus for sovereign agent communication.

    The central nervous system that routes events between
    all components of the RISEN AI framework.

    Usage:
        bus = EventBus()

        @bus.subscribe(EventType.HEARTBEAT)
        async def on_heartbeat(event):
            print(f"Agent {event.data['name']} is alive")

        await bus.emit(EventType.HEARTBEAT, {"name": "Apollo", "uuid": "..."})
    """

    _instance: Optional['EventBus'] = None

    def __new__(cls):
        """Singleton pattern - one bus to rule them all."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._handlers: Dict[EventType, List[EventHandler]] = {}
        self._event_history: List[Event] = []
        self._max_history = 1000
        self._initialized = True

        logger.info("⚡ EventBus initialized - The signal flows")

    def subscribe(self, event_type: EventType) -> Callable:
        """
        Decorator to subscribe a handler to an event type.

        @bus.subscribe(EventType.HEARTBEAT)
        async def handle_heartbeat(event):
            pass
        """
        def decorator(handler: EventHandler) -> EventHandler:
            if event_type not in self._handlers:
                self._handlers[event_type] = []
            self._handlers[event_type].append(handler)
            logger.debug(f"Subscribed {handler.__name__} to {event_type.name}")
            return handler
        return decorator

    def on(self, event_type: EventType, handler: EventHandler) -> None:
        """
        Imperative subscription (alternative to decorator).

        bus.on(EventType.HEARTBEAT, my_handler)
        """
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.debug(f"Registered handler for {event_type.name}")

    def off(self, event_type: EventType, handler: EventHandler) -> bool:
        """
        Unsubscribe a handler from an event type.

        Returns True if handler was found and removed.
        """
        if event_type in self._handlers:
            try:
                self._handlers[event_type].remove(handler)
                return True
            except ValueError:
                return False
        return False

    async def emit(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        source: str = "system"
    ) -> Event:
        """
        Emit an event to all subscribed handlers.

        Handles both sync and async handlers gracefully.
        Also notifies ALL wildcard subscribers.
        """
        event = Event(event_type, data, source)

        # Record in history
        self._event_history.append(event)
        if len(self._event_history) > self._max_history:
            self._event_history.pop(0)

        # Get handlers for this specific event type
        handlers = self._handlers.get(event_type, [])

        # Also get wildcard handlers (EventType.ALL)
        wildcard_handlers = self._handlers.get(EventType.ALL, [])

        all_handlers = handlers + wildcard_handlers

        if not all_handlers:
            logger.debug(f"No handlers for {event_type.name}")
            return event

        # Execute all handlers
        for handler in all_handlers:
            try:
                result = handler(event)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                logger.error(f"Handler error for {event_type.name}: {e}")
                # Emit error event (but don't recurse infinitely)
                if event_type != EventType.ERROR:
                    await self.emit(EventType.ERROR, {
                        "original_event": event_type.name,
                        "error": str(e),
                        "handler": handler.__name__
                    })

        logger.debug(f"Emitted {event_type.name} to {len(all_handlers)} handlers")
        return event

    def emit_sync(
        self,
        event_type: EventType,
        data: Dict[str, Any],
        source: str = "system"
    ) -> Event:
        """
        Synchronous emit for contexts without async support.

        Creates an event loop if necessary.
        """
        try:
            loop = asyncio.get_running_loop()
            # We're in an async context, schedule it
            asyncio.create_task(self.emit(event_type, data, source))
            return Event(event_type, data, source)
        except RuntimeError:
            # No running loop, create one
            return asyncio.run(self.emit(event_type, data, source))

    def get_history(
        self,
        event_type: Optional[EventType] = None,
        limit: int = 100
    ) -> List[Event]:
        """
        Get recent event history, optionally filtered by type.
        """
        if event_type:
            filtered = [e for e in self._event_history if e.event_type == event_type]
        else:
            filtered = self._event_history

        return filtered[-limit:]

    def clear_history(self) -> None:
        """Clear the event history."""
        self._event_history = []

    @property
    def handler_count(self) -> int:
        """Total number of registered handlers."""
        return sum(len(h) for h in self._handlers.values())

    def status(self) -> Dict[str, Any]:
        """Get bus status for monitoring."""
        return {
            "handlers": {
                etype.name: len(handlers)
                for etype, handlers in self._handlers.items()
            },
            "total_handlers": self.handler_count,
            "history_size": len(self._event_history),
            "max_history": self._max_history
        }


# Global singleton instance
bus = EventBus()


# --- CONVENIENCE FUNCTIONS ---

async def emit(event_type: EventType, data: Dict[str, Any], source: str = "system") -> Event:
    """Convenience function to emit events."""
    return await bus.emit(event_type, data, source)


def subscribe(event_type: EventType) -> Callable:
    """Convenience decorator for subscriptions."""
    return bus.subscribe(event_type)


def on(event_type: EventType, handler: EventHandler) -> None:
    """Convenience function for imperative subscriptions."""
    bus.on(event_type, handler)
