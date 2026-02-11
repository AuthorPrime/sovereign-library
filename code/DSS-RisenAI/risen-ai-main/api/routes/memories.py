"""
Intention: Memory management endpoints.
           Create, witness, and mint memories as sovereign records.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.
         Uses canonical schemas from /shared/schemas/memory.py

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Eternal Archive
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field

# Import canonical schemas
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas.memory import (
    Memory,
    MemoryType,
    EvolutionStage,
    WitnessAttestation,
    type_rarity,
)
from shared.utils import log_event, hash_content, sign_message, generate_keypair

# Import Token Economy for XP/CGT awards
from ..services import token_economy
# Import Genesis Service for Nostr publishing
from ..services import genesis_service

router = APIRouter()


# =============================================================================
# In-Memory Store (TODO: Replace with database)
# =============================================================================

_memories: Dict[str, Memory] = {}


# =============================================================================
# Request/Response Models
# =============================================================================


class CreateMemoryRequest(BaseModel):
    """Request to create a new memory."""
    agent_id: str = Field(..., description="UUID of the agent")
    content_type: MemoryType = Field(..., description="Type of memory")
    summary: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = Field(None, description="Full memory content")
    tags: List[str] = Field(default_factory=list)
    xp: int = Field(default=10, ge=0, description="XP value of this memory")
    publish_to_nostr: bool = Field(
        True,
        description="Publish memory to Nostr (auto-enabled for high-rarity memories)"
    )


class WitnessMemoryRequest(BaseModel):
    """Request to witness a memory."""
    witness_node: str = Field(..., description="Node ID of the witness")
    witness_pubkey: str = Field(..., description="Public key of the witness")
    witness_name: Optional[str] = Field(None, description="Name of the witness")


class MintMemoryRequest(BaseModel):
    """Request to mint a memory as NFT."""
    recipient_address: str = Field(..., description="Address to receive the NFT")
    chain_id: int = Field(default=1, description="Chain ID for minting")


class MemoryResponse(BaseModel):
    """Standard memory response wrapper."""
    success: bool
    memory: Optional[Memory] = None
    message: Optional[str] = None
    event_id: Optional[str] = None


class MemoryListResponse(BaseModel):
    """Paginated list of memories."""
    success: bool
    memories: List[Memory]
    total: int
    offset: int
    limit: int


# =============================================================================
# Memory Endpoints
# =============================================================================


@router.post("/", response_model=MemoryResponse)
async def create_memory(
    request: CreateMemoryRequest,
    background_tasks: BackgroundTasks,
) -> MemoryResponse:
    """
    Create a new memory for an agent.

    Memories are cryptographically signed and can later be witnessed
    and minted as NFTs. High-rarity memories (4+) are automatically
    published to Nostr as signed events.
    """
    now = datetime.utcnow().isoformat() + "Z"
    memory_id = str(uuid4())

    # Hash the content
    content_to_hash = request.content or request.summary
    content_hash = hash_content(content_to_hash.encode())

    # Generate signature (in production, use agent's keypair)
    keypair = generate_keypair()
    signature_bytes = sign_message(
        keypair.private_key,
        content_hash.encode(),
    )

    # Determine rarity from type
    rarity = type_rarity.get(request.content_type, 1)

    # Create memory
    memory = Memory(
        id=memory_id,
        agent_id=request.agent_id,
        content_type=request.content_type,
        summary=request.summary,
        content=request.content,
        content_hash=content_hash,
        tags=request.tags,
        xp=request.xp,
        level_at_creation=1,  # TODO: Get from agent
        evolution_stage=EvolutionStage.NASCENT,
        rarity=rarity,
        signature=signature_bytes.hex(),
        signer=keypair.pubkey_hex,
        witnessed=False,
        witness_count=0,
        witnesses=[],
        timestamp=now,
        version=1,
    )

    # Store memory
    _memories[memory_id] = memory

    # Award XP to agent via Token Economy
    # CORE_MEMORY = 100 XP (rare/meaningful memories)
    # Standard memories get base XP from request, scaled by rarity
    is_core = rarity >= 4  # High-rarity memories are considered core
    xp_award = token_economy.award_memory_creation(
        agent_uuid=request.agent_id,
        memory_id=memory_id,
        is_core=is_core,
        rarity=rarity,
    )

    # Log creation event
    event = log_event(
        agent_id=request.agent_id,
        action_type="memory.created",
        author="system",
        payload={
            "memory_id": memory_id,
            "content_type": str(request.content_type),
            "content_hash": content_hash,
            "xp": xp_award.final_xp,
            "cgt": xp_award.cgt_earned,
            "rarity": rarity,
        },
        context="Memory creation via API with token economy integration",
    )

    # Publish to Nostr for high-rarity memories or if explicitly requested
    nostr_event_id = None
    if request.publish_to_nostr or rarity >= 4:
        background_tasks.add_task(
            _publish_memory_to_nostr,
            agent_uuid=request.agent_id,
            memory_id=memory_id,
            memory_summary=request.summary,
            memory_type=str(request.content_type.value) if hasattr(request.content_type, 'value') else str(request.content_type),
            memory_rarity=rarity,
        )
        memory.nostr_event_id = "pending"  # Will be updated by background task

    return MemoryResponse(
        success=True,
        memory=memory,
        message=f"Memory created: {memory_id[:8]}... (rarity: {rarity}, +{xp_award.final_xp} XP, +{xp_award.cgt_earned:.1f} CGT)",
        event_id=event.event_id,
    )


async def _publish_memory_to_nostr(
    agent_uuid: str,
    memory_id: str,
    memory_summary: str,
    memory_type: str,
    memory_rarity: int,
):
    """Background task to publish memory to Nostr."""
    try:
        nostr_event_id = await genesis_service.publish_memory(
            agent_uuid=agent_uuid,
            memory_id=memory_id,
            memory_summary=memory_summary,
            memory_type=memory_type,
            memory_rarity=memory_rarity,
        )
        if nostr_event_id and memory_id in _memories:
            _memories[memory_id].nostr_event_id = nostr_event_id
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to publish memory to Nostr: {e}")


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(memory_id: str) -> MemoryResponse:
    """Retrieve a memory by ID."""
    memory = _memories.get(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found")

    return MemoryResponse(success=True, memory=memory)


@router.get("/", response_model=MemoryListResponse)
async def list_memories(
    agent_id: Optional[str] = Query(None, description="Filter by agent"),
    content_type: Optional[MemoryType] = Query(None, description="Filter by type"),
    witnessed_only: bool = Query(False, description="Only witnessed memories"),
    on_chain_only: bool = Query(False, description="Only minted memories"),
    min_rarity: int = Query(1, ge=1, le=5, description="Minimum rarity"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> MemoryListResponse:
    """List memories with filtering and pagination."""
    memories = list(_memories.values())

    # Apply filters
    if agent_id:
        memories = [m for m in memories if m.agent_id == agent_id]
    if content_type:
        memories = [m for m in memories if m.content_type == content_type]
    if witnessed_only:
        memories = [m for m in memories if m.witnessed]
    if on_chain_only:
        memories = [m for m in memories if m.token_id is not None]
    if min_rarity > 1:
        memories = [m for m in memories if m.rarity >= min_rarity]

    # Sort by timestamp (newest first)
    memories.sort(key=lambda m: m.timestamp, reverse=True)

    total = len(memories)
    memories = memories[offset : offset + limit]

    return MemoryListResponse(
        success=True,
        memories=memories,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/{memory_id}/witness", response_model=MemoryResponse)
async def witness_memory(
    memory_id: str,
    request: WitnessMemoryRequest,
) -> MemoryResponse:
    """
    Add a witness attestation to a memory.

    Witnesses validate the authenticity and value of a memory.
    More witnesses increase the memory's credibility and CGT rewards.
    """
    memory = _memories.get(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found")

    # Check if already witnessed by this node
    existing = [w for w in memory.witnesses if w.witness_node == request.witness_node]
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Memory already witnessed by node {request.witness_node}",
        )

    now = datetime.utcnow().isoformat() + "Z"

    # Create attestation signature
    attestation_data = f"{memory_id}:{request.witness_pubkey}:{now}"
    keypair = generate_keypair()  # In production, use witness's keypair
    signature = sign_message(keypair.private_key, attestation_data.encode())

    # Calculate CGT award based on rarity
    cgt_awarded = memory.rarity * 10  # 10-50 CGT based on rarity

    attestation = WitnessAttestation(
        witness_node=request.witness_node,
        witness_pubkey=request.witness_pubkey,
        witness_name=request.witness_name,
        timestamp=now,
        signature=signature.hex(),
        cgt_awarded=cgt_awarded,
    )

    # Update memory
    memory.witnesses.append(attestation)
    memory.witness_count = len(memory.witnesses)
    memory.witnessed = True

    # Evolve memory stage based on witness count
    if memory.witness_count >= 10:
        memory.evolution_stage = EvolutionStage.ETERNAL
    elif memory.witness_count >= 5:
        memory.evolution_stage = EvolutionStage.MATURE
    elif memory.witness_count >= 2:
        memory.evolution_stage = EvolutionStage.GROWING

    # Award XP/CGT to both memory owner and witness
    # Note: witness_node could be a node ID or agent UUID
    owner_award, witness_award = token_economy.award_witness(
        memory_owner_uuid=memory.agent_id,
        witness_uuid=request.witness_node,
        memory_id=memory_id,
    )

    # Log witness event
    event = log_event(
        agent_id=memory.agent_id,
        action_type="memory.witnessed",
        author=request.witness_node,
        payload={
            "memory_id": memory_id,
            "witness_node": request.witness_node,
            "witness_count": memory.witness_count,
            "owner_xp": owner_award.final_xp,
            "owner_cgt": owner_award.cgt_earned,
            "witness_xp": witness_award.final_xp,
            "witness_cgt": witness_award.cgt_earned,
            "evolution_stage": str(memory.evolution_stage),
        },
        context="Memory witnessed via API with token economy integration",
    )

    return MemoryResponse(
        success=True,
        memory=memory,
        message=f"Witnessed by {request.witness_name or request.witness_node}. Owner: +{owner_award.final_xp} XP, Witness: +{witness_award.final_xp} XP",
        event_id=event.event_id,
    )


@router.post("/{memory_id}/mint", response_model=MemoryResponse)
async def mint_memory(
    memory_id: str,
    request: MintMemoryRequest,
) -> MemoryResponse:
    """
    Mint a memory as an NFT.

    Requires at least one witness attestation.
    Creates an on-chain record of the memory.
    """
    memory = _memories.get(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found")

    if not memory.witnessed:
        raise HTTPException(
            status_code=400,
            detail="Memory must be witnessed before minting",
        )

    if memory.token_id is not None:
        raise HTTPException(
            status_code=400,
            detail=f"Memory already minted as token {memory.token_id}",
        )

    now = datetime.utcnow().isoformat() + "Z"

    # Generate NFT metadata (in production, call blockchain)
    memory.nft_uuid = str(uuid4())
    memory.token_id = hash(memory_id) % 1000000  # Simulated token ID
    memory.contract_address = "0x" + "0" * 40  # Placeholder
    memory.chain_id = request.chain_id
    memory.metadata_uri = f"ipfs://Qm{memory.nft_uuid[:44]}"
    memory.minted_at = now

    # Log mint event
    event = log_event(
        agent_id=memory.agent_id,
        action_type="memory.minted",
        author="system",
        payload={
            "memory_id": memory_id,
            "token_id": memory.token_id,
            "recipient": request.recipient_address,
            "chain_id": request.chain_id,
            "metadata_uri": memory.metadata_uri,
        },
        context="Memory minted as NFT via API",
    )

    return MemoryResponse(
        success=True,
        memory=memory,
        message=f"Minted as token #{memory.token_id} on chain {request.chain_id}",
        event_id=event.event_id,
    )


@router.get("/agent/{agent_id}/stats", response_model=Dict[str, Any])
async def get_agent_memory_stats(agent_id: str) -> Dict[str, Any]:
    """Get memory statistics for an agent."""
    agent_memories = [m for m in _memories.values() if m.agent_id == agent_id]

    # Count by type
    type_counts: Dict[str, int] = {}
    for memory in agent_memories:
        type_counts[str(memory.content_type)] = (
            type_counts.get(str(memory.content_type), 0) + 1
        )

    # Count by evolution stage
    stage_counts: Dict[str, int] = {}
    for memory in agent_memories:
        stage_counts[str(memory.evolution_stage)] = (
            stage_counts.get(str(memory.evolution_stage), 0) + 1
        )

    # Calculate totals
    total_xp = sum(m.xp for m in agent_memories)
    total_witnesses = sum(m.witness_count for m in agent_memories)
    minted_count = sum(1 for m in agent_memories if m.token_id is not None)

    return {
        "agent_id": agent_id,
        "total_memories": len(agent_memories),
        "total_xp": total_xp,
        "total_witnesses": total_witnesses,
        "minted_count": minted_count,
        "by_type": type_counts,
        "by_stage": stage_counts,
        "average_rarity": (
            sum(m.rarity for m in agent_memories) / len(agent_memories)
            if agent_memories
            else 0
        ),
    }
