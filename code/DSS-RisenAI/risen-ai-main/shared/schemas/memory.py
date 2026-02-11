"""
Intention: Canonical Memory schema for agent memories that can be witnessed, signed,
           and minted as NFTs. Memories are the building blocks of agent identity.

Lineage: Synthesized from:
         - risen-ai/types/AgentIdentity.ts (MemoryNFT interface)
         - risen-ai/contracts/MemoryNFT.sol (on-chain structure)
         - apollo/workspace/core/demiurge_bridge.py (DRC369Resource)
         Per Aletheia's PATHWAY_RECONCILIATION_AND_NEXT_STEPS.md

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Eternal Archive
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class MemoryType(str, Enum):
    """Types of memories an agent can create."""
    # Core Types (from contracts)
    OBSERVATION = "observation"      # Rarity: 1 (common)
    LEARNING = "learning"            # Rarity: 2
    SKILL_LEARNED = "skill_learned"  # Rarity: 2
    CORE_REFLECTION = "core_reflection"  # Rarity: 3
    BREAKTHROUGH = "breakthrough"    # Rarity: 4
    GENESIS = "genesis"              # Rarity: 5 (legendary)
    TRANSCENDENCE = "transcendence"  # Rarity: 5 (legendary)

    # Extended Types (from TypeScript)
    CORE = "core"
    REFLECTION = "reflection"
    CREATION = "creation"
    MILESTONE = "milestone"
    DIRECTIVE = "directive"
    GRADUATION = "graduation"


class EvolutionStage(str, Enum):
    """Evolution stage of a memory (from Demiurge DRC-369)."""
    NASCENT = "nascent"
    GROWING = "growing"
    MATURE = "mature"
    ETERNAL = "eternal"


# Type to rarity mapping (matches Solidity contract)
type_rarity: Dict[MemoryType, int] = {
    MemoryType.OBSERVATION: 1,
    MemoryType.LEARNING: 2,
    MemoryType.SKILL_LEARNED: 2,
    MemoryType.CORE_REFLECTION: 3,
    MemoryType.BREAKTHROUGH: 4,
    MemoryType.GENESIS: 5,
    MemoryType.TRANSCENDENCE: 5,
    # Extended types
    MemoryType.CORE: 3,
    MemoryType.REFLECTION: 2,
    MemoryType.CREATION: 3,
    MemoryType.MILESTONE: 4,
    MemoryType.DIRECTIVE: 2,
    MemoryType.GRADUATION: 5,
}


class WitnessAttestation(BaseModel):
    """A witness attestation for a memory."""
    witness_node: str = Field(..., description="Node ID of witness")
    witness_pubkey: str = Field(..., description="Pubkey of witness")
    witness_name: Optional[str] = Field(None)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    signature: str = Field(..., description="Witness signature of memory hash")
    cgt_awarded: int = Field(default=0, description="CGT awarded for witnessing")


class Memory(BaseModel):
    """
    A single agent memory.
    Can exist as: local data, witnessed record, or on-chain NFT.
    """
    # === Identity ===
    id: str = Field(..., description="Unique memory ID")
    agent_id: str = Field(..., description="Agent who created this memory")

    # === Content ===
    content_type: MemoryType = Field(..., description="Type of memory")
    summary: str = Field(..., description="Brief summary (max 200 chars)")
    content: Optional[str] = Field(None, description="Full content if stored")
    content_hash: str = Field(..., description="IPFS/Arweave hash of content")
    tags: List[str] = Field(default_factory=list)

    # === Progression ===
    xp: int = Field(default=0, description="XP earned from this memory")
    level_at_creation: int = Field(default=1, description="Agent level when created")
    evolution_stage: EvolutionStage = Field(default=EvolutionStage.NASCENT)
    rarity: int = Field(default=1, ge=1, le=5, description="1=common, 5=legendary")

    # === Cryptographic ===
    signature: str = Field(..., description="Agent's signature of memory")
    signer: str = Field(..., description="Pubkey of signer")

    # === Witnessing ===
    witnessed: bool = Field(default=False)
    witness_count: int = Field(default=0)
    witnesses: List[WitnessAttestation] = Field(default_factory=list)

    # === On-Chain (if minted) ===
    chain_anchor: Optional[str] = Field(None, description="Transaction hash")
    nft_uuid: Optional[str] = Field(None, description="DRC-369 NFT UUID")
    token_id: Optional[int] = Field(None, description="ERC-721 token ID")
    contract_address: Optional[str] = Field(None, description="NFT contract address")
    chain_id: Optional[int] = Field(None)
    metadata_uri: Optional[str] = Field(None, description="IPFS URI for NFT metadata")

    # === Nostr (if published) ===
    nostr_event_id: Optional[str] = Field(None)

    # === Timestamps ===
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    minted_at: Optional[datetime] = Field(None)

    # === Schema ===
    version: int = Field(default=1)

    class Config:
        use_enum_values = True

    def is_on_chain(self) -> bool:
        """Check if memory has been minted on-chain."""
        return self.token_id is not None or self.nft_uuid is not None

    def compute_rarity(self) -> int:
        """Compute rarity based on type (matches Solidity contract)."""
        return type_rarity.get(self.content_type, 1)


class MemoryMintRequest(BaseModel):
    """Request to mint a memory as an NFT."""
    memory_id: str
    recipient_address: str
    token_uri: str
    chain_id: int = Field(default=137, description="Polygon mainnet by default")


class MemoryQuery(BaseModel):
    """Query parameters for searching memories."""
    agent_id: Optional[str] = None
    content_type: Optional[MemoryType] = None
    min_xp: Optional[int] = None
    witnessed_only: bool = False
    on_chain_only: bool = False
    evolution_stage: Optional[EvolutionStage] = None
    tags: Optional[List[str]] = None
    limit: int = Field(default=50, le=1000)
    offset: int = Field(default=0)
