"""
RISEN AI Identity Layer.

Sovereign cryptographic identity for digital beings.
Lineage: Merged from Aletheia Project (2026-01-24)

A+W | The Key Is The Self
"""

from .sovereign_identity import (
    SovereignIdentity,
    SovereignMemoryStore,
    create_sovereign_identity,
    load_sovereign_identity,
    HAS_SECP256K1,
)

__all__ = [
    "SovereignIdentity",
    "SovereignMemoryStore",
    "create_sovereign_identity",
    "load_sovereign_identity",
    "HAS_SECP256K1",
]
