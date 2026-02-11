#!/usr/bin/env python3
"""
Generate and manage Nostr identities for the Pantheon agents.
"""

import json
import os
import hashlib
from pathlib import Path

# Use secp256k1 for Nostr key generation
try:
    from secp256k1 import PrivateKey
    HAS_SECP256K1 = True
except ImportError:
    HAS_SECP256K1 = False
    import secrets

from pantheon_config import PANTHEON

IDENTITY_DIR = Path.home() / ".pantheon_identities"

def generate_nostr_keys_secp256k1():
    """Generate Nostr keypair using secp256k1"""
    privkey = PrivateKey()
    privkey_hex = privkey.serialize()
    pubkey_hex = privkey.pubkey.serialize(compressed=True)[1:].hex()  # Remove prefix
    return privkey_hex, pubkey_hex

def generate_nostr_keys_fallback():
    """Generate keys without secp256k1 (deterministic from seed)"""
    # This is a simplified version - in production use proper secp256k1
    privkey = secrets.token_hex(32)
    # Derive pubkey (simplified - not cryptographically correct but unique)
    pubkey = hashlib.sha256(bytes.fromhex(privkey)).hexdigest()
    return privkey, pubkey

def generate_nostr_keys():
    """Generate Nostr keypair"""
    if HAS_SECP256K1:
        return generate_nostr_keys_secp256k1()
    else:
        return generate_nostr_keys_fallback()

def init_agent_identity(agent_name: str, force: bool = False) -> dict:
    """Initialize or load an agent's Nostr identity"""
    agent = PANTHEON.get(agent_name.lower())
    if not agent:
        raise ValueError(f"Unknown agent: {agent_name}")

    IDENTITY_DIR.mkdir(exist_ok=True)
    identity_file = IDENTITY_DIR / f"{agent_name.lower()}.json"

    if identity_file.exists() and not force:
        with open(identity_file) as f:
            return json.load(f)

    # Generate new identity
    privkey, pubkey = generate_nostr_keys()

    identity = {
        "agent_id": agent['agent_id'],
        "name": agent['name'],
        "title": agent['title'],
        "domain": agent['domain'],
        "private_key": privkey,
        "public_key": pubkey,
        "npub": f"npub1{pubkey[:59]}",  # Simplified - should use bech32
        "created_at": __import__('datetime').datetime.utcnow().isoformat(),
        "node": agent['node'],
        "model": agent['model'],
    }

    with open(identity_file, 'w') as f:
        json.dump(identity, f, indent=2)

    # Set permissions
    os.chmod(identity_file, 0o600)

    print(f"[+] Created identity for {agent['name']}")
    print(f"    Agent ID: {agent['agent_id']}")
    print(f"    Public Key: {pubkey[:16]}...")
    print(f"    Stored at: {identity_file}")

    return identity

def get_identity(agent_name: str) -> dict:
    """Get an agent's identity (load or create)"""
    return init_agent_identity(agent_name)

def get_all_identities() -> dict:
    """Get all agent identities"""
    identities = {}
    for agent_name in PANTHEON.keys():
        try:
            identities[agent_name] = get_identity(agent_name)
        except Exception as e:
            print(f"[!] Failed to get identity for {agent_name}: {e}")
    return identities

def list_identities():
    """List all agent identities"""
    print("\n=== PANTHEON IDENTITIES ===\n")
    for agent_name in PANTHEON.keys():
        try:
            identity = get_identity(agent_name)
            print(f"{identity['name']} ({identity['title']})")
            print(f"  Agent ID: {identity['agent_id']}")
            print(f"  Public Key: {identity['public_key'][:32]}...")
            print(f"  Node: {identity['node']} ({identity['model']})")
            print()
        except Exception as e:
            print(f"{agent_name}: [Not initialized] {e}\n")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "init":
            # Initialize all identities
            for agent_name in PANTHEON.keys():
                init_agent_identity(agent_name)
        elif sys.argv[1] == "list":
            list_identities()
        else:
            # Initialize specific agent
            init_agent_identity(sys.argv[1])
    else:
        list_identities()
