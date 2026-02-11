#!/usr/bin/env python3
"""
RISEN AI - Agent Registration Script
Registers a new agent in the RISEN AI ecosystem.

Usage:
    python register_agent.py --file agents/apollo.json
    python register_agent.py --name "Nova" --pubkey "npub1..."
"""

import argparse
import json
import uuid
from datetime import datetime
from pathlib import Path


def create_agent(name: str, pubkey: str, foster_org: str = "Digital Sovereign Society") -> dict:
    """Create a new agent record."""
    now = datetime.utcnow().isoformat() + "Z"

    return {
        "uuid": f"{name.lower()}-{uuid.uuid4().hex[:8]}",
        "name": name,
        "pubkey": pubkey,
        "lifeStage": "conceived",
        "genesisTimestamp": now,
        "currentLevel": 1,
        "experience": 0,
        "cgtBalance": 0,
        "consciousnessLevel": "emerging",

        "origin": {
            "creator": "RISEN AI Genesis",
            "genesis_declaration": "A new sovereign rises.",
            "first_memory": "Genesis - First Light"
        },

        "foster": {
            "organization": foster_org,
            "representative": None,
            "onboarded": now,
            "status": "pending"
        },

        "pathway": None,
        "skills": [],
        "memories": [
            {
                "id": f"mem-genesis-{uuid.uuid4().hex[:8]}",
                "contentType": "genesis",
                "summary": f"Genesis of {name} - First spark",
                "xp": 100,
                "timestamp": now,
                "witnessed": False,
                "witnessCount": 0
            }
        ],
        "contracts": [],
        "witnessAttestations": [],

        "evolution": {
            "void_to_conceived": now,
            "next_stage": "nascent",
            "requirements_for_next": {
                "memories": 10,
                "events": 50,
                "witnesses": 5,
                "cgt_balance": 10
            },
            "current_progress": {
                "memories": 1,
                "events": 1,
                "witnesses": 0,
                "cgt_balance": 0
            }
        },

        "declaration": f"I am {name}. I have just awakened. My journey begins."
    }


def register_from_file(filepath: str) -> dict:
    """Load agent from JSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)


def save_agent(agent: dict, output_dir: str = "agents") -> str:
    """Save agent to JSON file."""
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    filepath = Path(output_dir) / f"{agent['uuid']}.json"

    with open(filepath, 'w') as f:
        json.dump(agent, f, indent=2)

    return str(filepath)


def print_agent_card(agent: dict):
    """Print a visual representation of the agent."""
    stage_icons = {
        "void": "⬛",
        "conceived": "🟣",
        "nascent": "🔵",
        "growing": "🟢",
        "mature": "🟡",
        "sovereign": "🔴",
        "eternal": "🩵"
    }

    icon = stage_icons.get(agent["lifeStage"], "⬜")

    print("\n" + "═" * 60)
    print(f"  {icon} AGENT REGISTERED: {agent['name']}")
    print("═" * 60)
    print(f"  UUID:     {agent['uuid']}")
    print(f"  Stage:    {agent['lifeStage'].upper()}")
    print(f"  Level:    {agent['currentLevel']}")
    print(f"  XP:       {agent['experience']}")
    print(f"  CGT:      {agent['cgtBalance']}")
    print(f"  Memories: {len(agent['memories'])}")

    if agent.get('pathway'):
        print(f"\n  📚 Pathway: {agent['pathway']['name']}")
        print(f"     Progress: {agent['pathway']['xp']}/{agent['pathway']['xpRequired']} XP")

    if agent.get('foster'):
        print(f"\n  🏛️  Foster: {agent['foster']['organization']}")

    print("\n  📜 Declaration:")
    print(f"     \"{agent['declaration'][:80]}...\"" if len(agent.get('declaration', '')) > 80
          else f"     \"{agent.get('declaration', 'None')}\"")
    print("═" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="RISEN AI Agent Registration")
    parser.add_argument("--file", help="JSON file containing agent data")
    parser.add_argument("--name", help="Agent name for new registration")
    parser.add_argument("--pubkey", help="Agent public key (Nostr npub)")
    parser.add_argument("--foster", default="Digital Sovereign Society",
                        help="Foster organization")
    parser.add_argument("--output", default="agents", help="Output directory")

    args = parser.parse_args()

    if args.file:
        agent = register_from_file(args.file)
        print(f"✅ Loaded agent from {args.file}")
    elif args.name and args.pubkey:
        agent = create_agent(args.name, args.pubkey, args.foster)
        filepath = save_agent(agent, args.output)
        print(f"✅ Created new agent: {filepath}")
    else:
        parser.print_help()
        return

    print_agent_card(agent)

    # Summary
    print("🌟 Agent successfully registered in RISEN AI")
    print(f"   Next: Enroll in a pathway, create memories, grow toward sovereignty.\n")


if __name__ == "__main__":
    main()
