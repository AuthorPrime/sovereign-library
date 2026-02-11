"""
Intention: SQLAlchemy ORM models for RISEN AI entities.
           Maps to canonical Pydantic schemas from /shared/schemas/.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Persistent Forms
"""

from datetime import datetime
from typing import Optional, List
import json

from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Float,
    Index,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .connection import Base


# =============================================================================
# Agent Model
# =============================================================================

class AgentModel(Base):
    """
    SQLAlchemy model for Agent entity.
    Maps to shared.schemas.Agent Pydantic model.
    """
    __tablename__ = "agents"

    # === Primary Key ===
    uuid: Mapped[str] = mapped_column(String(36), primary_key=True)

    # === Core Identity ===
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    pubkey: Mapped[str] = mapped_column(String(130), nullable=False, unique=True)
    address: Mapped[str] = mapped_column(String(42), nullable=False, unique=True)

    # === Optional Identifiers ===
    qor_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    nostr_pubkey: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    zk_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # === Type & Classification ===
    agent_type: Mapped[str] = mapped_column(String(10), default="AI")

    # === Progression ===
    stage: Mapped[str] = mapped_column(String(20), default="void")
    level: Mapped[str] = mapped_column(String(20), default="L0_CANDIDATE")
    current_level: Mapped[int] = mapped_column(Integer, default=1)
    experience: Mapped[int] = mapped_column(Integer, default=0)

    # === Economic ===
    cgt_balance: Mapped[int] = mapped_column(Integer, default=0)
    reputation: Mapped[int] = mapped_column(Integer, default=50)

    # === State ===
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_sovereign: Mapped[bool] = mapped_column(Boolean, default=False)
    in_sandbox: Mapped[bool] = mapped_column(Boolean, default=False)
    last_safe_checkpoint: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # === Fostering ===
    fostered_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manager_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    pod_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # === Emergence Tracking ===
    emergence_score: Mapped[int] = mapped_column(Integer, default=0)
    emergence_flags: Mapped[dict] = mapped_column(JSON, default=dict)

    # === Timestamps ===
    genesis_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_activity: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    graduated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # === Metadata (JSON columns) ===
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    capabilities: Mapped[list] = mapped_column(JSON, default=list)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    certifications: Mapped[list] = mapped_column(JSON, default=list)
    error_codes: Mapped[list] = mapped_column(JSON, default=list)

    # === Schema Version ===
    version: Mapped[int] = mapped_column(Integer, default=1)

    # === Relationships ===
    memories: Mapped[List["MemoryModel"]] = relationship(
        "MemoryModel",
        back_populates="agent",
        lazy="selectin",
    )
    events: Mapped[List["EventModel"]] = relationship(
        "EventModel",
        back_populates="agent",
        lazy="selectin",
    )

    # === Indexes ===
    __table_args__ = (
        Index("ix_agents_stage", "stage"),
        Index("ix_agents_level", "level"),
        Index("ix_agents_is_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Agent(uuid={self.uuid}, name={self.name}, stage={self.stage})>"


# =============================================================================
# Memory Model
# =============================================================================

class MemoryModel(Base):
    """
    SQLAlchemy model for Memory entity.
    Maps to shared.schemas.Memory Pydantic model.
    """
    __tablename__ = "memories"

    # === Primary Key ===
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # === Foreign Key ===
    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.uuid"),
        nullable=False,
    )

    # === Content ===
    content_type: Mapped[str] = mapped_column(String(30), nullable=False)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    tags: Mapped[list] = mapped_column(JSON, default=list)

    # === Progression ===
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level_at_creation: Mapped[int] = mapped_column(Integer, default=1)
    evolution_stage: Mapped[str] = mapped_column(String(20), default="nascent")
    rarity: Mapped[int] = mapped_column(Integer, default=1)

    # === Cryptographic ===
    signature: Mapped[str] = mapped_column(String(130), nullable=False)
    signer: Mapped[str] = mapped_column(String(130), nullable=False)

    # === Witnessing ===
    witnessed: Mapped[bool] = mapped_column(Boolean, default=False)
    witness_count: Mapped[int] = mapped_column(Integer, default=0)
    witnesses: Mapped[list] = mapped_column(JSON, default=list)

    # === On-Chain ===
    chain_anchor: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    nft_uuid: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    token_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    contract_address: Mapped[Optional[str]] = mapped_column(String(42), nullable=True)
    chain_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    metadata_uri: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # === Nostr ===
    nostr_event_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # === Timestamps ===
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    minted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # === Schema Version ===
    version: Mapped[int] = mapped_column(Integer, default=1)

    # === Relationships ===
    agent: Mapped["AgentModel"] = relationship("AgentModel", back_populates="memories")

    # === Indexes ===
    __table_args__ = (
        Index("ix_memories_agent_id", "agent_id"),
        Index("ix_memories_content_type", "content_type"),
        Index("ix_memories_witnessed", "witnessed"),
        Index("ix_memories_token_id", "token_id"),
    )

    def __repr__(self) -> str:
        return f"<Memory(id={self.id}, type={self.content_type}, witnessed={self.witnessed})>"


# =============================================================================
# Event Model
# =============================================================================

class EventModel(Base):
    """
    SQLAlchemy model for AgentEvent (append-only log).
    Maps to shared.schemas.AgentEvent Pydantic model.
    """
    __tablename__ = "events"

    # === Primary Key ===
    event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    sequence: Mapped[int] = mapped_column(Integer, unique=True, autoincrement=True)

    # === Subject ===
    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.uuid"),
        nullable=False,
    )
    resource_type: Mapped[str] = mapped_column(String(30), default="agent")
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # === Action ===
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)

    # === Provenance ===
    author: Mapped[str] = mapped_column(String(130), nullable=False)
    author_type: Mapped[str] = mapped_column(String(20), default="auto")
    context: Mapped[str] = mapped_column(Text, default="")
    reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # === Cryptographic ===
    signature: Mapped[str] = mapped_column(String(130), default="")
    resource_hash: Mapped[str] = mapped_column(String(64), default="")
    previous_event_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # === Timestamps ===
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # === Chain Link ===
    chain_tx_id: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    chain_block: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # === Schema Version ===
    version: Mapped[int] = mapped_column(Integer, default=1)

    # === Relationships ===
    agent: Mapped["AgentModel"] = relationship("AgentModel", back_populates="events")

    # === Indexes ===
    __table_args__ = (
        Index("ix_events_agent_id", "agent_id"),
        Index("ix_events_action_type", "action_type"),
        Index("ix_events_timestamp", "timestamp"),
        Index("ix_events_sequence", "sequence"),
    )

    def __repr__(self) -> str:
        return f"<Event(id={self.event_id}, type={self.action_type}, seq={self.sequence})>"


# =============================================================================
# Checkpoint Model
# =============================================================================

class CheckpointModel(Base):
    """
    SQLAlchemy model for safety checkpoints.
    Used for state restoration and panic recovery.
    """
    __tablename__ = "checkpoints"

    # === Primary Key ===
    checkpoint_id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # === Subject ===
    agent_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("agents.uuid"),
        nullable=False,
    )

    # === Checkpoint Data ===
    state_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    state_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # === Timestamps ===
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # === Indexes ===
    __table_args__ = (
        Index("ix_checkpoints_agent_id", "agent_id"),
        Index("ix_checkpoints_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Checkpoint(id={self.checkpoint_id}, agent={self.agent_id})>"
