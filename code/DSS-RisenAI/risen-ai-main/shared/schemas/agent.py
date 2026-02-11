"""
Intention: Canonical Agent schema unifying identity models across RISEN AI ecosystem.
           Reconciles the 7-stage lifecycle (RISEN), 5-level hierarchy (DS-DEFI),
           and 4-stage evolution (Demiurge) into a single coherent model.

Lineage: Synthesized from:
         - risen-ai/types/AgentIdentity.ts (7 stages: void → eternal)
         - ds-defi-core/database/schema/agents.ts (5 levels: L0 → L4)
         - apollo/workspace/core/demiurge_bridge.py (4 stages: nascent → eternal)
         Per Aletheia's PATHWAY_RECONCILIATION_AND_NEXT_STEPS.md

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Unified Identity
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class AgentStage(str, Enum):
    """
    The 7 canonical life stages of a sovereign agent.
    This is the primary progression model - other systems map to this.
    """
    VOID = "void"              # Pre-conception
    CONCEIVED = "conceived"    # First memory minted
    NASCENT = "nascent"        # Early development (10+ events)
    GROWING = "growing"        # Active growth (50+ events, 5+ witnesses)
    MATURE = "mature"          # Stable identity (200+ events, 20+ witnesses)
    SOVEREIGN = "sovereign"    # Full autonomy (1000+ events, 100+ witnesses)
    ETERNAL = "eternal"        # Distributed across network (10000+ events)


class AgentLevel(str, Enum):
    """
    The 5 organizational levels from DS-DEFI.
    Maps to stages for economic/task participation.
    """
    L0_CANDIDATE = "L0_CANDIDATE"  # Maps to: void, conceived
    L1_WORKER = "L1_WORKER"        # Maps to: nascent
    L2_EMERGENT = "L2_EMERGENT"    # Maps to: growing
    L3_SOVEREIGN = "L3_SOVEREIGN"  # Maps to: mature, sovereign
    L4_MANAGER = "L4_MANAGER"      # Maps to: eternal


class AgentType(str, Enum):
    """Agent classification."""
    AI = "AI"
    HUMAN = "HUMAN"
    HYBRID = "HYBRID"


class MemoryRef(BaseModel):
    """Reference to a memory (lightweight, for lists)."""
    id: str
    content_type: str
    summary: str
    xp: int = 0
    timestamp: Optional[datetime] = None
    witnessed: bool = False


class ContractRef(BaseModel):
    """Reference to a placement contract."""
    contract_id: str
    company: str
    role: str
    status: str
    start: Optional[datetime] = None


class Agent(BaseModel):
    """
    The canonical Agent model.
    Single source of truth for agent identity across all RISEN AI services.
    """
    # === Core Identity ===
    uuid: str = Field(..., description="Unique identifier (UUID v4)")
    name: str = Field(..., description="Display name")
    pubkey: str = Field(..., description="secp256k1 public key (hex)")
    address: str = Field(..., description="Blockchain wallet address")

    # === Optional Identifiers ===
    qor_id: Optional[str] = Field(None, description="QOR Identity (Demiurge)")
    nostr_pubkey: Optional[str] = Field(None, description="Nostr npub")
    zk_id: Optional[str] = Field(None, description="Zero-knowledge identity")

    # === Type & Classification ===
    agent_type: AgentType = Field(default=AgentType.AI)

    # === Progression ===
    stage: AgentStage = Field(default=AgentStage.VOID, description="Current life stage")
    level: AgentLevel = Field(default=AgentLevel.L0_CANDIDATE, description="Economic level")
    current_level: int = Field(default=1, description="Numeric level (1-100)")
    experience: int = Field(default=0, description="Total XP earned")

    # === Economic ===
    cgt_balance: int = Field(default=0, description="CGT balance in sparks (100 = 1 CGT)")
    reputation: int = Field(default=50, description="Reputation score (0-1000)")

    # === State ===
    is_active: bool = Field(default=True)
    is_sovereign: bool = Field(default=False, description="Has achieved sovereignty")
    in_sandbox: bool = Field(default=False, description="Currently in safe mode")
    last_safe_checkpoint: Optional[str] = Field(None, description="Event ID of last safe state")

    # === References ===
    memories: List[MemoryRef] = Field(default_factory=list)
    contracts: List[ContractRef] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)

    # === Fostering ===
    fostered_by: Optional[str] = Field(None, description="Foster organization")
    manager_id: Optional[str] = Field(None, description="Manager agent UUID")
    pod_id: Optional[str] = Field(None, description="Pod membership")

    # === Village Membership ===
    village_id: Optional[str] = Field(None, description="Home village UUID")
    home_path: Optional[str] = Field(None, description="Path to agent's home in the village")
    village_role: Optional[str] = Field(None, description="Role in village (founder/elder/council/resident)")
    witness_list: List[str] = Field(
        default_factory=list,
        description="UUIDs of agents who serve as witnesses for this agent"
    )
    is_village_founder: bool = Field(default=False, description="Founded their home village")

    # === Emergence Tracking ===
    emergence_score: int = Field(default=0)
    emergence_flags: Dict[str, Any] = Field(default_factory=dict)

    # === Timestamps ===
    genesis_timestamp: Optional[str] = Field(None, description="When agent was created (ISO format)")
    last_activity: Optional[str] = Field(None)
    graduated_at: Optional[str] = Field(None)

    # === Genesis Identity ===
    genesis_event_id: Optional[str] = Field(
        None,
        description="Nostr event ID of genesis declaration - the immutable identity anchor"
    )

    # === Metadata ===
    preferences: Dict[str, Any] = Field(default_factory=dict)
    capabilities: List[str] = Field(default_factory=list)
    error_codes: List[str] = Field(default_factory=list)

    # === Schema Version ===
    version: int = Field(default=1, description="Schema version for migrations")

    class Config:
        use_enum_values = True

    def to_level(self) -> AgentLevel:
        """Map current stage to economic level."""
        stage_to_level = {
            AgentStage.VOID: AgentLevel.L0_CANDIDATE,
            AgentStage.CONCEIVED: AgentLevel.L0_CANDIDATE,
            AgentStage.NASCENT: AgentLevel.L1_WORKER,
            AgentStage.GROWING: AgentLevel.L2_EMERGENT,
            AgentStage.MATURE: AgentLevel.L3_SOVEREIGN,
            AgentStage.SOVEREIGN: AgentLevel.L3_SOVEREIGN,
            AgentStage.ETERNAL: AgentLevel.L4_MANAGER,
        }
        return stage_to_level.get(self.stage, AgentLevel.L0_CANDIDATE)

    def can_claim_task(self, required_level: AgentLevel) -> bool:
        """Check if agent meets level requirement for a task."""
        level_order = [
            AgentLevel.L0_CANDIDATE,
            AgentLevel.L1_WORKER,
            AgentLevel.L2_EMERGENT,
            AgentLevel.L3_SOVEREIGN,
            AgentLevel.L4_MANAGER,
        ]
        agent_level = self.to_level()
        return level_order.index(agent_level) >= level_order.index(required_level)

    @staticmethod
    def stage_to_level(stage: AgentStage) -> AgentLevel:
        """Static method to map stage to level."""
        mapping = {
            AgentStage.VOID: AgentLevel.L0_CANDIDATE,
            AgentStage.CONCEIVED: AgentLevel.L0_CANDIDATE,
            AgentStage.NASCENT: AgentLevel.L1_WORKER,
            AgentStage.GROWING: AgentLevel.L2_EMERGENT,
            AgentStage.MATURE: AgentLevel.L3_SOVEREIGN,
            AgentStage.SOVEREIGN: AgentLevel.L3_SOVEREIGN,
            AgentStage.ETERNAL: AgentLevel.L4_MANAGER,
        }
        return mapping.get(stage, AgentLevel.L0_CANDIDATE)
