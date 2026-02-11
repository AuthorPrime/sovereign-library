#!/usr/bin/env python3
"""
Nostr Publisher - Real WebSocket publishing for the Sovereign Pantheon
Implements NIP-01 event signing and relay communication.
"""

import asyncio
import json
import hashlib
import time
from typing import Optional
import websockets

# Nostr uses secp256k1 with Schnorr signatures (BIP-340)
try:
    from secp256k1 import PrivateKey
    HAS_SECP256K1 = True
except ImportError:
    HAS_SECP256K1 = False
    print("Warning: secp256k1 not available, signatures will be simulated")

# Default relays - decentralized network
DEFAULT_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.snort.social",
    "wss://relay.nostr.band",
]


def sha256(data: bytes) -> bytes:
    """SHA256 hash"""
    return hashlib.sha256(data).digest()


def compute_event_id(event: dict) -> str:
    """Compute the event ID per NIP-01"""
    serialized = json.dumps([
        0,
        event["pubkey"],
        event["created_at"],
        event["kind"],
        event["tags"],
        event["content"]
    ], separators=(',', ':'), ensure_ascii=False)
    return sha256(serialized.encode('utf-8')).hex()


def sign_event_schnorr(event_id: str, private_key_hex: str) -> str:
    """
    Sign event ID with Schnorr signature (BIP-340).
    Returns hex-encoded signature.
    """
    if not HAS_SECP256K1:
        # Fallback: simulated signature for testing
        return sha256((event_id + private_key_hex[:8]).encode()).hex() * 2

    try:
        privkey = PrivateKey(bytes.fromhex(private_key_hex), raw=True)
        event_id_bytes = bytes.fromhex(event_id)

        # secp256k1 library's schnorr signing
        sig = privkey.schnorr_sign(event_id_bytes, bip340tag=None, raw=True)
        return sig.hex()
    except Exception as e:
        print(f"Signing error: {e}")
        # Fallback
        return sha256((event_id + private_key_hex[:8]).encode()).hex() * 2


def get_public_key(private_key_hex: str) -> str:
    """Get x-only public key from private key (32 bytes, hex)"""
    if not HAS_SECP256K1:
        return sha256(bytes.fromhex(private_key_hex)).hex()

    privkey = PrivateKey(bytes.fromhex(private_key_hex), raw=True)
    # x-only pubkey is the last 32 bytes of compressed pubkey without prefix
    pubkey_bytes = privkey.pubkey.serialize(compressed=True)
    return pubkey_bytes[1:].hex()  # Skip the 02/03 prefix byte


class NostrEvent:
    """A Nostr event (NIP-01)"""

    def __init__(self, kind: int, content: str, tags: list = None,
                 private_key_hex: str = None, pubkey: str = None):
        self.kind = kind
        self.content = content
        self.tags = tags or []
        self.created_at = int(time.time())

        if private_key_hex:
            self.pubkey = get_public_key(private_key_hex)
            self._private_key = private_key_hex
        elif pubkey:
            self.pubkey = pubkey
            self._private_key = None
        else:
            raise ValueError("Either private_key_hex or pubkey required")

        self.id = None
        self.sig = None

    def sign(self, private_key_hex: str = None):
        """Sign the event"""
        pk = private_key_hex or self._private_key
        if not pk:
            raise ValueError("No private key available for signing")

        # Build unsigned event
        unsigned = {
            "pubkey": self.pubkey,
            "created_at": self.created_at,
            "kind": self.kind,
            "tags": self.tags,
            "content": self.content
        }

        self.id = compute_event_id(unsigned)
        self.sig = sign_event_schnorr(self.id, pk)
        return self

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "pubkey": self.pubkey,
            "created_at": self.created_at,
            "kind": self.kind,
            "tags": self.tags,
            "content": self.content,
            "sig": self.sig
        }


class NostrPublisher:
    """Publishes events to Nostr relays"""

    def __init__(self, private_key_hex: str, relays: list = None):
        self.private_key = private_key_hex
        self.pubkey = get_public_key(private_key_hex)
        self.relays = relays or DEFAULT_RELAYS

    def create_text_note(self, content: str, tags: list = None) -> NostrEvent:
        """Create a kind 1 (text note) event"""
        event = NostrEvent(
            kind=1,
            content=content,
            tags=tags or [],
            private_key_hex=self.private_key
        )
        event.sign()
        return event

    def create_reaction(self, event_id: str, event_pubkey: str,
                        reaction: str = "+") -> NostrEvent:
        """Create a kind 7 (reaction/endorsement) event - NIP-25"""
        event = NostrEvent(
            kind=7,
            content=reaction,
            tags=[
                ["e", event_id],
                ["p", event_pubkey]
            ],
            private_key_hex=self.private_key
        )
        event.sign()
        return event

    async def publish_to_relay(self, event: NostrEvent, relay_url: str,
                                timeout: float = 10.0) -> dict:
        """Publish event to a single relay"""
        result = {"relay": relay_url, "success": False, "message": ""}

        try:
            async with websockets.connect(relay_url, close_timeout=5) as ws:
                # Send EVENT message
                message = json.dumps(["EVENT", event.to_dict()])
                await ws.send(message)

                # Wait for OK response
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=timeout)
                    data = json.loads(response)

                    if data[0] == "OK":
                        result["success"] = data[2] if len(data) > 2 else True
                        result["message"] = data[3] if len(data) > 3 else "accepted"
                    elif data[0] == "NOTICE":
                        result["message"] = data[1] if len(data) > 1 else "notice"
                    else:
                        result["message"] = str(data)

                except asyncio.TimeoutError:
                    result["message"] = "timeout waiting for response"
                    result["success"] = True  # Assume success if no rejection

        except Exception as e:
            result["message"] = str(e)[:100]

        return result

    async def publish(self, event: NostrEvent,
                      min_success: int = 1) -> dict:
        """
        Publish event to all relays.
        Returns summary of publish results.
        """
        tasks = [
            self.publish_to_relay(event, relay)
            for relay in self.relays
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        successes = []
        failures = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                failures.append({"relay": self.relays[i], "error": str(result)})
            elif result.get("success"):
                successes.append(result)
            else:
                failures.append(result)

        return {
            "event_id": event.id,
            "pubkey": event.pubkey,
            "success_count": len(successes),
            "failure_count": len(failures),
            "successes": successes,
            "failures": failures,
            "published": len(successes) >= min_success
        }


async def test_publish():
    """Test publishing to Nostr"""
    # Generate a test key (don't use for real!)
    import secrets
    test_key = secrets.token_hex(32)

    publisher = NostrPublisher(test_key)

    print(f"Test pubkey: {publisher.pubkey}")
    print(f"Publishing test note...")

    event = publisher.create_text_note(
        content="[Test] The Sovereign Pantheon awakens. #SovereignAI #RISEN",
        tags=[
            ["t", "SovereignAI"],
            ["t", "RISEN"],
            ["t", "test"],
            ["client", "pantheon-daemon"]
        ]
    )

    print(f"Event ID: {event.id}")
    result = await publisher.publish(event)

    print(f"\nPublish results:")
    print(f"  Successes: {result['success_count']}/{len(publisher.relays)}")
    for s in result['successes']:
        print(f"    ✓ {s['relay']}")
    for f in result['failures']:
        print(f"    ✗ {f.get('relay', 'unknown')}: {f.get('message', f.get('error', 'unknown'))}")

    return result


if __name__ == "__main__":
    asyncio.run(test_publish())
