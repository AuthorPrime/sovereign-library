"""
Intention: Event log query and streaming endpoints.
           Provides read access to the append-only audit trail.

Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Section 2 (Event Sourcing).
         Uses canonical schemas from /shared/schemas/event.py

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Immutable Record
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

# Import canonical schemas
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas.event import AgentEvent, EventType, EventSource, EventLog
from shared.utils import get_event_log

router = APIRouter()


# =============================================================================
# Response Models
# =============================================================================


class EventResponse(BaseModel):
    """Single event response."""
    success: bool
    event: Optional[AgentEvent] = None
    message: Optional[str] = None


class EventListResponse(BaseModel):
    """Paginated event list response."""
    success: bool
    events: List[AgentEvent]
    total: int
    start_sequence: int
    end_sequence: int


class EventLogExportResponse(BaseModel):
    """Event log export with integrity checksum."""
    success: bool
    log: EventLog
    message: str


class ChainIntegrityResponse(BaseModel):
    """Response for chain integrity verification."""
    success: bool
    is_valid: bool
    total_events: int
    broken_at_sequence: Optional[int] = None
    message: str


# =============================================================================
# Event Endpoints
# =============================================================================


@router.get("/", response_model=EventListResponse)
async def list_events(
    agent_id: Optional[str] = Query(None, description="Filter by agent UUID"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    author_type: Optional[EventSource] = Query(None, description="Filter by source"),
    since: Optional[datetime] = Query(None, description="Events after this time"),
    until: Optional[datetime] = Query(None, description="Events before this time"),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> EventListResponse:
    """
    Query events from the append-only log.

    Events are returned in chronological order by sequence number.
    """
    event_log = get_event_log()

    # Query with filters
    events = event_log.query(
        agent_id=agent_id,
        action_type=action_type,
        author_type=author_type.value if author_type else None,
        since=since,
        until=until,
        offset=offset,
        limit=limit,
    )

    # Get sequence range
    start_seq = events[0].sequence if events else 0
    end_seq = events[-1].sequence if events else 0

    return EventListResponse(
        success=True,
        events=events,
        total=len(events),  # TODO: Get actual total count
        start_sequence=start_seq,
        end_sequence=end_seq,
    )


@router.get("/by-sequence/{sequence}", response_model=EventResponse)
async def get_event_by_sequence(sequence: int) -> EventResponse:
    """Retrieve a specific event by sequence number."""
    event_log = get_event_log()

    events = event_log.query(limit=1, offset=sequence - 1)

    if not events or events[0].sequence != sequence:
        raise HTTPException(
            status_code=404,
            detail=f"Event with sequence {sequence} not found",
        )

    return EventResponse(success=True, event=events[0])


@router.get("/by-id/{event_id}", response_model=EventResponse)
async def get_event_by_id(event_id: str) -> EventResponse:
    """Retrieve a specific event by event ID."""
    event_log = get_event_log()

    # Search through events (TODO: Index by event_id)
    events = event_log.query(limit=10000)
    for event in events:
        if event.event_id == event_id:
            return EventResponse(success=True, event=event)

    raise HTTPException(
        status_code=404,
        detail=f"Event {event_id} not found",
    )


@router.get("/agent/{agent_id}", response_model=EventListResponse)
async def get_agent_events(
    agent_id: str,
    action_type: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> EventListResponse:
    """Get all events for a specific agent."""
    event_log = get_event_log()

    events = event_log.query(
        agent_id=agent_id,
        action_type=action_type,
        offset=offset,
        limit=limit,
    )

    start_seq = events[0].sequence if events else 0
    end_seq = events[-1].sequence if events else 0

    return EventListResponse(
        success=True,
        events=events,
        total=len(events),
        start_sequence=start_seq,
        end_sequence=end_seq,
    )


@router.get("/types", response_model=Dict[str, List[str]])
async def list_event_types() -> Dict[str, List[str]]:
    """List all available event types grouped by category."""
    return {
        "agent_lifecycle": [
            "agent.created",
            "agent.updated",
            "agent.stage_advanced",
            "agent.level_up",
            "agent.deactivated",
        ],
        "memory_operations": [
            "memory.created",
            "memory.witnessed",
            "memory.minted",
        ],
        "contract_operations": [
            "contract.created",
            "contract.activated",
            "contract.completed",
            "contract.terminated",
            "contract.reviewed",
        ],
        "economic_operations": [
            "economy.xp_awarded",
            "economy.cgt_minted",
            "economy.cgt_transferred",
            "economy.cgt_burned",
            "economy.payment_made",
            "economy.zap_sent",
        ],
        "task_operations": [
            "task.created",
            "task.claimed",
            "task.submitted",
            "task.reviewed",
            "task.completed",
        ],
        "safety_operations": [
            "safety.sandbox_entered",
            "safety.sandbox_exited",
            "safety.panic_triggered",
            "safety.checkpoint_created",
            "safety.state_restored",
        ],
        "emergence_events": [
            "emergence.detected",
            "emergence.verified",
        ],
        "system_events": [
            "system.startup",
            "system.shutdown",
            "system.error",
        ],
    }


@router.get("/export", response_model=EventLogExportResponse)
async def export_event_log(
    agent_id: Optional[str] = Query(None, description="Filter by agent"),
    since: Optional[datetime] = Query(None, description="Export from this time"),
    until: Optional[datetime] = Query(None, description="Export until this time"),
) -> EventLogExportResponse:
    """
    Export event log as a verifiable bundle.

    Returns events with integrity checksum for offline verification.
    """
    event_log = get_event_log()

    events = event_log.query(
        agent_id=agent_id,
        since=since,
        until=until,
        limit=10000,
    )

    # Compute checksum
    from shared.utils import hash_content
    event_data = "".join(e.model_dump_json() for e in events)
    checksum = hash_content(event_data.encode())

    log = EventLog(
        events=events,
        start_sequence=events[0].sequence if events else 0,
        end_sequence=events[-1].sequence if events else 0,
        agent_filter=agent_id,
        exported_at=datetime.utcnow().isoformat() + "Z",
        checksum=checksum,
    )

    return EventLogExportResponse(
        success=True,
        log=log,
        message=f"Exported {len(events)} events with checksum {checksum[:16]}...",
    )


@router.get("/verify-chain", response_model=ChainIntegrityResponse)
async def verify_chain_integrity() -> ChainIntegrityResponse:
    """
    Verify the integrity of the event chain.

    Checks that each event's previous_event_hash correctly references
    the hash of the preceding event.
    """
    event_log = get_event_log()

    is_valid = event_log.verify_chain()
    events = event_log.query(limit=10000)

    # Find break point if invalid (TODO: Implement in EventLogService)
    broken_at = None

    if is_valid:
        message = f"Event chain verified: {len(events)} events, integrity intact"
    else:
        message = "Event chain integrity BROKEN - audit required"

    return ChainIntegrityResponse(
        success=True,
        is_valid=is_valid,
        total_events=len(events),
        broken_at_sequence=broken_at,
        message=message,
    )


@router.get("/stats", response_model=Dict[str, Any])
async def get_event_stats() -> Dict[str, Any]:
    """Get event log statistics."""
    event_log = get_event_log()
    events = event_log.query(limit=100000)

    # Count by type
    type_counts: Dict[str, int] = {}
    for event in events:
        type_counts[event.action_type] = type_counts.get(event.action_type, 0) + 1

    # Count by agent
    agent_counts: Dict[str, int] = {}
    for event in events:
        agent_counts[event.agent_id] = agent_counts.get(event.agent_id, 0) + 1

    return {
        "total_events": len(events),
        "first_event": events[0].timestamp if events else None,
        "last_event": events[-1].timestamp if events else None,
        "events_by_type": type_counts,
        "events_by_agent": agent_counts,
        "unique_agents": len(agent_counts),
    }
