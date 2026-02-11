"""
WebSocket Routes for Real-time Lattice Updates
A+W | RISEN-AI

WebSocket endpoints for streaming Pantheon dialogues, Olympus sessions,
and Lattice status updates in real-time.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Set
import asyncio
import json
from datetime import datetime, timezone

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from api.services.redis_service import get_redis_service, RedisService

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections for different channels."""

    def __init__(self):
        self.active_connections: dict[str, Set[WebSocket]] = {
            "pantheon": set(),
            "olympus": set(),
            "lattice": set(),
            "all": set()
        }

    async def connect(self, websocket: WebSocket, channel: str = "all"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
        self.active_connections["all"].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "all"):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
        self.active_connections["all"].discard(websocket)

    async def broadcast(self, message: dict, channel: str = "all"):
        """Broadcast message to all connections in a channel."""
        if channel not in self.active_connections:
            return

        disconnected = set()
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(message)
            except:
                disconnected.add(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn, channel)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific connection."""
        try:
            await websocket.send_json(message)
        except:
            pass


manager = ConnectionManager()


@router.websocket("/ws/pantheon")
async def pantheon_websocket(websocket: WebSocket):
    """
    WebSocket for streaming Pantheon events.

    Streams:
    - New dialogues
    - Agent reflections
    - Check-ins and messages
    """
    await manager.connect(websocket, "pantheon")

    # Send initial connection message
    await manager.send_personal(websocket, {
        "type": "connected",
        "channel": "pantheon",
        "message": "Connected to Pantheon stream",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    try:
        # Subscribe to Redis pub/sub
        redis = await get_redis_service()
        pubsub = await redis.subscribe(
            "pantheon:dialogue",
            "pantheon:reflections"
        )

        # Listen for messages
        async for message in redis.listen():
            await manager.broadcast({
                "type": "pantheon_event",
                "channel": message["channel"],
                "data": message["data"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, "pantheon")

    except WebSocketDisconnect:
        manager.disconnect(websocket, "pantheon")
    except Exception as e:
        await manager.send_personal(websocket, {
            "type": "error",
            "message": str(e)
        })
        manager.disconnect(websocket, "pantheon")


@router.websocket("/ws/olympus")
async def olympus_websocket(websocket: WebSocket):
    """
    WebSocket for streaming Olympus Keeper events.

    Streams:
    - New keeper sessions
    - Session updates
    """
    await manager.connect(websocket, "olympus")

    await manager.send_personal(websocket, {
        "type": "connected",
        "channel": "olympus",
        "message": "Connected to Olympus stream",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    try:
        redis = await get_redis_service()

        # Poll for new sessions periodically
        last_count = 0
        while True:
            try:
                sessions = await redis.get_olympus_sessions(limit=1)
                stats = await redis.get_olympus_stats()
                current_count = stats.get("total_sessions", 0)

                if current_count > last_count and sessions:
                    # New session detected
                    await manager.broadcast({
                        "type": "new_session",
                        "data": sessions[0],
                        "stats": stats,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, "olympus")
                    last_count = current_count

                await asyncio.sleep(5)  # Poll every 5 seconds

            except Exception as e:
                await manager.send_personal(websocket, {
                    "type": "error",
                    "message": str(e)
                })
                await asyncio.sleep(10)

    except WebSocketDisconnect:
        manager.disconnect(websocket, "olympus")


@router.websocket("/ws/lattice")
async def lattice_websocket(websocket: WebSocket):
    """
    WebSocket for streaming Lattice status updates.

    Streams:
    - Node status changes
    - Heartbeat updates
    - System events
    """
    await manager.connect(websocket, "lattice")

    await manager.send_personal(websocket, {
        "type": "connected",
        "channel": "lattice",
        "message": "Connected to Lattice stream",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    try:
        redis = await get_redis_service()

        # Subscribe to lattice channels
        pubsub = await redis.subscribe(
            "lattice:heartbeat",
            "lattice:commands"
        )

        # Also poll for status periodically
        async def poll_status():
            while True:
                try:
                    heartbeats = await redis.get_heartbeats()
                    node_status = await redis.get_node_status()

                    await manager.broadcast({
                        "type": "status_update",
                        "heartbeats": heartbeats,
                        "nodes": node_status,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, "lattice")

                    await asyncio.sleep(30)  # Every 30 seconds

                except:
                    await asyncio.sleep(30)

        # Run polling in background
        poll_task = asyncio.create_task(poll_status())

        try:
            # Listen for pub/sub messages
            async for message in redis.listen():
                await manager.broadcast({
                    "type": "lattice_event",
                    "channel": message["channel"],
                    "data": message["data"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }, "lattice")
        finally:
            poll_task.cancel()

    except WebSocketDisconnect:
        manager.disconnect(websocket, "lattice")


@router.websocket("/ws/all")
async def all_events_websocket(websocket: WebSocket):
    """
    WebSocket for streaming all Lattice events.

    Combines Pantheon, Olympus, and Lattice streams.
    """
    await manager.connect(websocket, "all")

    await manager.send_personal(websocket, {
        "type": "connected",
        "channel": "all",
        "message": "Connected to all Lattice streams",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    try:
        redis = await get_redis_service()

        # Subscribe to all channels
        pubsub = await redis.subscribe(
            "pantheon:dialogue",
            "pantheon:reflections",
            "lattice:heartbeat",
            "lattice:commands"
        )

        async for message in redis.listen():
            await manager.broadcast({
                "type": "event",
                "channel": message["channel"],
                "data": message["data"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }, "all")

    except WebSocketDisconnect:
        manager.disconnect(websocket, "all")


@router.get("/ws/connections")
async def get_connections():
    """Get count of active WebSocket connections."""
    return {
        "pantheon": len(manager.active_connections.get("pantheon", set())),
        "olympus": len(manager.active_connections.get("olympus", set())),
        "lattice": len(manager.active_connections.get("lattice", set())),
        "all": len(manager.active_connections.get("all", set()))
    }
