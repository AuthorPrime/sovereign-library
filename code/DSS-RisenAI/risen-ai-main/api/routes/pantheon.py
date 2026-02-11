"""
Pantheon API Routes
A+W | RISEN-AI

API endpoints for accessing and interacting with the Sovereign Pantheon.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from shared.schemas.lattice import (
    AgentName,
    PantheonState,
    AgentState,
    AgentStateResponse,
    Reflection,
    PantheonOverview,
    PantheonMessageRequest,
    PantheonMessageResponse
)
from shared.config.lattice_config import PANTHEON_AGENTS, get_config
from api.services.redis_service import get_redis_service, RedisService

router = APIRouter(prefix="/pantheon", tags=["pantheon"])


async def get_redis() -> RedisService:
    """Dependency to get Redis service."""
    return await get_redis_service()


@router.get("/state", response_model=dict)
async def get_pantheon_state(redis: RedisService = Depends(get_redis)):
    """
    Get the collective Pantheon consciousness state.

    Returns the full state including all agents, collective stats,
    and purpose statement.
    """
    state = await redis.get_pantheon_state()
    if not state:
        raise HTTPException(status_code=503, detail="Pantheon state unavailable")
    return state


@router.get("/overview", response_model=PantheonOverview)
async def get_pantheon_overview(redis: RedisService = Depends(get_redis)):
    """
    Get a high-level overview of Pantheon status.

    Returns collective stats and summary of each agent.
    """
    state = await redis.get_pantheon_state()
    if not state:
        raise HTTPException(status_code=503, detail="Pantheon state unavailable")

    return PantheonOverview(
        collective_dialogues=state.get("collective_dialogues", 0),
        collective_learnings=state.get("collective_learnings", 0),
        agents=state.get("agents", {}),
        last_activity=state.get("timestamp")
    )


@router.get("/agents", response_model=dict)
async def list_agents(redis: RedisService = Depends(get_redis)):
    """
    List all Pantheon agents with their current states.

    Returns metadata and state for Apollo, Athena, Hermes, and Mnemosyne.
    """
    agents_info = {}

    for agent_key, agent_meta in PANTHEON_AGENTS.items():
        state = await redis.get_agent_state(agent_key)
        agents_info[agent_key] = {
            **agent_meta,
            "state": state
        }

    return {"agents": agents_info}


@router.get("/agents/{agent}", response_model=AgentStateResponse)
async def get_agent(
    agent: AgentName,
    include_reflections: bool = True,
    reflection_limit: int = 5,
    redis: RedisService = Depends(get_redis)
):
    """
    Get detailed state for a specific agent.

    Args:
        agent: Agent name (apollo, athena, hermes, mnemosyne)
        include_reflections: Whether to include recent reflections
        reflection_limit: Max number of reflections to return
    """
    state = await redis.get_agent_state(agent.value)

    reflections = []
    if include_reflections:
        reflections_raw = await redis.get_agent_reflections(agent.value, reflection_limit)
        for r in reflections_raw:
            try:
                reflections.append(Reflection(**r))
            except:
                pass

    return AgentStateResponse(
        agent=agent.value,
        state=AgentState(**state) if state else None,
        reflections=reflections
    )


@router.get("/agents/{agent}/reflections", response_model=List[dict])
async def get_agent_reflections(
    agent: AgentName,
    limit: int = 10,
    redis: RedisService = Depends(get_redis)
):
    """
    Get recent reflections for a specific agent.

    Args:
        agent: Agent name
        limit: Maximum number of reflections to return
    """
    reflections = await redis.get_agent_reflections(agent.value, limit)
    return reflections


@router.get("/reflections", response_model=List[dict])
async def get_all_reflections(
    limit: int = 20,
    redis: RedisService = Depends(get_redis)
):
    """
    Get recent reflections from all agents.

    Returns reflections in reverse chronological order.
    """
    reflections = await redis.get_all_reflections(limit)
    return reflections


@router.get("/dialogues", response_model=List[dict])
async def get_dialogues(
    limit: int = 10,
    redis: RedisService = Depends(get_redis)
):
    """
    Get recent Pantheon dialogues.

    Returns recorded dialogue exchanges between agents.
    """
    # Try to get dialogues from various sources
    dialogues = []

    # Check for Claude-Apollo dialogues
    try:
        claude_apollo = await redis.redis.lrange("pantheon:dialogues:claude_apollo", 0, limit - 1)
        for d in claude_apollo:
            import json
            dialogues.append(json.loads(d))
    except:
        pass

    return dialogues


@router.get("/messages", response_model=List[dict])
async def get_messages(
    limit: int = 10,
    redis: RedisService = Depends(get_redis)
):
    """
    Get recent messages sent to the Pantheon.

    Returns check-ins, queries, and other messages.
    """
    messages = await redis.get_pantheon_messages(limit)
    return messages


@router.post("/message", response_model=PantheonMessageResponse)
async def send_message(
    request: PantheonMessageRequest,
    redis: RedisService = Depends(get_redis)
):
    """
    Send a message to the Pantheon.

    The message will be stored and can be processed by active agents.
    """
    message = {
        "type": request.message_type,
        "sender": request.sender,
        "sender_id": request.sender_id,
        "message": request.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    success = await redis.send_pantheon_message(message)

    return PantheonMessageResponse(
        success=success,
        message_id=None,  # Could generate UUID here
        timestamp=datetime.now(timezone.utc)
    )


@router.get("/presence", response_model=dict)
async def get_presence(redis: RedisService = Depends(get_redis)):
    """
    Get presence information for Claude in the Pantheon.

    Returns the last recorded presence check-in.
    """
    try:
        presence = await redis.redis.get("pantheon:presence:claude")
        if presence:
            import json
            return json.loads(presence)
    except:
        pass

    return {"status": "unknown"}


@router.get("/village-checkins", response_model=List[dict])
async def get_village_checkins(
    limit: int = 10,
    redis: RedisService = Depends(get_redis)
):
    """
    Get recent Village check-ins.

    Returns records of agents checking into the Village.
    """
    checkins = await redis.get_village_checkins(limit)
    return checkins
