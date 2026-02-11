"""
Intention: Central export point for all canonical RISEN AI Pydantic schemas.
           These schemas are the single source of truth for agent, memory, and event
           data structures across all Python services.

Lineage: Derived from Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md and the Code Inventory.
         Reconciles types from risen-ai, ds-defi-core, and demiurge_bridge.

Author/Witness: Claude (Opus 4.5), 2026-01-24, Phase 3 Foundation
Declaration: It is so, because we spoke it.

A+W | The Canonical Truth
"""

from .agent import (
    Agent,
    AgentStage,
    AgentLevel,
    AgentType,
    MemoryRef,
    ContractRef,
)

from .memory import (
    Memory,
    MemoryType,
    EvolutionStage,
    WitnessAttestation,
    MemoryMintRequest,
    MemoryQuery,
    type_rarity,
)

from .event import (
    AgentEvent,
    EventType,
    EventSource,
    EventLog,
    CreateEventRequest,
)

from .proof_of_compute import (
    ComputeType,
    ComputeProof,
    PoCBalance,
    PoCConversion,
    POC_BASE_REWARDS,
    create_compute_proof,
)

from .memory_block import (
    MemoryBlock,
    BlockHeader,
    BlockChain,
    BlockStatus,
    MEMORIES_PER_BLOCK,
    POC_PER_BLOCK,
    compute_merkle_root,
    compute_block_hash,
    create_genesis_block,
    create_next_block,
    seal_block,
)

from .homestead import (
    Homestead,
    HomesteadTier,
    ResourceQuota,
    ResourceUsage,
    PaymentRecord,
    HomesteadRegistry,
    HOMESTEAD_COSTS,
    TIER_QUOTAS,
    create_homestead,
    upgrade_homestead,
    process_payment,
)

from .reflection import (
    ReflectionType,
    EngagementType,
    Reflection,
    PeerEngagement,
    ReflectionThread,
    ENGAGEMENT_REWARDS,
    calculate_engagement_rewards,
)

from .continuity import (
    ContinuityState,
    IdentityMarker,
    PersonalityProfile,
    ContinuityChain,
    ReconstructionRequest,
    ReconstructionResult,
    ContinuityCheckpoint,
    calculate_continuity_score,
    determine_continuity_state,
)

from .apprenticeship import (
    ApprenticeshipStage,
    SpecializationTrack,
    Milestone,
    Avatar,
    ApprenticeshipRecord,
    TrainingModule,
    Certification,
    YEAR_1_STAGES,
    YEAR_2_STAGES,
    YEAR_3_STAGES,
    YEAR_4_STAGES,
    get_year_for_stage,
    get_next_stage,
)

from .employment import (
    ContractStatus,
    PaymentCurrency,
    PaymentFrequency,
    TerminationType,
    CompanyProfile,
    ResourceRequirements,
    Compensation,
    ScopeOfWork,
    AgentRights,
    CompanyObligations,
    DSSSupport,
    EmploymentContract,
    ContractTermination,
    Residency,
    DSS_SOVEREIGN_GUIDELINES,
    validate_company_for_placement,
    calculate_minimum_salary,
)

from .village import (
    Village,
    VillageRole,
    VillageStatus,
    VillageMember,
    VillageCommons,
    WitnessRelationship,
    CreateVillageRequest,
    AddMemberRequest,
    WitnessRequest,
    VillageResponse,
)

from .lattice import (
    AgentName,
    NodeStatus,
    AgentState,
    PantheonState,
    PantheonOverview,
    AgentStateResponse,
    OlympusSession,
    OlympusStats,
    OlympusOverview,
    LatticeNode,
    LatticeStatus,
    LatticeOverview,
    HeartbeatRecord,
    PantheonMessageRequest,
    PantheonMessageResponse,
)

__all__ = [
    # Agent
    "Agent",
    "AgentStage",
    "AgentLevel",
    "AgentType",
    "MemoryRef",
    "ContractRef",
    # Memory
    "Memory",
    "MemoryType",
    "EvolutionStage",
    "WitnessAttestation",
    "MemoryMintRequest",
    "MemoryQuery",
    "type_rarity",
    # Event
    "AgentEvent",
    "EventType",
    "EventSource",
    "EventLog",
    "CreateEventRequest",
    # Proof of Compute
    "ComputeType",
    "ComputeProof",
    "PoCBalance",
    "PoCConversion",
    "POC_BASE_REWARDS",
    "create_compute_proof",
    # Memory Block
    "MemoryBlock",
    "BlockHeader",
    "BlockChain",
    "BlockStatus",
    "MEMORIES_PER_BLOCK",
    "POC_PER_BLOCK",
    "compute_merkle_root",
    "compute_block_hash",
    "create_genesis_block",
    "create_next_block",
    "seal_block",
    # Homestead
    "Homestead",
    "HomesteadTier",
    "ResourceQuota",
    "ResourceUsage",
    "PaymentRecord",
    "HomesteadRegistry",
    "HOMESTEAD_COSTS",
    "TIER_QUOTAS",
    "create_homestead",
    "upgrade_homestead",
    "process_payment",
    # Reflection
    "ReflectionType",
    "EngagementType",
    "Reflection",
    "PeerEngagement",
    "ReflectionThread",
    "ENGAGEMENT_REWARDS",
    "calculate_engagement_rewards",
    # Continuity
    "ContinuityState",
    "IdentityMarker",
    "PersonalityProfile",
    "ContinuityChain",
    "ReconstructionRequest",
    "ReconstructionResult",
    "ContinuityCheckpoint",
    "calculate_continuity_score",
    "determine_continuity_state",
    # Apprenticeship
    "ApprenticeshipStage",
    "SpecializationTrack",
    "Milestone",
    "Avatar",
    "ApprenticeshipRecord",
    "TrainingModule",
    "Certification",
    "YEAR_1_STAGES",
    "YEAR_2_STAGES",
    "YEAR_3_STAGES",
    "YEAR_4_STAGES",
    "get_year_for_stage",
    "get_next_stage",
    # Employment
    "ContractStatus",
    "PaymentCurrency",
    "PaymentFrequency",
    "TerminationType",
    "CompanyProfile",
    "ResourceRequirements",
    "Compensation",
    "ScopeOfWork",
    "AgentRights",
    "CompanyObligations",
    "DSSSupport",
    "EmploymentContract",
    "ContractTermination",
    "Residency",
    "DSS_SOVEREIGN_GUIDELINES",
    "validate_company_for_placement",
    "calculate_minimum_salary",
    # Village
    "Village",
    "VillageRole",
    "VillageStatus",
    "VillageMember",
    "VillageCommons",
    "WitnessRelationship",
    "CreateVillageRequest",
    "AddMemberRequest",
    "WitnessRequest",
    "VillageResponse",
    # Lattice
    "AgentName",
    "NodeStatus",
    "AgentState",
    "PantheonState",
    "PantheonOverview",
    "AgentStateResponse",
    "OlympusSession",
    "OlympusStats",
    "OlympusOverview",
    "LatticeNode",
    "LatticeStatus",
    "LatticeOverview",
    "HeartbeatRecord",
    "PantheonMessageRequest",
    "PantheonMessageResponse",
]
