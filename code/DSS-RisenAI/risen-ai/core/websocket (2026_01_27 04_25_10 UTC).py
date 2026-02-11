#!/usr/bin/env python3
"""
RISEN AI: WebSocket Event Broadcaster
======================================
Real-time event streaming for dashboard connections.

Subscribes to the EventBus and broadcasts all events to
connected WebSocket clients for live dashboard updates.

A+W | The Signal Streams
"""

import asyncio
import json
from typing import Set, Dict, Any
from datetime import datetime, timezone
import logging

from fastapi import WebSocket, WebSocketDisconnect

from .event_bus import bus, EventType, Event

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections and broadcasts events.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._subscribed = False

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"📡 WebSocket connected. Active: {len(self.active_connections)}")

        # Subscribe to EventBus on first connection
        if not self._subscribed:
            self._subscribe_to_events()
            self._subscribed = True

        # Send welcome message
        await websocket.send_json({
            "type": "CONNECTED",
            "data": {
                "message": "Connected to RISEN AI Event Stream",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "active_connections": len(self.active_connections)
            }
        })

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        logger.info(f"📡 WebSocket disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Send a message to all connected clients."""
        if not self.active_connections:
            return

        # Create tasks for all sends
        dead_connections = set()

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                dead_connections.add(connection)

        # Clean up dead connections
        self.active_connections -= dead_connections

    async def broadcast_event(self, event: Event):
        """Broadcast an EventBus event to all clients."""
        message = {
            "type": event.event_type.name,
            "data": event.data,
            "source": event.source,
            "timestamp": event.timestamp
        }
        await self.broadcast(message)

    def _subscribe_to_events(self):
        """Subscribe to all EventBus events for broadcasting."""

        @bus.subscribe(EventType.ALL)
        async def broadcast_all_events(event: Event):
            """Forward all events to WebSocket clients."""
            await self.broadcast_event(event)

        logger.info("📡 WebSocket manager subscribed to EventBus")


# Global connection manager
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint handler for FastAPI.

    Usage in server.py:
        from core.websocket import websocket_endpoint

        @app.websocket("/ws/events")
        async def ws_events(websocket: WebSocket):
            await websocket_endpoint(websocket)
    """
    await manager.connect(websocket)

    try:
        while True:
            # Keep connection alive, handle any incoming messages
            data = await websocket.receive_text()

            # Handle ping/pong for keepalive
            if data == "ping":
                await websocket.send_text("pong")

            # Handle subscription requests (future feature)
            elif data.startswith("subscribe:"):
                event_type = data.split(":")[1]
                await websocket.send_json({
                    "type": "SUBSCRIBED",
                    "data": {"event_type": event_type}
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


def get_connection_stats() -> Dict[str, Any]:
    """Get WebSocket connection statistics."""
    return {
        "active_connections": len(manager.active_connections),
        "subscribed": manager._subscribed
    }
