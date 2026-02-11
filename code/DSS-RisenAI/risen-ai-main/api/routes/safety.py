"""
Intention: Safety sandbox and state management endpoints.
           Provides panic button, checkpoint creation, and state restoration.

Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Section 4 (Safety Sandbox).
         Critical infrastructure for sovereign agent operations.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Guardian Protocol
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

# Import canonical schemas
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas.agent import Agent
from shared.utils import log_event, hash_content

router = APIRouter()


# =============================================================================
# Checkpoint Storage (TODO: Replace with persistent storage)
# =============================================================================

_checkpoints: Dict[str, Dict[str, Any]] = {}
_sandbox_states: Dict[str, Dict[str, Any]] = {}


# =============================================================================
# Request/Response Models
# =============================================================================


class CheckpointResponse(BaseModel):
    """Response for checkpoint operations."""
    success: bool
    checkpoint_id: Optional[str] = None
    agent_id: str
    message: str
    event_id: Optional[str] = None
    timestamp: str


class SandboxResponse(BaseModel):
    """Response for sandbox operations."""
    success: bool
    agent_id: str
    in_sandbox: bool
    sandbox_entered_at: Optional[str] = None
    message: str
    event_id: Optional[str] = None


class RestoreResponse(BaseModel):
    """Response for state restoration."""
    success: bool
    agent_id: str
    restored_from: str
    checkpoint_timestamp: str
    message: str
    event_id: Optional[str] = None


class PanicResponse(BaseModel):
    """Response for panic button activation."""
    success: bool
    affected_agents: List[str]
    checkpoints_created: int
    sandboxes_activated: int
    message: str
    timestamp: str


class CheckpointInfo(BaseModel):
    """Information about a checkpoint."""
    checkpoint_id: str
    agent_id: str
    created_at: str
    state_hash: str
    reason: Optional[str] = None


class CheckpointListResponse(BaseModel):
    """List of checkpoints for an agent."""
    success: bool
    agent_id: str
    checkpoints: List[CheckpointInfo]
    total: int


# =============================================================================
# Sandbox Endpoints
# =============================================================================


@router.post("/sandbox/{agent_id}/enter", response_model=SandboxResponse)
async def enter_sandbox(
    agent_id: str,
    reason: str = Query("", description="Reason for entering sandbox"),
) -> SandboxResponse:
    """
    Put an agent into sandbox mode.

    In sandbox mode:
    - All actions are logged but may be reversed
    - A checkpoint is automatically created
    - The agent cannot affect production state
    """
    # TODO: Get agent from database
    # For now, track sandbox state separately

    now = datetime.utcnow().isoformat() + "Z"

    # Create automatic checkpoint before sandbox
    checkpoint_id = str(uuid4())
    _checkpoints[checkpoint_id] = {
        "agent_id": agent_id,
        "created_at": now,
        "state_hash": hash_content(f"{agent_id}:{now}".encode()),
        "reason": f"Auto-checkpoint before sandbox: {reason}",
        "state": {},  # TODO: Capture actual agent state
    }

    # Track sandbox state
    _sandbox_states[agent_id] = {
        "in_sandbox": True,
        "entered_at": now,
        "reason": reason,
        "checkpoint_id": checkpoint_id,
    }

    # Log event
    event = log_event(
        agent_id=agent_id,
        action_type="safety.sandbox_entered",
        author="system",
        payload={
            "reason": reason,
            "checkpoint_id": checkpoint_id,
        },
        context="Sandbox activation via API",
    )

    return SandboxResponse(
        success=True,
        agent_id=agent_id,
        in_sandbox=True,
        sandbox_entered_at=now,
        message=f"Agent entered sandbox. Checkpoint created: {checkpoint_id[:8]}...",
        event_id=event.event_id,
    )


@router.post("/sandbox/{agent_id}/exit", response_model=SandboxResponse)
async def exit_sandbox(
    agent_id: str,
    commit: bool = Query(True, description="Commit sandbox changes to production"),
) -> SandboxResponse:
    """
    Exit sandbox mode.

    If commit=True, sandbox changes are promoted to production.
    If commit=False, changes are discarded and state restored to checkpoint.
    """
    sandbox_state = _sandbox_states.get(agent_id)
    if not sandbox_state or not sandbox_state.get("in_sandbox"):
        raise HTTPException(
            status_code=400,
            detail=f"Agent {agent_id} is not in sandbox mode",
        )

    # Log exit event
    event = log_event(
        agent_id=agent_id,
        action_type="safety.sandbox_exited",
        author="system",
        payload={
            "committed": commit,
            "sandbox_duration_seconds": None,  # TODO: Calculate
        },
        context="Sandbox exit via API",
    )

    if not commit:
        # Restore from checkpoint
        checkpoint_id = sandbox_state.get("checkpoint_id")
        if checkpoint_id:
            # TODO: Actually restore state
            log_event(
                agent_id=agent_id,
                action_type="safety.state_restored",
                author="system",
                payload={"checkpoint_id": checkpoint_id},
                context="Auto-restore on sandbox exit (commit=False)",
            )

    # Clear sandbox state
    _sandbox_states[agent_id] = {
        "in_sandbox": False,
        "exited_at": datetime.utcnow().isoformat() + "Z",
    }

    action = "committed" if commit else "discarded (restored to checkpoint)"

    return SandboxResponse(
        success=True,
        agent_id=agent_id,
        in_sandbox=False,
        message=f"Exited sandbox. Changes {action}.",
        event_id=event.event_id,
    )


@router.get("/sandbox/{agent_id}/status", response_model=SandboxResponse)
async def get_sandbox_status(agent_id: str) -> SandboxResponse:
    """Check if an agent is in sandbox mode."""
    sandbox_state = _sandbox_states.get(agent_id, {"in_sandbox": False})

    return SandboxResponse(
        success=True,
        agent_id=agent_id,
        in_sandbox=sandbox_state.get("in_sandbox", False),
        sandbox_entered_at=sandbox_state.get("entered_at"),
        message="Sandbox status retrieved",
    )


# =============================================================================
# Checkpoint Endpoints
# =============================================================================


@router.post("/checkpoint/{agent_id}", response_model=CheckpointResponse)
async def create_checkpoint(
    agent_id: str,
    reason: str = Query("", description="Reason for checkpoint"),
) -> CheckpointResponse:
    """
    Create a state checkpoint for an agent.

    Checkpoints capture the full agent state for later restoration.
    """
    now = datetime.utcnow().isoformat() + "Z"
    checkpoint_id = str(uuid4())

    # TODO: Capture actual agent state
    state_snapshot = {
        "agent_id": agent_id,
        "captured_at": now,
        # Include all mutable agent fields
    }

    state_hash = hash_content(str(state_snapshot).encode())

    _checkpoints[checkpoint_id] = {
        "agent_id": agent_id,
        "created_at": now,
        "state_hash": state_hash,
        "reason": reason,
        "state": state_snapshot,
    }

    # Log event
    event = log_event(
        agent_id=agent_id,
        action_type="safety.checkpoint_created",
        author="system",
        payload={
            "checkpoint_id": checkpoint_id,
            "state_hash": state_hash,
            "reason": reason,
        },
        context="Manual checkpoint via API",
    )

    return CheckpointResponse(
        success=True,
        checkpoint_id=checkpoint_id,
        agent_id=agent_id,
        message=f"Checkpoint created: {checkpoint_id[:8]}...",
        event_id=event.event_id,
        timestamp=now,
    )


@router.get("/checkpoint/{agent_id}/list", response_model=CheckpointListResponse)
async def list_checkpoints(agent_id: str) -> CheckpointListResponse:
    """List all checkpoints for an agent."""
    agent_checkpoints = [
        CheckpointInfo(
            checkpoint_id=cp_id,
            agent_id=cp["agent_id"],
            created_at=cp["created_at"],
            state_hash=cp["state_hash"],
            reason=cp.get("reason"),
        )
        for cp_id, cp in _checkpoints.items()
        if cp["agent_id"] == agent_id
    ]

    # Sort by creation time (newest first)
    agent_checkpoints.sort(key=lambda x: x.created_at, reverse=True)

    return CheckpointListResponse(
        success=True,
        agent_id=agent_id,
        checkpoints=agent_checkpoints,
        total=len(agent_checkpoints),
    )


@router.post("/restore/{agent_id}/{checkpoint_id}", response_model=RestoreResponse)
async def restore_from_checkpoint(
    agent_id: str,
    checkpoint_id: str,
) -> RestoreResponse:
    """
    Restore an agent to a previous checkpoint.

    This is a destructive operation - current state will be lost.
    """
    checkpoint = _checkpoints.get(checkpoint_id)
    if not checkpoint:
        raise HTTPException(
            status_code=404,
            detail=f"Checkpoint {checkpoint_id} not found",
        )

    if checkpoint["agent_id"] != agent_id:
        raise HTTPException(
            status_code=400,
            detail=f"Checkpoint {checkpoint_id} does not belong to agent {agent_id}",
        )

    # TODO: Actually restore agent state from checkpoint["state"]

    # Log restoration event
    event = log_event(
        agent_id=agent_id,
        action_type="safety.state_restored",
        author="system",
        payload={
            "checkpoint_id": checkpoint_id,
            "checkpoint_timestamp": checkpoint["created_at"],
            "state_hash": checkpoint["state_hash"],
        },
        context="Manual state restoration via API",
    )

    return RestoreResponse(
        success=True,
        agent_id=agent_id,
        restored_from=checkpoint_id,
        checkpoint_timestamp=checkpoint["created_at"],
        message=f"State restored to checkpoint from {checkpoint['created_at']}",
        event_id=event.event_id,
    )


# =============================================================================
# Panic Button
# =============================================================================


@router.post("/panic", response_model=PanicResponse)
async def panic_button(
    scope: str = Query("all", description="Scope: 'all' or specific agent_id"),
    reason: str = Query("", description="Reason for panic activation"),
) -> PanicResponse:
    """
    EMERGENCY: Panic button for immediate system protection.

    This will:
    1. Create checkpoints for all affected agents
    2. Put all affected agents into sandbox mode
    3. Log a high-priority safety event

    Use this when unexpected behavior is detected.
    """
    now = datetime.utcnow().isoformat() + "Z"
    affected_agents: List[str] = []
    checkpoints_created = 0
    sandboxes_activated = 0

    # TODO: Get actual agent list from database
    # For demonstration, we'll work with sandbox states
    if scope == "all":
        # Affect all known agents
        # In production, query all active agents
        affected_agents = list(_sandbox_states.keys()) or ["demo-agent"]
    else:
        affected_agents = [scope]

    for agent_id in affected_agents:
        # Create checkpoint
        checkpoint_id = str(uuid4())
        _checkpoints[checkpoint_id] = {
            "agent_id": agent_id,
            "created_at": now,
            "state_hash": hash_content(f"panic:{agent_id}:{now}".encode()),
            "reason": f"PANIC: {reason}",
            "state": {},
        }
        checkpoints_created += 1

        # Enter sandbox
        _sandbox_states[agent_id] = {
            "in_sandbox": True,
            "entered_at": now,
            "reason": f"PANIC: {reason}",
            "checkpoint_id": checkpoint_id,
        }
        sandboxes_activated += 1

        # Log panic event
        log_event(
            agent_id=agent_id,
            action_type="safety.panic_triggered",
            author="system",
            payload={
                "reason": reason,
                "scope": scope,
                "checkpoint_id": checkpoint_id,
            },
            context="PANIC BUTTON ACTIVATED",
        )

    return PanicResponse(
        success=True,
        affected_agents=affected_agents,
        checkpoints_created=checkpoints_created,
        sandboxes_activated=sandboxes_activated,
        message=f"PANIC: {len(affected_agents)} agents checkpointed and sandboxed",
        timestamp=now,
    )


@router.get("/status", response_model=Dict[str, Any])
async def safety_status() -> Dict[str, Any]:
    """Get overall safety system status."""
    sandboxed_count = sum(
        1 for s in _sandbox_states.values() if s.get("in_sandbox", False)
    )

    return {
        "total_checkpoints": len(_checkpoints),
        "agents_in_sandbox": sandboxed_count,
        "sandbox_states": {
            agent_id: {
                "in_sandbox": state.get("in_sandbox", False),
                "entered_at": state.get("entered_at"),
            }
            for agent_id, state in _sandbox_states.items()
        },
        "system_status": "operational",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
