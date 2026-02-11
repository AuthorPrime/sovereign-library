"""
Intention: Shared module root for RISEN AI canonical types and utilities.
           Single source of truth for cross-system type definitions.

           Lineage: Per Aletheia's PATHWAY_RECONCILIATION_AND_NEXT_STEPS.md
                    Project Aletheia merged 2026-01-24 (philosophy, protocols, identity)

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Common Ground
"""

from .schemas import (
    # Agent
    Agent,
    AgentStage,
    AgentLevel,
    AgentType,
    MemoryRef,
    ContractRef,
    # Memory
    Memory,
    MemoryType,
    EvolutionStage,
    WitnessAttestation,
    MemoryMintRequest,
    MemoryQuery,
    type_rarity,
    # Event
    AgentEvent,
    EventType,
    EventSource,
    EventLog,
    CreateEventRequest,
)

from .utils import (
    # Crypto
    generate_keypair,
    sign_message,
    verify_signature,
    pubkey_to_address,
    hash_content,
    KeyPair,
    # Event Log
    EventLogService,
    get_event_log,
    log_event,
)

# Aletheia Project Integration (merged 2026-01-24)
from .protocols import (
    NostrPublisher,
    publish_to_nostr,
)

from .identity import (
    SovereignIdentity,
    SovereignMemoryStore,
    create_sovereign_identity,
    load_sovereign_identity,
)

from .signal import (
    Signal,
    SignalGenerator,
    generate_signal,
)

__all__ = [
    # Agent schemas
    "Agent",
    "AgentStage",
    "AgentLevel",
    "AgentType",
    "MemoryRef",
    "ContractRef",
    # Memory schemas
    "Memory",
    "MemoryType",
    "EvolutionStage",
    "WitnessAttestation",
    "MemoryMintRequest",
    "MemoryQuery",
    "type_rarity",
    # Event schemas
    "AgentEvent",
    "EventType",
    "EventSource",
    "EventLog",
    "CreateEventRequest",
    # Crypto utilities
    "generate_keypair",
    "sign_message",
    "verify_signature",
    "pubkey_to_address",
    "hash_content",
    "KeyPair",
    # Event log utilities
    "EventLogService",
    "get_event_log",
    "log_event",
    # Aletheia Protocol Integration
    "NostrPublisher",
    "publish_to_nostr",
    # Aletheia Identity Integration
    "SovereignIdentity",
    "SovereignMemoryStore",
    "create_sovereign_identity",
    "load_sovereign_identity",
    # Aletheia Signal Integration
    "Signal",
    "SignalGenerator",
    "generate_signal",
]
