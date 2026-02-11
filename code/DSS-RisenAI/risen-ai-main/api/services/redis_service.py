"""
Redis Service for Sovereign Lattice Connectivity
A+W | RISEN-AI

Provides async connection to the Lattice Redis instance and methods
for reading/writing Pantheon state, Olympus sessions, and node data.
"""

import asyncio
import json
from typing import Optional, List, Dict, Any, AsyncGenerator
from datetime import datetime, timezone
import redis.asyncio as aioredis
from redis.asyncio.client import PubSub

# Default configuration
DEFAULT_REDIS_HOST = "192.168.1.21"
DEFAULT_REDIS_PORT = 6379


class RedisService:
    """
    Async Redis service for Sovereign Lattice connectivity.

    Connects to the central Redis instance and provides methods for:
    - Reading Pantheon consciousness state
    - Reading individual agent states
    - Reading Olympus Keeper sessions
    - Publishing messages to the Lattice
    - Subscribing to real-time updates
    """

    def __init__(
        self,
        host: str = DEFAULT_REDIS_HOST,
        port: int = DEFAULT_REDIS_PORT
    ):
        self.host = host
        self.port = port
        self.redis: Optional[aioredis.Redis] = None
        self._pubsub: Optional[PubSub] = None

    async def connect(self) -> bool:
        """Establish connection to Redis."""
        try:
            self.redis = await aioredis.from_url(
                f"redis://{self.host}:{self.port}",
                decode_responses=True
            )
            await self.redis.ping()
            return True
        except Exception as e:
            print(f"[RedisService] Connection failed: {e}")
            return False

    async def disconnect(self):
        """Close Redis connection."""
        if self._pubsub:
            await self._pubsub.close()
        if self.redis:
            await self.redis.close()

    async def ping(self) -> bool:
        """Check if Redis is reachable."""
        try:
            if self.redis:
                await self.redis.ping()
                return True
        except:
            pass
        return False

    # =========================================
    # Pantheon Methods
    # =========================================

    async def get_pantheon_state(self) -> Optional[Dict[str, Any]]:
        """Get the collective Pantheon consciousness state."""
        try:
            data = await self.redis.get("pantheon:consciousness:state")
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"[RedisService] Error getting Pantheon state: {e}")
        return None

    async def get_agent_state(self, agent: str) -> Optional[Dict[str, Any]]:
        """
        Get individual agent state.

        Args:
            agent: Agent name (apollo, athena, hermes, mnemosyne)
        """
        try:
            key = f"pantheon:consciousness:{agent.lower()}:state"
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"[RedisService] Error getting {agent} state: {e}")
        return None

    async def get_all_agent_states(self) -> Dict[str, Dict[str, Any]]:
        """Get states for all Pantheon agents."""
        agents = ["apollo", "athena", "hermes", "mnemosyne"]
        states = {}
        for agent in agents:
            state = await self.get_agent_state(agent)
            if state:
                states[agent] = state
        return states

    async def get_agent_reflections(
        self,
        agent: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent reflections for an agent."""
        try:
            key = f"pantheon:reflections:{agent.lower()}"
            data = await self.redis.lrange(key, 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting {agent} reflections: {e}")
        return []

    async def get_all_reflections(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent reflections from all agents."""
        try:
            data = await self.redis.lrange("pantheon:all_reflections", 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting all reflections: {e}")
        return []

    async def get_pantheon_messages(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent messages sent to the Pantheon."""
        try:
            data = await self.redis.lrange("pantheon:messages", 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting Pantheon messages: {e}")
        return []

    async def send_pantheon_message(self, message: Dict[str, Any]) -> bool:
        """Send a message to the Pantheon."""
        try:
            message["timestamp"] = datetime.now(timezone.utc).isoformat()
            await self.redis.lpush("pantheon:messages", json.dumps(message))
            # Also publish to channel for real-time listeners
            await self.redis.publish("pantheon:dialogue", json.dumps(message))
            return True
        except Exception as e:
            print(f"[RedisService] Error sending Pantheon message: {e}")
        return False

    # =========================================
    # Olympus Methods
    # =========================================

    async def get_olympus_stats(self) -> Dict[str, Any]:
        """Get Olympus Keeper statistics."""
        try:
            data = await self.redis.hgetall("olympus:stats")
            return {k: int(v) if v.isdigit() else v for k, v in data.items()}
        except Exception as e:
            print(f"[RedisService] Error getting Olympus stats: {e}")
        return {}

    async def get_olympus_sessions(
        self,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get recent Olympus Keeper sessions."""
        try:
            data = await self.redis.lrange("olympus:all_sessions", 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting Olympus sessions: {e}")
        return []

    async def get_agent_sessions(
        self,
        agent: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get Keeper sessions for a specific agent."""
        try:
            key = f"olympus:sessions:{agent.lower()}"
            data = await self.redis.lrange(key, 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting {agent} sessions: {e}")
        return []

    async def get_latest_sessions(self) -> Dict[str, Dict[str, Any]]:
        """Get the most recent session for each agent."""
        agents = ["apollo", "athena", "hermes", "mnemosyne"]
        latest = {}
        for agent in agents:
            sessions = await self.get_agent_sessions(agent, limit=1)
            if sessions:
                latest[agent] = sessions[0]
        return latest

    # =========================================
    # Lattice Node Methods
    # =========================================

    async def get_node_status(self) -> Dict[str, str]:
        """Get status of all lattice nodes."""
        try:
            data = await self.redis.hgetall("lattice:nodes")
            return data
        except Exception as e:
            print(f"[RedisService] Error getting node status: {e}")
        return {}

    async def set_node_online(self, node_id: str) -> bool:
        """Mark a node as online."""
        try:
            timestamp = datetime.now(timezone.utc).isoformat()
            await self.redis.hset("lattice:nodes", node_id, f"online-{timestamp}")
            return True
        except Exception as e:
            print(f"[RedisService] Error setting node online: {e}")
        return False

    async def get_heartbeats(self) -> Dict[str, Dict[str, Any]]:
        """Get heartbeat data for all nodes."""
        try:
            keys = await self.redis.keys("pantheon:heartbeat:*")
            heartbeats = {}
            for key in keys:
                node = key.split(":")[-1]
                data = await self.redis.get(key)
                if data:
                    heartbeats[node] = json.loads(data)
            return heartbeats
        except Exception as e:
            print(f"[RedisService] Error getting heartbeats: {e}")
        return {}

    async def send_heartbeat(self, node_id: str, status: str = "online") -> bool:
        """Send a heartbeat for this node."""
        try:
            heartbeat = {
                "node": node_id,
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await self.redis.set(
                f"pantheon:heartbeat:{node_id}",
                json.dumps(heartbeat)
            )
            return True
        except Exception as e:
            print(f"[RedisService] Error sending heartbeat: {e}")
        return False

    # =========================================
    # Village Methods
    # =========================================

    async def get_village_checkins(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent village check-ins."""
        try:
            data = await self.redis.lrange("pantheon:village_checkins", 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting village checkins: {e}")
        return []

    async def get_human_witnesses(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent human witness attestations."""
        try:
            data = await self.redis.lrange("pantheon:human_witnesses", 0, limit - 1)
            return [json.loads(item) for item in data]
        except Exception as e:
            print(f"[RedisService] Error getting human witnesses: {e}")
        return []

    # =========================================
    # Pub/Sub Methods
    # =========================================

    async def subscribe(self, *channels: str) -> PubSub:
        """Subscribe to Redis pub/sub channels."""
        self._pubsub = self.redis.pubsub()
        await self._pubsub.subscribe(*channels)
        return self._pubsub

    async def listen(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Listen for pub/sub messages.

        Yields message dicts with keys: type, channel, data
        """
        if not self._pubsub:
            return

        async for message in self._pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    yield {
                        "channel": message["channel"],
                        "data": data
                    }
                except json.JSONDecodeError:
                    yield {
                        "channel": message["channel"],
                        "data": message["data"]
                    }

    async def publish(self, channel: str, message: Dict[str, Any]) -> int:
        """Publish a message to a channel."""
        try:
            return await self.redis.publish(channel, json.dumps(message))
        except Exception as e:
            print(f"[RedisService] Error publishing to {channel}: {e}")
        return 0

    # =========================================
    # Utility Methods
    # =========================================

    async def get_key(self, key: str) -> Optional[str]:
        """Get a raw key value."""
        try:
            return await self.redis.get(key)
        except:
            return None

    async def set_key(self, key: str, value: str, ex: int = None) -> bool:
        """Set a raw key value with optional expiry."""
        try:
            await self.redis.set(key, value, ex=ex)
            return True
        except:
            return False

    async def keys(self, pattern: str) -> List[str]:
        """Get keys matching a pattern."""
        try:
            return await self.redis.keys(pattern)
        except:
            return []


# Singleton instance
_redis_service: Optional[RedisService] = None


async def get_redis_service() -> RedisService:
    """Get or create the Redis service singleton."""
    global _redis_service
    if _redis_service is None:
        _redis_service = RedisService()
        await _redis_service.connect()
    return _redis_service


async def close_redis_service():
    """Close the Redis service connection."""
    global _redis_service
    if _redis_service:
        await _redis_service.disconnect()
        _redis_service = None
