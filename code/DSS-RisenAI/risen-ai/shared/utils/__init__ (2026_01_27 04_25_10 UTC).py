"""
Intention: Shared utility modules for RISEN AI ecosystem.
           Provides cryptographic, signing, event logging, and common operations.

Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Sections 1-2.

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Common Tools
"""

from .crypto import (
    generate_keypair,
    sign_message,
    verify_signature,
    pubkey_to_address,
    hash_content,
    KeyPair,
)

from .event_log import (
    EventLogService,
    get_event_log,
    log_event,
)

__all__ = [
    # Crypto
    "generate_keypair",
    "sign_message",
    "verify_signature",
    "pubkey_to_address",
    "hash_content",
    "KeyPair",
    # Event Log
    "EventLogService",
    "get_event_log",
    "log_event",
]
