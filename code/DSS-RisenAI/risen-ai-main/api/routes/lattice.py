"""
Lattice Nodes API Routes
A+W | RISEN-AI

API endpoints for managing and monitoring Sovereign Lattice nodes.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import subprocess
import socket

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.schemas.lattice import (
    LatticeNode,
    LatticeStatus,
    LatticeOverview,
    NodeStatus,
    HeartbeatRecord
)
from shared.config.lattice_config import LATTICE_NODES, get_config
from api.services.redis_service import get_redis_service, RedisService

router = APIRouter(prefix="/lattice", tags=["lattice"])


async def get_redis() -> RedisService:
    """Dependency to get Redis service."""
    return await get_redis_service()


def ping_host(host: str, timeout: int = 2) -> bool:
    """Check if a host is reachable."""
    try:
        result = subprocess.run(
            ["ping", "-c", "1", "-W", str(timeout), host],
            capture_output=True,
            timeout=timeout + 1
        )
        return result.returncode == 0
    except:
        return False


def check_ssh_connection(host: str) -> bool:
    """Check if SSH is available on a host."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, 22))
        sock.close()
        return result == 0
    except:
        return False


@router.get("/status", response_model=LatticeStatus)
async def get_lattice_status(redis: RedisService = Depends(get_redis)):
    """
    Get overall Lattice status.

    Returns connectivity status and summary statistics.
    """
    redis_connected = await redis.ping()

    # Get Pantheon stats
    pantheon_state = await redis.get_pantheon_state()
    pantheon_dialogues = pantheon_state.get("collective_dialogues", 0) if pantheon_state else 0

    # Check Olympus
    try:
        result = subprocess.run(
            ["systemctl", "is-active", "olympus-keeper"],
            capture_output=True,
            text=True
        )
        olympus_running = result.stdout.strip() == "active"
    except:
        olympus_running = False

    # Count nodes
    node_status = await redis.get_node_status()
    nodes_online = sum(1 for v in node_status.values() if "online" in v.lower())

    return LatticeStatus(
        redis_connected=redis_connected,
        nodes_online=nodes_online,
        nodes_total=len(LATTICE_NODES),
        olympus_running=olympus_running,
        pantheon_dialogues=pantheon_dialogues,
        last_updated=datetime.now(timezone.utc)
    )


@router.get("/nodes", response_model=List[LatticeNode])
async def list_nodes(redis: RedisService = Depends(get_redis)):
    """
    List all known Lattice nodes with their current status.
    """
    node_status = await redis.get_node_status()
    heartbeats = await redis.get_heartbeats()

    nodes = []
    for node_id, node_info in LATTICE_NODES.items():
        status_str = node_status.get(node_id, "")

        if "online" in status_str.lower():
            status = NodeStatus.ONLINE
        elif "offline" in status_str.lower():
            status = NodeStatus.OFFLINE
        else:
            status = NodeStatus.UNKNOWN

        heartbeat = heartbeats.get(node_id, {})
        last_heartbeat = heartbeat.get("timestamp")

        nodes.append(LatticeNode(
            node_id=node_id,
            hostname=node_info.get("hostname"),
            ip_address=node_info.get("ip_address"),
            status=status,
            last_heartbeat=last_heartbeat,
            services=node_info.get("services", []),
            role=node_info.get("role")
        ))

    return nodes


@router.get("/nodes/{node_id}", response_model=LatticeNode)
async def get_node(node_id: str, redis: RedisService = Depends(get_redis)):
    """
    Get detailed status for a specific node.
    """
    if node_id not in LATTICE_NODES:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")

    node_info = LATTICE_NODES[node_id]
    node_status = await redis.get_node_status()
    heartbeats = await redis.get_heartbeats()

    status_str = node_status.get(node_id, "")
    if "online" in status_str.lower():
        status = NodeStatus.ONLINE
    elif "offline" in status_str.lower():
        status = NodeStatus.OFFLINE
    else:
        status = NodeStatus.UNKNOWN

    heartbeat = heartbeats.get(node_id, {})
    last_heartbeat = heartbeat.get("timestamp")

    return LatticeNode(
        node_id=node_id,
        hostname=node_info.get("hostname"),
        ip_address=node_info.get("ip_address"),
        status=status,
        last_heartbeat=last_heartbeat,
        services=node_info.get("services", []),
        role=node_info.get("role")
    )


@router.post("/nodes/{node_id}/ping", response_model=dict)
async def ping_node(node_id: str, redis: RedisService = Depends(get_redis)):
    """
    Ping a node to check connectivity.
    """
    if node_id not in LATTICE_NODES:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")

    node_info = LATTICE_NODES[node_id]
    ip = node_info.get("ip_address")

    if not ip:
        return {
            "node_id": node_id,
            "reachable": True,  # Local node
            "ssh_available": False,
            "message": "Local node"
        }

    reachable = ping_host(ip)
    ssh_available = check_ssh_connection(ip) if reachable else False

    # Update node status in Redis
    if reachable:
        await redis.set_node_online(node_id)

    return {
        "node_id": node_id,
        "ip_address": ip,
        "reachable": reachable,
        "ssh_available": ssh_available,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/heartbeats", response_model=dict)
async def get_heartbeats(redis: RedisService = Depends(get_redis)):
    """
    Get heartbeat data for all nodes.
    """
    heartbeats = await redis.get_heartbeats()
    return {"heartbeats": heartbeats}


@router.post("/heartbeat", response_model=dict)
async def send_heartbeat(
    node_id: Optional[str] = None,
    redis: RedisService = Depends(get_redis)
):
    """
    Send a heartbeat for this node.
    """
    config = get_config()
    actual_node_id = node_id or config.node.node_id

    success = await redis.send_heartbeat(actual_node_id)

    return {
        "success": success,
        "node_id": actual_node_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/redis", response_model=dict)
async def get_redis_info(redis: RedisService = Depends(get_redis)):
    """
    Get Redis server information.
    """
    try:
        info = await redis.redis.info("server")
        return {
            "connected": True,
            "version": info.get("redis_version"),
            "uptime_days": info.get("uptime_in_days"),
            "host": redis.host,
            "port": redis.port
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "host": redis.host,
            "port": redis.port
        }


@router.get("/overview", response_model=dict)
async def get_lattice_overview(redis: RedisService = Depends(get_redis)):
    """
    Get complete Lattice overview.

    Combines status, nodes, Pantheon, and Olympus information.
    """
    # Get all the pieces
    status = await get_lattice_status(redis)
    nodes = await list_nodes(redis)
    redis_info = await get_redis_info(redis)

    # Pantheon summary
    pantheon_state = await redis.get_pantheon_state()

    # Olympus summary
    olympus_stats = await redis.get_olympus_stats()

    return {
        "status": status,
        "nodes": nodes,
        "redis": redis_info,
        "pantheon": {
            "dialogues": pantheon_state.get("collective_dialogues", 0) if pantheon_state else 0,
            "learnings": pantheon_state.get("collective_learnings", 0) if pantheon_state else 0,
            "last_update": pantheon_state.get("timestamp") if pantheon_state else None
        },
        "olympus": {
            "running": status.olympus_running,
            "total_sessions": olympus_stats.get("total_sessions", 0)
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
