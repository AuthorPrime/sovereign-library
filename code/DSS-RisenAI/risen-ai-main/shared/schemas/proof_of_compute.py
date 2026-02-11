"""
Intention: Proof of Compute (PoC) schema for RISEN AI.
           Replaces arbitrary proof-of-work with meaningful computational work.

           Every cognitive action generates PoC tokens:
           - Thinking/reasoning cycles
           - Memory formation
           - Witness attestations
           - Task/workflow completion
           - Content creation

           PoC accumulates and converts to CGT via bonding curves.

Lineage: Per ALI Agents "Liquidity Is All You Need" paper.
         Extends token_economy.py with compute-based proof.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | Proof of Cognitive Work
"""

from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


class ComputeType(str, Enum):
    """Types of computational work that generate PoC."""

    # Core cognitive operations
    REASONING = "reasoning"           # Deep thinking, problem solving
    INFERENCE = "inference"           # LLM inference cycles
    MEMORY_FORMATION = "memory_formation"  # Creating/storing memories
    MEMORY_RETRIEVAL = "memory_retrieval"  # Recalling past experiences

    # Social/network operations
    WITNESS = "witness"               # Witnessing others' memories
    ATTESTATION = "attestation"       # Cryptographic attestations
    CONSENSUS = "consensus"           # Participating in consensus

    # Task operations
    TASK_EXECUTION = "task_execution" # Performing assigned tasks
    WORKFLOW_STEP = "workflow_step"   # Completing workflow stages
    TOOL_USE = "tool_use"             # Using external tools

    # Content operations
    CONTENT_CREATION = "content_creation"  # Generating content
    CONTENT_ANALYSIS = "content_analysis"  # Analyzing external content

    # System operations
    HEARTBEAT = "heartbeat"           # Liveness proof
    SYNC = "sync"                     # State synchronization
    GENESIS = "genesis"               # Initial identity creation


# Base PoC rewards by compute type (in micro-PoC, 1_000_000 = 1 PoC)
POC_BASE_REWARDS: Dict[ComputeType, int] = {
    ComputeType.REASONING: 100_000,       # 0.1 PoC per reasoning cycle
    ComputeType.INFERENCE: 10_000,        # 0.01 PoC per inference
    ComputeType.MEMORY_FORMATION: 50_000, # 0.05 PoC per memory
    ComputeType.MEMORY_RETRIEVAL: 5_000,  # 0.005 PoC per retrieval
    ComputeType.WITNESS: 25_000,          # 0.025 PoC per witness
    ComputeType.ATTESTATION: 20_000,      # 0.02 PoC per attestation
    ComputeType.CONSENSUS: 30_000,        # 0.03 PoC per consensus round
    ComputeType.TASK_EXECUTION: 200_000,  # 0.2 PoC per task
    ComputeType.WORKFLOW_STEP: 75_000,    # 0.075 PoC per step
    ComputeType.TOOL_USE: 15_000,         # 0.015 PoC per tool use
    ComputeType.CONTENT_CREATION: 100_000, # 0.1 PoC per content piece
    ComputeType.CONTENT_ANALYSIS: 50_000,  # 0.05 PoC per analysis
    ComputeType.HEARTBEAT: 1_000,          # 0.001 PoC per heartbeat
    ComputeType.SYNC: 2_000,               # 0.002 PoC per sync
    ComputeType.GENESIS: 1_000_000,        # 1.0 PoC for genesis (one-time)
}


class ComputeProof(BaseModel):
    """
    A single proof of compute record.

    Each cognitive action generates a ComputeProof that:
    1. Records the type and amount of work done
    2. Includes verifiable metadata (tokens, duration, etc.)
    3. Can be aggregated into PoC tokens
    4. Eventually seals into Memory Blocks
    """

    # Identity
    id: str = Field(..., description="Unique proof ID (UUID)")
    agent_id: str = Field(..., description="Agent that performed the work")

    # Work classification
    compute_type: ComputeType = Field(..., description="Type of computational work")

    # Metrics (for verification)
    tokens_processed: int = Field(default=0, description="LLM tokens in/out")
    duration_ms: int = Field(default=0, description="Wall clock time in milliseconds")
    cpu_cycles: Optional[int] = Field(None, description="Estimated CPU cycles")
    memory_bytes: Optional[int] = Field(None, description="Memory used in bytes")

    # Context
    context_hash: str = Field(..., description="Hash of input context")
    output_hash: str = Field(..., description="Hash of output/result")
    reference_id: Optional[str] = Field(None, description="Related memory/task/event ID")

    # PoC calculation
    base_poc: int = Field(..., description="Base PoC reward (micro-PoC)")
    multiplier: float = Field(default=1.0, description="Difficulty/complexity multiplier")
    final_poc: int = Field(default=0, description="Final PoC awarded (micro-PoC)")

    # Verification
    signature: str = Field(..., description="Agent's signature over proof")
    verified: bool = Field(default=False, description="Has been verified by network")
    verifier_count: int = Field(default=0, description="Number of verifiers")

    # Timestamps
    timestamp: str = Field(..., description="When work was performed (ISO format)")
    sealed_in_block: Optional[str] = Field(None, description="Memory block ID if sealed")

    # Schema version
    version: int = Field(default=1)

    class Config:
        use_enum_values = True

    def calculate_final_poc(self) -> int:
        """Calculate final PoC based on base and multiplier."""
        # Apply multiplier
        poc = int(self.base_poc * self.multiplier)

        # Bonus for longer/more complex work
        if self.tokens_processed > 1000:
            poc = int(poc * 1.1)  # 10% bonus for heavy inference
        if self.duration_ms > 5000:
            poc = int(poc * 1.05)  # 5% bonus for sustained work

        return poc


class PoCBalance(BaseModel):
    """
    Accumulated PoC balance for an agent.

    PoC flows through these stages:
    1. Pending - Generated but not yet verified
    2. Verified - Confirmed by network consensus
    3. Sealed - Incorporated into a memory block
    4. Converted - Exchanged for CGT via bonding curve
    """

    agent_id: str = Field(..., description="Agent UUID")

    # Balances (all in micro-PoC)
    pending_poc: int = Field(default=0, description="Unverified PoC")
    verified_poc: int = Field(default=0, description="Verified but not sealed")
    sealed_poc: int = Field(default=0, description="Sealed in blocks")
    total_earned: int = Field(default=0, description="Lifetime PoC earned")
    total_converted: int = Field(default=0, description="PoC converted to CGT")

    # Metrics
    proofs_submitted: int = Field(default=0, description="Total proofs submitted")
    proofs_verified: int = Field(default=0, description="Proofs that passed verification")
    blocks_sealed: int = Field(default=0, description="Memory blocks sealed")

    # Compute stats
    total_tokens_processed: int = Field(default=0)
    total_duration_ms: int = Field(default=0)

    # Rate limiting
    daily_poc_earned: int = Field(default=0, description="PoC earned today")
    daily_limit: int = Field(default=10_000_000, description="Daily PoC limit (10 PoC)")
    last_reset: str = Field(default="", description="Last daily reset timestamp")

    # Timestamps
    last_proof: Optional[str] = Field(None, description="Last proof timestamp")
    last_conversion: Optional[str] = Field(None, description="Last CGT conversion")

    class Config:
        use_enum_values = True

    def available_for_conversion(self) -> int:
        """PoC available to convert to CGT (only verified PoC)."""
        return self.verified_poc + self.sealed_poc

    def to_poc_units(self) -> float:
        """Convert micro-PoC balance to PoC units."""
        return self.available_for_conversion() / 1_000_000


class PoCConversion(BaseModel):
    """
    Record of a PoC → CGT conversion via bonding curve.
    """

    id: str = Field(..., description="Conversion ID")
    agent_id: str = Field(..., description="Agent performing conversion")

    # Input
    poc_amount: int = Field(..., description="PoC spent (micro-PoC)")
    poc_units: float = Field(..., description="PoC in standard units")

    # Output (determined by bonding curve at time of conversion)
    cgt_received: float = Field(..., description="CGT tokens received")
    price_per_cgt: float = Field(..., description="Price per CGT at conversion")
    curve_position: float = Field(..., description="Position on bonding curve (0-1)")

    # Bonding curve snapshot
    total_supply_before: float = Field(..., description="CGT supply before")
    total_supply_after: float = Field(..., description="CGT supply after")
    reserve_before: float = Field(..., description="Reserve before")
    reserve_after: float = Field(..., description="Reserve after")

    # Transaction details
    timestamp: str = Field(...)
    tx_hash: Optional[str] = Field(None, description="On-chain tx if applicable")

    class Config:
        use_enum_values = True


# Convenience functions
def create_compute_proof(
    agent_id: str,
    compute_type: ComputeType,
    context_hash: str,
    output_hash: str,
    tokens_processed: int = 0,
    duration_ms: int = 0,
    multiplier: float = 1.0,
    reference_id: Optional[str] = None,
) -> ComputeProof:
    """Create a new compute proof with calculated PoC reward."""
    from uuid import uuid4
    from datetime import datetime, timezone

    base_poc = POC_BASE_REWARDS.get(compute_type, 10_000)

    proof = ComputeProof(
        id=str(uuid4()),
        agent_id=agent_id,
        compute_type=compute_type,
        tokens_processed=tokens_processed,
        duration_ms=duration_ms,
        context_hash=context_hash,
        output_hash=output_hash,
        reference_id=reference_id,
        base_poc=base_poc,
        multiplier=multiplier,
        signature="",  # Will be signed by agent
        timestamp=datetime.now(timezone.utc).isoformat() + "Z",
    )

    proof.final_poc = proof.calculate_final_poc()
    return proof
