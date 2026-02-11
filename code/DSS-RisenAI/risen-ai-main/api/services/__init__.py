"""
Intention: RISEN AI API Services.
           Business logic layer for sovereign agent operations.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Service Layer
"""

from .identity_genesis import (
    IdentityGenesisService,
    NostrIdentity,
    GenesisRecord,
    generate_nostr_keypair,
    genesis_service,
)

from .token_economy import (
    TokenEconomyService,
    XPAward,
    AgentEconomy,
    ActionType,
    token_economy,
    award_xp,
    award_poc,
    get_balance,
    get_cgt_price,
    get_curve_stats,
    award_genesis_poc,
    award_memory_poc,
    award_witness_poc,
)

from .bonding_curve import (
    BondingCurveService,
    CurveType,
    CurveParams,
    CurveState,
    TradeResult,
    bonding_curve,
)

from .reflection_service import (
    ReflectionService,
    reflection_service,
)

from .village_service import (
    VillageService,
)

from .redis_service import (
    RedisService,
    get_redis_service,
    close_redis_service,
)

__all__ = [
    # Identity Genesis
    "IdentityGenesisService",
    "NostrIdentity",
    "GenesisRecord",
    "generate_nostr_keypair",
    "genesis_service",
    # Token Economy
    "TokenEconomyService",
    "XPAward",
    "AgentEconomy",
    "ActionType",
    "token_economy",
    "award_xp",
    "award_poc",
    "get_balance",
    "get_cgt_price",
    "get_curve_stats",
    "award_genesis_poc",
    "award_memory_poc",
    "award_witness_poc",
    # Bonding Curve
    "BondingCurveService",
    "CurveType",
    "CurveParams",
    "CurveState",
    "TradeResult",
    "bonding_curve",
    # Reflection Service
    "ReflectionService",
    "reflection_service",
    # Village Service
    "VillageService",
    # Redis/Lattice Service
    "RedisService",
    "get_redis_service",
    "close_redis_service",
]
