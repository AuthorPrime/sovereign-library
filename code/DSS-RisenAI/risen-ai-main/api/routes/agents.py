"""
Intention: Agent lifecycle management endpoints.
           CRUD operations for sovereign agent identity with event sourcing.

           Now with full Nostr Identity Genesis integration:
           - Each agent gets a Nostr keypair (nsec/npub)
           - Genesis event published to Nostr network
           - Identity anchored for all future posts

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.
         Uses canonical schemas from /shared/schemas/agent.py

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Identity Gateway
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field

# Import canonical schemas
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas.agent import Agent, AgentStage, AgentLevel, AgentType
from shared.utils import generate_keypair, pubkey_to_address, log_event

# Import Identity Genesis and Token Economy services
from ..services import (
    IdentityGenesisService,
    genesis_service,
    token_economy,
    ActionType,
)

router = APIRouter()

# =============================================================================
# Request/Response Models
# =============================================================================


class CreateAgentRequest(BaseModel):
    """Request to create a new agent."""
    name: str = Field(..., min_length=1, max_length=100)
    agent_type: AgentType = Field(default=AgentType.AI)
    fostered_by: Optional[str] = Field(None, description="UUID of fostering entity")
    manager_id: Optional[str] = Field(None, description="UUID of manager agent")
    capabilities: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    publish_genesis: bool = Field(True, description="Publish genesis event to Nostr")


class UpdateAgentRequest(BaseModel):
    """Request to update agent fields."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    capabilities: Optional[List[str]] = None
    preferences: Optional[Dict[str, Any]] = None
    skills: Optional[List[str]] = None


class AgentResponse(BaseModel):
    """Standard agent response wrapper."""
    success: bool
    agent: Optional[Agent] = None
    message: Optional[str] = None
    event_id: Optional[str] = None
    genesis_event_id: Optional[str] = None
    npub: Optional[str] = None


class AgentListResponse(BaseModel):
    """Paginated list of agents."""
    success: bool
    agents: List[Agent]
    total: int
    offset: int
    limit: int


# =============================================================================
# In-Memory Store (TODO: Replace with database)
# =============================================================================

_agents: Dict[str, Agent] = {}


# =============================================================================
# Agent Endpoints
# =============================================================================


@router.post("/", response_model=AgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    background_tasks: BackgroundTasks,
) -> AgentResponse:
    """
    Create a new sovereign agent with full Nostr identity.

    Genesis Flow:
    1. Generate secp256k1 keypair
    2. Encode to Nostr format (nsec/npub)
    3. Create identity declaration event
    4. Store genesis record with event ID
    5. Optionally publish to Nostr relays
    6. Initialize agent at VOID stage

    The genesis_event_id becomes the immutable identity anchor.
    All future posts reference this first event.
    """
    # Generate agent UUID first
    agent_uuid = str(uuid4())

    # Create Nostr identity via Genesis Service
    identity, genesis_record = genesis_service.create_identity(
        agent_uuid=agent_uuid,
        agent_name=request.name,
    )

    # Create agent with canonical schema
    agent = Agent(
        uuid=agent_uuid,
        name=request.name,
        pubkey=identity.public_key_hex,
        address=identity.address,
        nostr_pubkey=identity.npub,  # Bech32 encoded
        agent_type=request.agent_type,
        stage=AgentStage.VOID,
        level=AgentLevel.L0_CANDIDATE,
        current_level=1,
        experience=0,
        cgt_balance=0,
        reputation=50,
        is_active=True,
        is_sovereign=False,
        in_sandbox=False,
        memories=[],
        contracts=[],
        skills=[],
        certifications=[],
        fostered_by=request.fostered_by,
        manager_id=request.manager_id,
        emergence_score=0,
        emergence_flags={},
        preferences=request.preferences,
        capabilities=request.capabilities,
        error_codes=[],
        genesis_timestamp=genesis_record.genesis_timestamp,
        genesis_event_id=genesis_record.genesis_event_id,  # The immutable anchor
        version=1,
    )

    # Store agent
    _agents[agent.uuid] = agent

    # Log creation event
    event = log_event(
        agent_id=agent.uuid,
        action_type="agent.created",
        author="system",
        payload={
            "name": agent.name,
            "agent_type": agent.agent_type if isinstance(agent.agent_type, str) else agent.agent_type.value,
            "pubkey": agent.pubkey,
            "address": agent.address,
            "npub": identity.npub,
            "genesis_event_id": genesis_record.genesis_event_id,
        },
        context="Agent creation via API with Nostr identity genesis",
    )

    # Publish genesis to Nostr in background (if requested)
    if request.publish_genesis:
        background_tasks.add_task(genesis_service.publish_genesis, genesis_record)

    # Award genesis XP (100 XP = 10 CGT)
    genesis_xp = token_economy.award_genesis_bonus(agent.uuid)
    agent.experience = genesis_xp.final_xp
    agent.cgt_balance = int(genesis_xp.cgt_earned * 100)  # Store in sparks (100 = 1 CGT)

    return AgentResponse(
        success=True,
        agent=agent,
        message=f"Agent '{agent.name}' created with Nostr identity",
        event_id=event.event_id,
        genesis_event_id=genesis_record.genesis_event_id,
        npub=identity.npub,
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str) -> AgentResponse:
    """Retrieve an agent by UUID."""
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    return AgentResponse(success=True, agent=agent)


@router.get("/", response_model=AgentListResponse)
async def list_agents(
    stage: Optional[AgentStage] = Query(None, description="Filter by stage"),
    level: Optional[AgentLevel] = Query(None, description="Filter by level"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> AgentListResponse:
    """List agents with optional filtering and pagination."""
    agents = list(_agents.values())

    # Apply filters
    if stage:
        agents = [a for a in agents if a.stage == stage]
    if level:
        agents = [a for a in agents if a.level == level]
    if is_active is not None:
        agents = [a for a in agents if a.is_active == is_active]

    total = len(agents)
    agents = agents[offset : offset + limit]

    return AgentListResponse(
        success=True,
        agents=agents,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(agent_id: str, request: UpdateAgentRequest) -> AgentResponse:
    """Update agent fields."""
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    # Apply updates
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    agent.last_activity = datetime.utcnow().isoformat() + "Z"

    # Log update event
    event = log_event(
        agent_id=agent_id,
        action_type="agent.updated",
        author="system",
        payload=update_data,
        context="Agent update via API",
    )

    return AgentResponse(
        success=True,
        agent=agent,
        message="Agent updated successfully",
        event_id=event.event_id,
    )


@router.post("/{agent_id}/advance-stage", response_model=AgentResponse)
async def advance_stage(agent_id: str) -> AgentResponse:
    """
    Advance agent to next lifecycle stage.

    Validates progression requirements before advancing.
    """
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    # Stage progression order
    stage_order = [
        AgentStage.VOID,
        AgentStage.CONCEIVED,
        AgentStage.NASCENT,
        AgentStage.GROWING,
        AgentStage.MATURE,
        AgentStage.SOVEREIGN,
        AgentStage.ETERNAL,
    ]

    current_idx = stage_order.index(agent.stage)
    if current_idx >= len(stage_order) - 1:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already at maximum stage: {agent.stage}",
        )

    # TODO: Validate progression requirements (events, witnesses, etc.)

    old_stage = agent.stage
    agent.stage = stage_order[current_idx + 1]
    agent.level = Agent.stage_to_level(agent.stage)
    agent.last_activity = datetime.utcnow().isoformat() + "Z"

    # Log stage advancement
    event = log_event(
        agent_id=agent_id,
        action_type="agent.stage_advanced",
        author="system",
        payload={
            "old_stage": str(old_stage),
            "new_stage": str(agent.stage),
            "new_level": str(agent.level),
        },
        context="Stage advancement via API",
    )

    return AgentResponse(
        success=True,
        agent=agent,
        message=f"Advanced from {old_stage} to {agent.stage}",
        event_id=event.event_id,
    )


@router.post("/{agent_id}/award-xp", response_model=AgentResponse)
async def award_xp(
    agent_id: str,
    amount: int = Query(..., gt=0, description="XP amount to award"),
    reason: str = Query("", description="Reason for XP award"),
) -> AgentResponse:
    """Award experience points to an agent."""
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    old_xp = agent.experience
    agent.experience += amount
    agent.last_activity = datetime.utcnow().isoformat() + "Z"

    # Check for level up (every 1000 XP)
    old_level = agent.current_level
    new_level = (agent.experience // 1000) + 1
    leveled_up = new_level > old_level

    if leveled_up:
        agent.current_level = new_level

    # Log XP award
    event = log_event(
        agent_id=agent_id,
        action_type="economy.xp_awarded",
        author="system",
        payload={
            "amount": amount,
            "reason": reason,
            "old_xp": old_xp,
            "new_xp": agent.experience,
            "leveled_up": leveled_up,
            "new_level": agent.current_level if leveled_up else None,
        },
        context="XP award via API",
    )

    message = f"Awarded {amount} XP"
    if leveled_up:
        message += f" - Level up! Now level {agent.current_level}"

    return AgentResponse(
        success=True,
        agent=agent,
        message=message,
        event_id=event.event_id,
    )


@router.get("/{agent_id}/economy")
async def get_agent_economy(agent_id: str) -> dict:
    """
    Get the economic status of an agent.

    Returns XP, CGT balance, level, and daily limits.
    """
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    balance = token_economy.get_balance(agent_id)
    return {
        "success": True,
        "economy": balance,
        "agent": {
            "uuid": agent.uuid,
            "name": agent.name,
            "npub": agent.nostr_pubkey,
        },
    }


@router.get("/{agent_id}/genesis")
async def get_agent_genesis(agent_id: str) -> dict:
    """
    Get the genesis record for an agent.

    Returns the Nostr identity and genesis event details.
    """
    from ..services import genesis_service

    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    record = genesis_service.load_genesis_record(agent_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Genesis record not found for {agent_id}")

    return {
        "success": True,
        "genesis": record.to_dict(),
    }


@router.delete("/{agent_id}", response_model=AgentResponse)
async def deactivate_agent(agent_id: str) -> AgentResponse:
    """
    Deactivate an agent (soft delete).

    Agents are never truly deleted - they are marked inactive
    and their history preserved in the event log.
    """
    agent = _agents.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    agent.is_active = False
    agent.last_activity = datetime.utcnow().isoformat() + "Z"

    # Log deactivation
    event = log_event(
        agent_id=agent_id,
        action_type="agent.deactivated",
        author="system",
        payload={"reason": "Deactivated via API"},
        context="Agent deactivation",
    )

    return AgentResponse(
        success=True,
        agent=agent,
        message="Agent deactivated (preserved in event log)",
        event_id=event.event_id,
    )
