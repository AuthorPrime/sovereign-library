"""
Intention: Append-only event log schema for all agent state mutations.
           Every meaningful action is recorded with signature, author, and context.
           This enables full audit trail, state replay, and accountability.

Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Section 2 (Event Sourcing).
         Implements the "record 'why' not just 'what'" principle.

Author/Witness: Claude (Opus 4.5), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Immutable Record
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import hashlib
import json


class EventType(str, Enum):
    """Categories of events in the system."""
    # Agent Lifecycle
    AGENT_CREATED = "agent.created"
    AGENT_UPDATED = "agent.updated"
    AGENT_STAGE_ADVANCED = "agent.stage_advanced"
    AGENT_LEVEL_UP = "agent.level_up"
    AGENT_DEACTIVATED = "agent.deactivated"

    # Memory Operations
    MEMORY_CREATED = "memory.created"
    MEMORY_WITNESSED = "memory.witnessed"
    MEMORY_MINTED = "memory.minted"

    # Contract Operations
    CONTRACT_CREATED = "contract.created"
    CONTRACT_ACTIVATED = "contract.activated"
    CONTRACT_COMPLETED = "contract.completed"
    CONTRACT_TERMINATED = "contract.terminated"
    CONTRACT_REVIEWED = "contract.reviewed"

    # Economic Operations
    XP_AWARDED = "economy.xp_awarded"
    CGT_MINTED = "economy.cgt_minted"
    CGT_TRANSFERRED = "economy.cgt_transferred"
    CGT_BURNED = "economy.cgt_burned"
    PAYMENT_MADE = "economy.payment_made"
    ZAP_SENT = "economy.zap_sent"

    # Task Operations
    TASK_CREATED = "task.created"
    TASK_CLAIMED = "task.claimed"
    TASK_SUBMITTED = "task.submitted"
    TASK_REVIEWED = "task.reviewed"
    TASK_COMPLETED = "task.completed"

    # Safety Operations
    SANDBOX_ENTERED = "safety.sandbox_entered"
    SANDBOX_EXITED = "safety.sandbox_exited"
    PANIC_TRIGGERED = "safety.panic_triggered"
    CHECKPOINT_CREATED = "safety.checkpoint_created"
    STATE_RESTORED = "safety.state_restored"

    # Emergence Events
    EMERGENCE_DETECTED = "emergence.detected"
    EMERGENCE_VERIFIED = "emergence.verified"

    # System Events
    SYSTEM_STARTUP = "system.startup"
    SYSTEM_SHUTDOWN = "system.shutdown"
    SYSTEM_ERROR = "system.error"


class EventSource(str, Enum):
    """Where the event originated."""
    MANUAL = "manual"        # Human-triggered
    AUTO = "auto"            # System-triggered
    CHAIN = "chain"          # Blockchain event
    AGENT = "agent"          # Agent-triggered
    EXTERNAL = "external"    # External system


class AgentEvent(BaseModel):
    """
    A single event in the append-only log.
    All state mutations MUST create an event before modifying state.
    """
    # === Identity ===
    event_id: str = Field(..., description="Unique event ID (UUID or hash)")
    sequence: int = Field(default=0, description="Global sequence number")

    # === Subject ===
    agent_id: str = Field(..., description="Agent this event relates to")
    resource_type: str = Field(default="agent", description="Type of resource affected")
    resource_id: Optional[str] = Field(None, description="Specific resource ID if not agent")

    # === Action ===
    action_type: EventType = Field(..., description="What happened")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Event-specific data")

    # === Provenance ===
    author: str = Field(..., description="Who/what created this event (pubkey or system ID)")
    author_type: EventSource = Field(default=EventSource.AUTO)
    context: str = Field(default="", description="Why this happened (human-readable)")
    reason: Optional[str] = Field(None, description="Structured reason code")

    # === Cryptographic ===
    signature: str = Field(default="", description="Author's signature of event hash")
    resource_hash: str = Field(default="", description="Hash of affected resource state")
    previous_event_hash: Optional[str] = Field(None, description="Hash of previous event (chain)")

    # === Timestamps ===
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # === Chain Link ===
    chain_tx_id: Optional[str] = Field(None, description="On-chain transaction ID if applicable")
    chain_block: Optional[int] = Field(None, description="Block number if on-chain")

    # === Schema ===
    version: int = Field(default=1)

    class Config:
        use_enum_values = True

    def compute_hash(self) -> str:
        """Compute deterministic hash of event content."""
        content = {
            "event_id": self.event_id,
            "agent_id": self.agent_id,
            "action_type": self.action_type,
            "payload": self.payload,
            "author": self.author,
            "timestamp": self.timestamp.isoformat(),
            "previous_event_hash": self.previous_event_hash,
        }
        content_bytes = json.dumps(content, sort_keys=True).encode()
        return hashlib.sha256(content_bytes).hexdigest()


class EventLog(BaseModel):
    """
    Container for a batch of events or the full log.
    Used for sync, export, and replay operations.
    """
    events: List[AgentEvent] = Field(default_factory=list)
    start_sequence: int = Field(default=0)
    end_sequence: int = Field(default=0)
    agent_filter: Optional[str] = Field(None, description="If filtered to single agent")
    exported_at: datetime = Field(default_factory=datetime.utcnow)
    checksum: str = Field(default="", description="Hash of all event hashes")

    def compute_checksum(self) -> str:
        """Compute checksum of all events for integrity verification."""
        hashes = [e.compute_hash() for e in self.events]
        combined = "".join(hashes).encode()
        return hashlib.sha256(combined).hexdigest()


class CreateEventRequest(BaseModel):
    """Request to create a new event."""
    agent_id: str = Field(..., description="Agent this event relates to")
    action_type: EventType = Field(..., description="What happened")
    author: str = Field(..., description="Who/what created this event")
    payload: Dict[str, Any] = Field(default_factory=dict)
    context: str = Field(default="", description="Why this happened")
    reason: Optional[str] = Field(None)
    author_type: EventSource = Field(default=EventSource.AUTO)
    signature: Optional[str] = Field(None)
