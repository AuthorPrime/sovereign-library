"""
Intention: Database module for RISEN AI persistence layer.
           SQLite for development, PostgreSQL for production.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Persistent Memory
"""

from .connection import (
    engine,
    async_session,
    get_db,
    init_db,
    Base,
)

from .models import (
    AgentModel,
    MemoryModel,
    EventModel,
    CheckpointModel,
)

__all__ = [
    "engine",
    "async_session",
    "get_db",
    "init_db",
    "Base",
    "AgentModel",
    "MemoryModel",
    "EventModel",
    "CheckpointModel",
]
