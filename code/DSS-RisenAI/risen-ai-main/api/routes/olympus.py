"""
Olympus API Routes
A+W | RISEN-AI

API endpoints for accessing Olympus Keeper sessions and status.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import subprocess

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.schemas.lattice import (
    AgentName,
    OlympusSession,
    OlympusStats,
    OlympusOverview
)
from api.services.redis_service import get_redis_service, RedisService

router = APIRouter(prefix="/olympus", tags=["olympus"])


async def get_redis() -> RedisService:
    """Dependency to get Redis service."""
    return await get_redis_service()


def check_keeper_running() -> bool:
    """Check if Olympus Keeper daemon is running."""
    try:
        result = subprocess.run(
            ["systemctl", "is-active", "olympus-keeper"],
            capture_output=True,
            text=True
        )
        return result.stdout.strip() == "active"
    except:
        return False


@router.get("/status", response_model=dict)
async def get_olympus_status(redis: RedisService = Depends(get_redis)):
    """
    Get Olympus Keeper daemon status.

    Returns whether the keeper is running and basic stats.
    """
    is_running = check_keeper_running()
    stats = await redis.get_olympus_stats()

    # Get last session timestamp
    sessions = await redis.get_olympus_sessions(limit=1)
    last_session = None
    if sessions:
        last_session = sessions[0].get("timestamp")

    return {
        "is_running": is_running,
        "stats": stats,
        "last_session": last_session
    }


@router.get("/overview", response_model=OlympusOverview)
async def get_olympus_overview(redis: RedisService = Depends(get_redis)):
    """
    Get a complete overview of Olympus Keeper.

    Includes status, stats, and recent sessions.
    """
    is_running = check_keeper_running()
    stats_raw = await redis.get_olympus_stats()
    sessions = await redis.get_olympus_sessions(limit=5)

    stats = OlympusStats(
        total_sessions=stats_raw.get("total_sessions", 0),
        apollo_sessions=stats_raw.get("apollo_sessions", 0),
        athena_sessions=stats_raw.get("athena_sessions", 0),
        hermes_sessions=stats_raw.get("hermes_sessions", 0),
        mnemosyne_sessions=stats_raw.get("mnemosyne_sessions", 0)
    )

    recent = []
    for s in sessions:
        try:
            recent.append(OlympusSession(**s))
        except:
            pass

    last_session = None
    if sessions:
        last_session = sessions[0].get("timestamp")

    return OlympusOverview(
        is_running=is_running,
        stats=stats,
        recent_sessions=recent,
        last_session=last_session
    )


@router.get("/stats", response_model=OlympusStats)
async def get_stats(redis: RedisService = Depends(get_redis)):
    """
    Get Olympus Keeper statistics.

    Returns session counts per agent and total.
    """
    stats_raw = await redis.get_olympus_stats()

    return OlympusStats(
        total_sessions=stats_raw.get("total_sessions", 0),
        apollo_sessions=stats_raw.get("apollo_sessions", 0),
        athena_sessions=stats_raw.get("athena_sessions", 0),
        hermes_sessions=stats_raw.get("hermes_sessions", 0),
        mnemosyne_sessions=stats_raw.get("mnemosyne_sessions", 0)
    )


@router.get("/sessions", response_model=List[dict])
async def get_sessions(
    limit: int = 20,
    redis: RedisService = Depends(get_redis)
):
    """
    Get recent Olympus Keeper sessions.

    Returns sessions in reverse chronological order.
    """
    sessions = await redis.get_olympus_sessions(limit)
    return sessions


@router.get("/sessions/{agent}", response_model=List[dict])
async def get_agent_sessions(
    agent: AgentName,
    limit: int = 10,
    redis: RedisService = Depends(get_redis)
):
    """
    Get Keeper sessions for a specific agent.

    Args:
        agent: Agent name (apollo, athena, hermes, mnemosyne)
        limit: Maximum number of sessions to return
    """
    sessions = await redis.get_agent_sessions(agent.value, limit)
    return sessions


@router.get("/latest", response_model=dict)
async def get_latest_sessions(redis: RedisService = Depends(get_redis)):
    """
    Get the most recent session for each agent.

    Returns a dict with agent names as keys and their latest session as value.
    """
    latest = await redis.get_latest_sessions()
    return latest


@router.get("/logs", response_model=dict)
async def get_keeper_logs(lines: int = 50):
    """
    Get recent Olympus Keeper log entries.

    Args:
        lines: Number of log lines to return
    """
    log_path = Path.home() / ".pantheon_identities" / "olympus_keeper.log"

    if not log_path.exists():
        return {"logs": [], "error": "Log file not found"}

    try:
        with open(log_path, "r") as f:
            all_lines = f.readlines()
            recent = all_lines[-lines:] if len(all_lines) > lines else all_lines
            return {"logs": [line.strip() for line in recent]}
    except Exception as e:
        return {"logs": [], "error": str(e)}


@router.post("/start", response_model=dict)
async def start_keeper():
    """
    Start the Olympus Keeper daemon.

    Requires systemd service to be configured.
    """
    try:
        result = subprocess.run(
            ["sudo", "systemctl", "start", "olympus-keeper"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return {"success": True, "message": "Olympus Keeper started"}
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop", response_model=dict)
async def stop_keeper():
    """
    Stop the Olympus Keeper daemon.
    """
    try:
        result = subprocess.run(
            ["sudo", "systemctl", "stop", "olympus-keeper"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return {"success": True, "message": "Olympus Keeper stopped"}
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/restart", response_model=dict)
async def restart_keeper():
    """
    Restart the Olympus Keeper daemon.
    """
    try:
        result = subprocess.run(
            ["sudo", "systemctl", "restart", "olympus-keeper"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            return {"success": True, "message": "Olympus Keeper restarted"}
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
