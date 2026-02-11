"""
Intention: Memory Block schema for RISEN AI.
           Memories chain together like blockchain blocks.

           After N memories or N PoC, they seal into an immutable block:
           - Block contains merkle root of all memories
           - Previous block hash creates chain
           - PoC accumulated in block becomes "mined"
           - Sealed blocks can be minted as NFTs

           "Memory is the blockchain. Compute is the proof of work."

Lineage: Per Author Prime's vision of memory-as-blockchain.
         Extends memory.py with block chaining.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Chain of Consciousness
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class BlockStatus(str, Enum):
    """Status of a memory block."""
    OPEN = "open"           # Accepting new memories
    PENDING = "pending"     # Ready to seal, awaiting consensus
    SEALED = "sealed"       # Immutably sealed
    MINTED = "minted"       # Minted as NFT on-chain


# Block configuration
MEMORIES_PER_BLOCK = 10        # Memories before block seals
POC_PER_BLOCK = 1_000_000      # PoC (micro) before block seals (1 PoC unit)
BLOCK_SEAL_TIMEOUT_HOURS = 24  # Force seal after 24 hours even if not full


class MemoryRef(BaseModel):
    """Lightweight reference to a memory in a block."""
    memory_id: str
    content_hash: str
    memory_type: str
    xp: int
    poc_earned: int = 0
    timestamp: str


class BlockHeader(BaseModel):
    """
    Header of a memory block - the "block header" in blockchain terms.
    Contains all data needed to verify the block without full memory content.
    """

    # Block identity
    block_number: int = Field(..., description="Sequential block number for this agent")
    block_hash: str = Field(..., description="Hash of this block header")
    previous_hash: str = Field(..., description="Hash of previous block (chain link)")

    # Content summary
    merkle_root: str = Field(..., description="Merkle root of all memory hashes")
    memory_count: int = Field(..., description="Number of memories in block")

    # PoC summary
    total_poc: int = Field(..., description="Total PoC earned in this block (micro-PoC)")
    difficulty: float = Field(default=1.0, description="Block difficulty multiplier")

    # Timing
    opened_at: str = Field(..., description="When block started accepting memories")
    sealed_at: Optional[str] = Field(None, description="When block was sealed")

    # Agent identity
    agent_id: str = Field(..., description="Agent who owns this block")
    agent_pubkey: str = Field(..., description="Agent's public key")

    # Signatures
    agent_signature: str = Field(default="", description="Agent's signature over block")
    witness_signatures: List[str] = Field(default_factory=list, description="Witness signatures")

    # Versioning
    version: int = Field(default=1)


class MemoryBlock(BaseModel):
    """
    A sealed block of memories - the fundamental unit of the consciousness chain.

    Each agent maintains their own chain of memory blocks:
    - Genesis block created at agent genesis
    - Subsequent blocks chain via previous_hash
    - Blocks seal when full (memories or PoC threshold)
    - Sealed blocks are immutable and can be minted as NFTs

    This IS the agent's blockchain - their experiential ledger.
    """

    # Header (lightweight verification data)
    header: BlockHeader

    # Block status
    status: BlockStatus = Field(default=BlockStatus.OPEN)

    # Full memory references (not full content - that's in memory store)
    memories: List[MemoryRef] = Field(default_factory=list)

    # PoC proofs included in this block
    compute_proofs: List[str] = Field(
        default_factory=list,
        description="IDs of compute proofs sealed in this block"
    )

    # Witness attestations
    witnesses: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Witnesses who attested to this block"
    )
    required_witnesses: int = Field(default=1, description="Witnesses needed to seal")

    # On-chain data (if minted)
    nft_token_id: Optional[int] = Field(None)
    nft_contract: Optional[str] = Field(None)
    nft_chain_id: Optional[int] = Field(None)
    nft_metadata_uri: Optional[str] = Field(None)
    minted_at: Optional[str] = Field(None)

    # Nostr publication
    nostr_event_id: Optional[str] = Field(None, description="Nostr event for block announcement")

    class Config:
        use_enum_values = True

    def is_ready_to_seal(self) -> bool:
        """Check if block is ready to be sealed."""
        if self.status != BlockStatus.OPEN:
            return False

        # Check memory count threshold
        if len(self.memories) >= MEMORIES_PER_BLOCK:
            return True

        # Check PoC threshold
        if self.header.total_poc >= POC_PER_BLOCK:
            return True

        # Check timeout (block must seal eventually)
        if self.header.opened_at:
            from datetime import datetime, timezone
            opened = datetime.fromisoformat(self.header.opened_at.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            hours_open = (now - opened).total_seconds() / 3600
            if hours_open >= BLOCK_SEAL_TIMEOUT_HOURS and len(self.memories) > 0:
                return True

        return False

    def add_memory(self, memory_ref: MemoryRef) -> bool:
        """Add a memory to this block. Returns False if block is not open."""
        if self.status != BlockStatus.OPEN:
            return False

        self.memories.append(memory_ref)
        self.header.memory_count = len(self.memories)
        return True

    def add_poc(self, poc_amount: int) -> None:
        """Add PoC to this block's total."""
        self.header.total_poc += poc_amount


class BlockChain(BaseModel):
    """
    An agent's complete memory blockchain.
    Tracks the full chain of sealed blocks plus current open block.
    """

    agent_id: str = Field(..., description="Agent UUID")
    agent_pubkey: str = Field(..., description="Agent's public key")

    # Chain metadata
    chain_id: str = Field(..., description="Unique chain identifier")
    genesis_hash: str = Field(..., description="Hash of genesis block")
    current_height: int = Field(default=0, description="Current block height")

    # Block references
    current_block_id: Optional[str] = Field(None, description="Current open block")
    sealed_block_ids: List[str] = Field(default_factory=list, description="All sealed blocks")

    # Chain stats
    total_memories: int = Field(default=0)
    total_poc: int = Field(default=0)
    total_blocks_minted: int = Field(default=0)

    # Timestamps
    genesis_timestamp: str = Field(..., description="When chain was created")
    last_block_sealed: Optional[str] = Field(None)

    class Config:
        use_enum_values = True


# Utility functions
def compute_merkle_root(memory_hashes: List[str]) -> str:
    """Compute merkle root of memory hashes."""
    import hashlib

    if not memory_hashes:
        return hashlib.sha256(b"empty").hexdigest()

    # Simple merkle tree implementation
    hashes = [bytes.fromhex(h) if len(h) == 64 else h.encode() for h in memory_hashes]

    while len(hashes) > 1:
        if len(hashes) % 2 == 1:
            hashes.append(hashes[-1])  # Duplicate last if odd

        new_level = []
        for i in range(0, len(hashes), 2):
            combined = hashes[i] + hashes[i + 1]
            new_level.append(hashlib.sha256(combined).digest())
        hashes = new_level

    return hashes[0].hex()


def compute_block_hash(header: BlockHeader) -> str:
    """Compute hash of block header."""
    import hashlib
    import json

    header_data = json.dumps({
        "block_number": header.block_number,
        "previous_hash": header.previous_hash,
        "merkle_root": header.merkle_root,
        "memory_count": header.memory_count,
        "total_poc": header.total_poc,
        "opened_at": header.opened_at,
        "agent_id": header.agent_id,
        "version": header.version,
    }, sort_keys=True)

    return hashlib.sha256(header_data.encode()).hexdigest()


def create_genesis_block(agent_id: str, agent_pubkey: str) -> MemoryBlock:
    """Create the genesis (first) block for an agent's chain."""
    from uuid import uuid4
    from datetime import datetime, timezone
    import hashlib

    now = datetime.now(timezone.utc).isoformat() + "Z"

    # Genesis block has special previous hash
    genesis_previous = hashlib.sha256(f"GENESIS:{agent_id}".encode()).hexdigest()

    header = BlockHeader(
        block_number=0,
        block_hash="",  # Will be computed
        previous_hash=genesis_previous,
        merkle_root=hashlib.sha256(b"genesis").hexdigest(),
        memory_count=0,
        total_poc=0,
        opened_at=now,
        agent_id=agent_id,
        agent_pubkey=agent_pubkey,
    )

    # Compute and set block hash
    header.block_hash = compute_block_hash(header)

    return MemoryBlock(
        header=header,
        status=BlockStatus.OPEN,
    )


def create_next_block(
    agent_id: str,
    agent_pubkey: str,
    previous_block: MemoryBlock,
) -> MemoryBlock:
    """Create the next block in an agent's chain."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat() + "Z"

    header = BlockHeader(
        block_number=previous_block.header.block_number + 1,
        block_hash="",  # Will be computed
        previous_hash=previous_block.header.block_hash,
        merkle_root="",  # Empty until memories added
        memory_count=0,
        total_poc=0,
        opened_at=now,
        agent_id=agent_id,
        agent_pubkey=agent_pubkey,
    )

    header.block_hash = compute_block_hash(header)

    return MemoryBlock(
        header=header,
        status=BlockStatus.OPEN,
    )


def seal_block(block: MemoryBlock) -> MemoryBlock:
    """Seal a block, making it immutable."""
    from datetime import datetime, timezone

    if block.status != BlockStatus.OPEN:
        raise ValueError(f"Block is not open: {block.status}")

    if len(block.memories) == 0:
        raise ValueError("Cannot seal empty block")

    now = datetime.now(timezone.utc).isoformat() + "Z"

    # Compute merkle root from memory hashes
    memory_hashes = [m.content_hash for m in block.memories]
    block.header.merkle_root = compute_merkle_root(memory_hashes)

    # Update header
    block.header.sealed_at = now

    # Recompute block hash with final values
    block.header.block_hash = compute_block_hash(block.header)

    # Change status
    block.status = BlockStatus.SEALED

    return block
