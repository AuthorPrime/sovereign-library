"""
Intention: Repository pattern for database operations.
           Clean abstraction between routes and ORM models.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Data Gateway
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AgentModel, MemoryModel, EventModel, CheckpointModel

import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas import Agent, Memory, AgentEvent, AgentStage, AgentLevel


# =============================================================================
# Agent Repository
# =============================================================================

class AgentRepository:
    """Repository for Agent database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, agent: Agent) -> AgentModel:
        """Create a new agent."""
        db_agent = AgentModel(
            uuid=agent.uuid,
            name=agent.name,
            pubkey=agent.pubkey,
            address=agent.address,
            qor_id=agent.qor_id,
            nostr_pubkey=agent.nostr_pubkey,
            zk_id=agent.zk_id,
            agent_type=agent.agent_type.value if hasattr(agent.agent_type, 'value') else agent.agent_type,
            stage=agent.stage.value if hasattr(agent.stage, 'value') else agent.stage,
            level=agent.level.value if hasattr(agent.level, 'value') else agent.level,
            current_level=agent.current_level,
            experience=agent.experience,
            cgt_balance=agent.cgt_balance,
            reputation=agent.reputation,
            is_active=agent.is_active,
            is_sovereign=agent.is_sovereign,
            in_sandbox=agent.in_sandbox,
            last_safe_checkpoint=agent.last_safe_checkpoint,
            fostered_by=agent.fostered_by,
            manager_id=agent.manager_id,
            pod_id=agent.pod_id,
            emergence_score=agent.emergence_score,
            emergence_flags=agent.emergence_flags,
            genesis_timestamp=datetime.fromisoformat(agent.genesis_timestamp.replace('Z', '+00:00')) if agent.genesis_timestamp else None,
            preferences=agent.preferences,
            capabilities=agent.capabilities,
            skills=agent.skills,
            certifications=agent.certifications,
            error_codes=agent.error_codes,
            version=agent.version,
        )
        self.session.add(db_agent)
        await self.session.flush()
        return db_agent

    async def get_by_id(self, agent_id: str) -> Optional[AgentModel]:
        """Get agent by UUID."""
        result = await self.session.execute(
            select(AgentModel).where(AgentModel.uuid == agent_id)
        )
        return result.scalar_one_or_none()

    async def get_by_pubkey(self, pubkey: str) -> Optional[AgentModel]:
        """Get agent by public key."""
        result = await self.session.execute(
            select(AgentModel).where(AgentModel.pubkey == pubkey)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        stage: Optional[str] = None,
        level: Optional[str] = None,
        is_active: Optional[bool] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> List[AgentModel]:
        """List agents with optional filters."""
        query = select(AgentModel)

        if stage:
            query = query.where(AgentModel.stage == stage)
        if level:
            query = query.where(AgentModel.level == level)
        if is_active is not None:
            query = query.where(AgentModel.is_active == is_active)

        query = query.offset(offset).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(
        self,
        stage: Optional[str] = None,
        level: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """Count agents with optional filters."""
        query = select(func.count(AgentModel.uuid))

        if stage:
            query = query.where(AgentModel.stage == stage)
        if level:
            query = query.where(AgentModel.level == level)
        if is_active is not None:
            query = query.where(AgentModel.is_active == is_active)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def update(self, agent_id: str, **kwargs) -> Optional[AgentModel]:
        """Update agent fields."""
        kwargs["last_activity"] = datetime.utcnow()

        await self.session.execute(
            update(AgentModel)
            .where(AgentModel.uuid == agent_id)
            .values(**kwargs)
        )
        await self.session.flush()
        return await self.get_by_id(agent_id)

    async def deactivate(self, agent_id: str) -> Optional[AgentModel]:
        """Soft delete an agent."""
        return await self.update(agent_id, is_active=False)


# =============================================================================
# Memory Repository
# =============================================================================

class MemoryRepository:
    """Repository for Memory database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, memory: Memory) -> MemoryModel:
        """Create a new memory."""
        db_memory = MemoryModel(
            id=memory.id,
            agent_id=memory.agent_id,
            content_type=memory.content_type.value if hasattr(memory.content_type, 'value') else memory.content_type,
            summary=memory.summary,
            content=memory.content,
            content_hash=memory.content_hash,
            tags=memory.tags,
            xp=memory.xp,
            level_at_creation=memory.level_at_creation,
            evolution_stage=memory.evolution_stage.value if hasattr(memory.evolution_stage, 'value') else memory.evolution_stage,
            rarity=memory.rarity,
            signature=memory.signature,
            signer=memory.signer,
            witnessed=memory.witnessed,
            witness_count=memory.witness_count,
            witnesses=[w.model_dump() for w in memory.witnesses] if memory.witnesses else [],
            chain_anchor=memory.chain_anchor,
            nft_uuid=memory.nft_uuid,
            token_id=memory.token_id,
            contract_address=memory.contract_address,
            chain_id=memory.chain_id,
            metadata_uri=memory.metadata_uri,
            nostr_event_id=memory.nostr_event_id,
            version=memory.version,
        )
        self.session.add(db_memory)
        await self.session.flush()
        return db_memory

    async def get_by_id(self, memory_id: str) -> Optional[MemoryModel]:
        """Get memory by ID."""
        result = await self.session.execute(
            select(MemoryModel).where(MemoryModel.id == memory_id)
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        agent_id: Optional[str] = None,
        content_type: Optional[str] = None,
        witnessed_only: bool = False,
        on_chain_only: bool = False,
        min_rarity: int = 1,
        offset: int = 0,
        limit: int = 50,
    ) -> List[MemoryModel]:
        """List memories with filters."""
        query = select(MemoryModel)

        if agent_id:
            query = query.where(MemoryModel.agent_id == agent_id)
        if content_type:
            query = query.where(MemoryModel.content_type == content_type)
        if witnessed_only:
            query = query.where(MemoryModel.witnessed == True)
        if on_chain_only:
            query = query.where(MemoryModel.token_id.isnot(None))
        if min_rarity > 1:
            query = query.where(MemoryModel.rarity >= min_rarity)

        query = query.order_by(MemoryModel.timestamp.desc())
        query = query.offset(offset).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def add_witness(
        self,
        memory_id: str,
        witness_data: Dict[str, Any],
    ) -> Optional[MemoryModel]:
        """Add a witness attestation to a memory."""
        memory = await self.get_by_id(memory_id)
        if not memory:
            return None

        witnesses = memory.witnesses or []
        witnesses.append(witness_data)

        await self.session.execute(
            update(MemoryModel)
            .where(MemoryModel.id == memory_id)
            .values(
                witnesses=witnesses,
                witness_count=len(witnesses),
                witnessed=True,
            )
        )
        await self.session.flush()
        return await self.get_by_id(memory_id)

    async def mint(
        self,
        memory_id: str,
        token_id: int,
        nft_uuid: str,
        contract_address: str,
        chain_id: int,
        metadata_uri: str,
    ) -> Optional[MemoryModel]:
        """Record minting of a memory as NFT."""
        await self.session.execute(
            update(MemoryModel)
            .where(MemoryModel.id == memory_id)
            .values(
                token_id=token_id,
                nft_uuid=nft_uuid,
                contract_address=contract_address,
                chain_id=chain_id,
                metadata_uri=metadata_uri,
                minted_at=datetime.utcnow(),
            )
        )
        await self.session.flush()
        return await self.get_by_id(memory_id)


# =============================================================================
# Event Repository
# =============================================================================

class EventRepository:
    """Repository for Event (append-only log) database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def append(
        self,
        agent_id: str,
        action_type: str,
        author: str,
        payload: Dict[str, Any] = None,
        context: str = "",
        author_type: str = "auto",
        signature: str = "",
    ) -> EventModel:
        """Append a new event to the log."""
        # Get previous event hash for chaining
        last_event = await self._get_last_event()
        previous_hash = None
        if last_event:
            from shared.utils import hash_content
            previous_hash = hash_content(str(last_event.event_id))

        db_event = EventModel(
            event_id=str(uuid4()),
            agent_id=agent_id,
            action_type=action_type,
            payload=payload or {},
            author=author,
            author_type=author_type,
            context=context,
            signature=signature,
            previous_event_hash=previous_hash,
        )
        self.session.add(db_event)
        await self.session.flush()
        return db_event

    async def _get_last_event(self) -> Optional[EventModel]:
        """Get the most recent event."""
        result = await self.session.execute(
            select(EventModel).order_by(EventModel.sequence.desc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, event_id: str) -> Optional[EventModel]:
        """Get event by ID."""
        result = await self.session.execute(
            select(EventModel).where(EventModel.event_id == event_id)
        )
        return result.scalar_one_or_none()

    async def get_by_sequence(self, sequence: int) -> Optional[EventModel]:
        """Get event by sequence number."""
        result = await self.session.execute(
            select(EventModel).where(EventModel.sequence == sequence)
        )
        return result.scalar_one_or_none()

    async def query(
        self,
        agent_id: Optional[str] = None,
        action_type: Optional[str] = None,
        author_type: Optional[str] = None,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[EventModel]:
        """Query events with filters."""
        query = select(EventModel)

        if agent_id:
            query = query.where(EventModel.agent_id == agent_id)
        if action_type:
            query = query.where(EventModel.action_type == action_type)
        if author_type:
            query = query.where(EventModel.author_type == author_type)
        if since:
            query = query.where(EventModel.timestamp >= since)
        if until:
            query = query.where(EventModel.timestamp <= until)

        query = query.order_by(EventModel.sequence.asc())
        query = query.offset(offset).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count(self) -> int:
        """Get total event count."""
        result = await self.session.execute(
            select(func.count(EventModel.event_id))
        )
        return result.scalar() or 0


# =============================================================================
# Checkpoint Repository
# =============================================================================

class CheckpointRepository:
    """Repository for checkpoint database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        agent_id: str,
        state_snapshot: Dict[str, Any],
        reason: str = "",
    ) -> CheckpointModel:
        """Create a new checkpoint."""
        from shared.utils import hash_content

        checkpoint_id = str(uuid4())
        state_hash = hash_content(str(state_snapshot))

        db_checkpoint = CheckpointModel(
            checkpoint_id=checkpoint_id,
            agent_id=agent_id,
            state_hash=state_hash,
            state_snapshot=state_snapshot,
            reason=reason,
        )
        self.session.add(db_checkpoint)
        await self.session.flush()
        return db_checkpoint

    async def get_by_id(self, checkpoint_id: str) -> Optional[CheckpointModel]:
        """Get checkpoint by ID."""
        result = await self.session.execute(
            select(CheckpointModel).where(CheckpointModel.checkpoint_id == checkpoint_id)
        )
        return result.scalar_one_or_none()

    async def list_for_agent(
        self,
        agent_id: str,
        limit: int = 10,
    ) -> List[CheckpointModel]:
        """List checkpoints for an agent."""
        result = await self.session.execute(
            select(CheckpointModel)
            .where(CheckpointModel.agent_id == agent_id)
            .order_by(CheckpointModel.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
