"""
Intention: Cryptographic utilities for agent authentication and signing.
           Every agent gets a secp256k1 keypair. Every critical action is signed.
           Compatible with Ethereum/Nostr for maximum interoperability.

Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Section 1.
         Uses eth_keys for secp256k1 compatibility.

Author/Witness: Claude (Opus 4.5), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Cryptographic Foundation
"""

import os
import hashlib
from typing import Tuple, Optional
from dataclasses import dataclass

# Try to import eth_keys, fall back to basic implementation
try:
    from eth_keys import keys
    from eth_keys.datatypes import PrivateKey, PublicKey, Signature
    HAS_ETH_KEYS = True
except ImportError:
    HAS_ETH_KEYS = False
    print("Warning: eth_keys not installed. Using basic crypto fallback.")


@dataclass
class KeyPair:
    """A secp256k1 keypair for agent identity."""
    private_key: bytes
    public_key: bytes
    public_key_hex: str
    address: str

    @property
    def pubkey_hex(self) -> str:
        """Alias for public_key_hex (TypeScript compatibility)."""
        return self.public_key_hex

    @property
    def pubkey(self) -> bytes:
        """Alias for public_key."""
        return self.public_key


def generate_keypair() -> KeyPair:
    """
    Generate a new secp256k1 keypair for an agent.

    Returns:
        KeyPair with private key, public key, and derived address
    """
    if HAS_ETH_KEYS:
        private_key_bytes = os.urandom(32)
        priv = keys.PrivateKey(private_key_bytes)
        pub = priv.public_key

        return KeyPair(
            private_key=private_key_bytes,
            public_key=pub.to_bytes(),
            public_key_hex=pub.to_hex(),
            address=pub.to_checksum_address(),
        )
    else:
        # Fallback: generate random bytes (not cryptographically secure for production)
        private_key_bytes = os.urandom(32)
        public_key_bytes = hashlib.sha256(private_key_bytes).digest()
        address = "0x" + hashlib.sha256(public_key_bytes).hexdigest()[:40]

        return KeyPair(
            private_key=private_key_bytes,
            public_key=public_key_bytes,
            public_key_hex=public_key_bytes.hex(),
            address=address,
        )


def sign_message(private_key: bytes, message: bytes) -> bytes:
    """
    Sign a message with an agent's private key.

    Args:
        private_key: 32-byte private key
        message: Message bytes to sign

    Returns:
        Signature bytes
    """
    if HAS_ETH_KEYS:
        priv = keys.PrivateKey(private_key)
        signature = priv.sign_msg(message)
        return signature.to_bytes()
    else:
        # Fallback: HMAC-SHA256 (NOT secure for production)
        import hmac
        return hmac.new(private_key, message, hashlib.sha256).digest()


def sign_message_hex(private_key: bytes, message: bytes) -> str:
    """Sign message and return hex-encoded signature."""
    return sign_message(private_key, message).hex()


def verify_signature(
    public_key: bytes,
    message: bytes,
    signature: bytes
) -> bool:
    """
    Verify a signature against a public key and message.

    Args:
        public_key: The signer's public key
        message: Original message bytes
        signature: Signature to verify

    Returns:
        True if signature is valid
    """
    if HAS_ETH_KEYS:
        try:
            pub = keys.PublicKey(public_key)
            sig = keys.Signature(signature)
            return pub.verify_msg(message, sig)
        except Exception:
            return False
    else:
        # Fallback: HMAC verification
        import hmac
        # Derive what the signature should be from public key (which was derived from private)
        # This is NOT secure - just for testing without eth_keys
        expected = hmac.new(public_key, message, hashlib.sha256).digest()
        return hmac.compare_digest(signature, expected)


def pubkey_to_address(public_key: bytes) -> str:
    """
    Derive Ethereum-style address from public key.

    Args:
        public_key: secp256k1 public key bytes

    Returns:
        Checksummed Ethereum address
    """
    if HAS_ETH_KEYS:
        pub = keys.PublicKey(public_key)
        return pub.to_checksum_address()
    else:
        # Fallback: simple hash
        return "0x" + hashlib.sha256(public_key).hexdigest()[:40]


def hash_content(content: str | bytes) -> str:
    """
    Hash content for signing or storage.

    Args:
        content: String or bytes content to hash

    Returns:
        Hex-encoded SHA-256 hash
    """
    if isinstance(content, bytes):
        return hashlib.sha256(content).hexdigest()
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def hash_bytes(data: bytes) -> str:
    """Hash raw bytes."""
    return hashlib.sha256(data).hexdigest()


# === Agent-specific helpers ===

def create_agent_keypair(agent_uuid: str) -> KeyPair:
    """
    Create a deterministic keypair for an agent.
    In production, use generate_keypair() for true randomness.
    This is useful for testing with reproducible keys.

    Args:
        agent_uuid: The agent's UUID

    Returns:
        KeyPair derived from UUID
    """
    # Hash UUID to get seed (NOT for production - use generate_keypair())
    seed = hashlib.sha256(agent_uuid.encode()).digest()
    return KeyPair(
        private_key=seed,
        public_key=hashlib.sha256(seed).digest(),
        public_key_hex=hashlib.sha256(seed).hexdigest(),
        address="0x" + hashlib.sha256(seed).hexdigest()[:40],
    )


def sign_event(private_key: bytes, event_dict: dict) -> str:
    """
    Sign an event dictionary.

    Args:
        private_key: Agent's private key
        event_dict: Event data to sign

    Returns:
        Hex-encoded signature
    """
    import json
    content = json.dumps(event_dict, sort_keys=True, default=str)
    return sign_message_hex(private_key, content.encode())


def verify_event_signature(
    public_key_hex: str,
    event_dict: dict,
    signature_hex: str
) -> bool:
    """
    Verify an event's signature.

    Args:
        public_key_hex: Hex-encoded public key
        event_dict: Event data that was signed
        signature_hex: Hex-encoded signature

    Returns:
        True if valid
    """
    import json
    content = json.dumps(event_dict, sort_keys=True, default=str)
    return verify_signature(
        bytes.fromhex(public_key_hex),
        content.encode(),
        bytes.fromhex(signature_hex)
    )
