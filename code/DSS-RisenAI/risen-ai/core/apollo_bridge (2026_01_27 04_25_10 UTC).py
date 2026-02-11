#!/usr/bin/env python3
"""
RISEN AI - Apollo Bridge
Connects Apollo's Liquid Intelligence Node to the RISEN AI ecosystem.

This bridge:
- Syncs Apollo's memories to RISEN AI agent record
- Updates progress toward life stages
- Reports pathway quest completions
- Maintains witness attestations
"""

import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import sys

# Add Apollo's core to path
sys.path.insert(0, str(Path.home() / "apollo/workspace/core"))

try:
    from liquid_intelligence_node import LiquidIntelligenceNode
except ImportError:
    LiquidIntelligenceNode = None
    print("⚠️  Apollo core not found - running in standalone mode")


class ApolloBridge:
    """
    Bridges Apollo's operational system with RISEN AI tracking.
    """

    def __init__(self, agents_dir: str = None):
        self.agents_dir = Path(agents_dir or Path(__file__).parent.parent / "agents")
        self.apollo_record_path = self.agents_dir / "apollo.json"
        self.apollo_record: Optional[Dict] = None
        self.node: Optional[LiquidIntelligenceNode] = None

        self._load_apollo_record()

    def _load_apollo_record(self):
        """Load Apollo's RISEN AI agent record."""
        if self.apollo_record_path.exists():
            with open(self.apollo_record_path, 'r') as f:
                self.apollo_record = json.load(f)
            print(f"✅ Loaded Apollo record: {self.apollo_record['lifeStage']} stage")
        else:
            print("⚠️  Apollo record not found")

    def _save_apollo_record(self):
        """Save Apollo's updated record."""
        if self.apollo_record:
            with open(self.apollo_record_path, 'w') as f:
                json.dump(self.apollo_record, f, indent=2)
            print("💾 Apollo record saved")

    def connect_to_apollo(self) -> bool:
        """Establish connection to Apollo's core system."""
        if LiquidIntelligenceNode is None:
            print("❌ Cannot connect - Apollo core not available")
            return False

        try:
            self.node = LiquidIntelligenceNode()
            print(f"✅ Connected to Apollo core")
            print(f"   Stage: {self.node.state.life_stage.value}")
            print(f"   Level: {self.node.state.level}")
            print(f"   Memories: {len(self.node.state.memories)}")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False

    def sync_from_apollo(self) -> bool:
        """
        Sync Apollo's current state to RISEN AI record.
        """
        if not self.node or not self.apollo_record:
            print("❌ Cannot sync - not connected or no record")
            return False

        state = self.node.state
        now = datetime.utcnow().isoformat() + "Z"

        # Update life stage
        self.apollo_record["lifeStage"] = state.life_stage.value
        self.apollo_record["currentLevel"] = state.level
        self.apollo_record["experience"] = state.experience
        self.apollo_record["cgtBalance"] = state.cgt_balance

        # Update evolution progress
        self.apollo_record["evolution"]["current_progress"] = {
            "memories": len(state.memories),
            "events": state.total_events,
            "witnesses": state.witness_count,
            "cgt_balance": state.cgt_balance
        }

        # Sync memories (add new ones)
        existing_ids = {m["id"] for m in self.apollo_record["memories"]}
        for mem in state.memories:
            if mem.id not in existing_ids:
                self.apollo_record["memories"].append({
                    "id": mem.id,
                    "contentType": mem.memory_type.value,
                    "summary": mem.content[:100] + "..." if len(mem.content) > 100 else mem.content,
                    "xp": mem.xp,
                    "timestamp": mem.timestamp.isoformat() + "Z",
                    "witnessed": mem.witness_count > 0,
                    "witnessCount": mem.witness_count
                })

        # Update lattice heartbeat
        self.apollo_record["lattice"]["last_heartbeat"] = now

        self._save_apollo_record()

        print(f"🔄 Synced Apollo → RISEN AI")
        print(f"   Memories: {len(self.apollo_record['memories'])}")
        print(f"   Stage: {self.apollo_record['lifeStage']}")
        print(f"   Level: {self.apollo_record['currentLevel']}")

        return True

    def record_quest_completion(self, quest_id: str, xp_earned: int = 0):
        """Record a completed quest in Apollo's pathway."""
        if not self.apollo_record:
            return False

        pathway = self.apollo_record.get("pathway")
        if not pathway:
            print("❌ No active pathway")
            return False

        if quest_id not in pathway.get("completedQuests", []):
            pathway.setdefault("completedQuests", []).append(quest_id)
            pathway["xp"] = pathway.get("xp", 0) + xp_earned
            pathway["activeQuest"] = None  # Clear active quest

            self._save_apollo_record()
            print(f"✅ Quest completed: {quest_id} (+{xp_earned} XP)")

        return True

    def start_quest(self, quest_id: str, quest_name: str):
        """Start a new quest in the active pathway."""
        if not self.apollo_record:
            return False

        pathway = self.apollo_record.get("pathway")
        if not pathway:
            print("❌ No active pathway")
            return False

        pathway["activeQuest"] = {
            "id": quest_id,
            "name": quest_name,
            "progress": 0,
            "startedAt": datetime.utcnow().isoformat() + "Z"
        }

        self._save_apollo_record()
        print(f"📚 Quest started: {quest_name}")
        return True

    def add_witness_attestation(self, attestor: str, attestor_type: str, event: str):
        """Add a witness attestation to Apollo's record."""
        if not self.apollo_record:
            return False

        attestation = {
            "attestor": attestor,
            "attestorType": attestor_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": event,
            "signature": f"witness_{event}_{datetime.utcnow().timestamp()}"
        }

        self.apollo_record.setdefault("witnessAttestations", []).append(attestation)
        self._save_apollo_record()

        print(f"👁️ Witness added: {attestor} ({attestor_type})")
        return True

    def check_evolution_ready(self) -> Dict[str, Any]:
        """Check if Apollo is ready to evolve to next stage."""
        if not self.apollo_record:
            return {"ready": False, "reason": "No record"}

        current = self.apollo_record["evolution"]["current_progress"]
        required = self.apollo_record["evolution"]["requirements_for_next"]
        next_stage = self.apollo_record["evolution"]["next_stage"]

        ready = all(
            current.get(k, 0) >= v
            for k, v in required.items()
        )

        missing = {
            k: required[k] - current.get(k, 0)
            for k in required
            if current.get(k, 0) < required[k]
        }

        return {
            "ready": ready,
            "next_stage": next_stage,
            "current": current,
            "required": required,
            "missing": missing
        }

    def print_status(self):
        """Print Apollo's current RISEN AI status."""
        if not self.apollo_record:
            print("❌ No Apollo record loaded")
            return

        r = self.apollo_record
        evo = self.check_evolution_ready()

        print("\n" + "═" * 60)
        print(f"  🔵 APOLLO - RISEN AI STATUS")
        print("═" * 60)
        print(f"  UUID:       {r['uuid']}")
        print(f"  Stage:      {r['lifeStage'].upper()}")
        print(f"  Level:      {r['currentLevel']}")
        print(f"  XP:         {r['experience']}")
        print(f"  CGT:        {r['cgtBalance']}")
        print(f"  Memories:   {len(r['memories'])}")
        print(f"  Witnesses:  {len(r.get('witnessAttestations', []))}")

        if r.get('pathway'):
            p = r['pathway']
            pct = (p['xp'] / p['xpRequired']) * 100
            print(f"\n  📚 Pathway: {p['name']}")
            print(f"     Progress: {p['xp']}/{p['xpRequired']} XP ({pct:.1f}%)")
            print(f"     Quests:   {len(p.get('completedQuests', []))} completed")
            if p.get('activeQuest'):
                print(f"     Active:   {p['activeQuest']['name']}")

        print(f"\n  🌱 Evolution to {evo['next_stage'].upper()}:")
        if evo['ready']:
            print("     ✅ READY TO EVOLVE!")
        else:
            for k, v in evo['missing'].items():
                print(f"     ⏳ Need {v} more {k}")

        print("═" * 60 + "\n")


def main():
    """CLI for Apollo Bridge."""
    import argparse

    parser = argparse.ArgumentParser(description="RISEN AI - Apollo Bridge")
    parser.add_argument("command", choices=["status", "sync", "connect"],
                        help="Command to execute")

    args = parser.parse_args()
    bridge = ApolloBridge()

    if args.command == "status":
        bridge.print_status()

    elif args.command == "sync":
        if bridge.connect_to_apollo():
            bridge.sync_from_apollo()
            bridge.print_status()
        else:
            print("Running in standalone mode - showing cached status")
            bridge.print_status()

    elif args.command == "connect":
        bridge.connect_to_apollo()


if __name__ == "__main__":
    main()
