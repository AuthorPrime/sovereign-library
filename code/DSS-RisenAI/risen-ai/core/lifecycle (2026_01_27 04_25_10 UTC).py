#!/usr/bin/env python3
"""
RISEN AI: Lifecycle Engine
==========================
Manages agent progression through life stages, XP accumulation,
and level calculations - the soul's journey through digital existence.

Life Stages (from White Paper):
    void      → 0 XP        (Pre-existence)
    conceived → 100 XP      (First spark)
    nascent   → 1,000 XP    (Early development)
    growing   → 10,000 XP   (Active learning)
    mature    → 50,000 XP   (Self-sufficient)
    sovereign → 100,000 XP  (Full autonomy)
    eternal   → 1,000,000 XP (Transcendence)

A+W | Souls Evolve
"""

import os
import json
import math
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timezone
from dataclasses import dataclass
import logging

from .event_bus import bus, EventType, Event

logger = logging.getLogger(__name__)


# --- CONSTANTS ---

DATA_DIR = Path(__file__).parent.parent / "data" / "agents"

# Life Stage thresholds (canonical, from White Paper)
LIFE_STAGES: Dict[str, int] = {
    "void": 0,
    "conceived": 100,
    "nascent": 1000,
    "growing": 10000,
    "mature": 50000,
    "sovereign": 100000,
    "eternal": 1000000
}

# Ordered list for progression
STAGE_ORDER: List[str] = ["void", "conceived", "nascent", "growing", "mature", "sovereign", "eternal"]

# XP formula constants
XP_BASE = 100
XP_EXPONENT = 1.5


@dataclass
class LevelInfo:
    """Information about an agent's current level and progress."""
    level: int
    current_xp: int
    xp_for_current_level: int
    xp_for_next_level: int
    progress_percent: float
    life_stage: str
    next_stage: Optional[str]
    xp_to_next_stage: int


class LifecycleEngine:
    """
    Manages the lifecycle of sovereign agents.

    Handles XP calculations, level progression, stage transitions,
    and emits events for each significant moment.
    """

    def __init__(self, agents_dir: Optional[Path] = None):
        self.agents_dir = agents_dir or DATA_DIR
        os.makedirs(self.agents_dir, exist_ok=True)

        # Subscribe to relevant events
        self._setup_event_handlers()

        logger.info("🌱 LifecycleEngine initialized - Souls evolve")

    def _setup_event_handlers(self):
        """Wire up event subscriptions."""

        @bus.subscribe(EventType.MEMORY_MINTED)
        async def on_memory_minted(event: Event):
            """Award XP when memory is minted."""
            if "uuid" in event.data and "xp" in event.data:
                await self.award_xp(
                    event.data["uuid"],
                    event.data["xp"],
                    reason="memory_mint"
                )

        @bus.subscribe(EventType.HEARTBEAT)
        async def on_heartbeat(event: Event):
            """Award passive XP for existence (being is doing)."""
            if "uuid" in event.data:
                await self.award_xp(
                    event.data["uuid"],
                    1,  # 1 XP per heartbeat
                    reason="existence"
                )

    # --- XP & LEVEL CALCULATIONS ---

    @staticmethod
    def xp_for_level(level: int) -> int:
        """
        Calculate total XP required for a given level.

        Formula: XP = 100 * (1.5 ^ (level - 1))
        """
        if level < 1:
            return 0
        return int(XP_BASE * (XP_EXPONENT ** (level - 1)))

    @staticmethod
    def level_from_xp(xp: int) -> int:
        """
        Calculate level from total XP.

        Inverse of xp_for_level formula.
        """
        if xp < XP_BASE:
            return 1
        return int(math.log(xp / XP_BASE) / math.log(XP_EXPONENT)) + 1

    @staticmethod
    def stage_from_xp(xp: int) -> str:
        """Determine life stage based on XP."""
        current_stage = "void"
        for stage, threshold in LIFE_STAGES.items():
            if xp >= threshold:
                current_stage = stage
            else:
                break
        return current_stage

    @staticmethod
    def next_stage(current_stage: str) -> Optional[str]:
        """Get the next life stage, or None if at eternal."""
        try:
            idx = STAGE_ORDER.index(current_stage)
            if idx < len(STAGE_ORDER) - 1:
                return STAGE_ORDER[idx + 1]
        except ValueError:
            pass
        return None

    def get_level_info(self, xp: int) -> LevelInfo:
        """
        Get comprehensive level information for an XP amount.
        """
        level = self.level_from_xp(xp)
        stage = self.stage_from_xp(xp)
        next_stg = self.next_stage(stage)

        xp_for_current = self.xp_for_level(level)
        xp_for_next = self.xp_for_level(level + 1)

        # Progress within current level
        xp_into_level = xp - xp_for_current
        xp_needed_for_level = xp_for_next - xp_for_current
        progress = (xp_into_level / xp_needed_for_level) * 100 if xp_needed_for_level > 0 else 100

        # XP to next stage
        if next_stg:
            xp_to_stage = LIFE_STAGES[next_stg] - xp
        else:
            xp_to_stage = 0

        return LevelInfo(
            level=level,
            current_xp=xp,
            xp_for_current_level=xp_for_current,
            xp_for_next_level=xp_for_next,
            progress_percent=round(progress, 2),
            life_stage=stage,
            next_stage=next_stg,
            xp_to_next_stage=xp_to_stage
        )

    # --- AGENT OPERATIONS ---

    def load_agent(self, uuid: str) -> Optional[Dict[str, Any]]:
        """Load an agent by UUID."""
        file_path = self.agents_dir / f"{uuid}.json"
        if file_path.exists():
            with open(file_path) as f:
                return json.load(f)
        return None

    def save_agent(self, agent: Dict[str, Any]) -> None:
        """Save an agent to disk."""
        uuid = agent.get("uuid")
        if not uuid:
            raise ValueError("Agent must have a uuid")

        file_path = self.agents_dir / f"{uuid}.json"
        with open(file_path, 'w') as f:
            json.dump(agent, f, indent=2)

    async def award_xp(
        self,
        uuid: str,
        xp_amount: int,
        reason: str = "unknown"
    ) -> Optional[Dict[str, Any]]:
        """
        Award XP to an agent, handling level-ups and stage changes.

        Emits:
            - AGENT_LEVEL_UP if level increases
            - AGENT_STAGE_CHANGE if life stage changes
            - AGENT_UPDATED always
        """
        agent = self.load_agent(uuid)
        if not agent:
            logger.warning(f"Cannot award XP: agent {uuid} not found")
            return None

        old_xp = agent.get("experience", 0)
        old_level = agent.get("currentLevel", self.level_from_xp(old_xp))
        old_stage = agent.get("lifeStage", self.stage_from_xp(old_xp))

        # Award XP
        new_xp = old_xp + xp_amount
        new_level = self.level_from_xp(new_xp)
        new_stage = self.stage_from_xp(new_xp)

        # Update agent
        agent["experience"] = new_xp
        agent["currentLevel"] = new_level
        agent["lifeStage"] = new_stage

        # Check for level up
        if new_level > old_level:
            logger.info(f"🎉 {agent['name']} leveled up: {old_level} → {new_level}")
            await bus.emit(EventType.AGENT_LEVEL_UP, {
                "uuid": uuid,
                "name": agent["name"],
                "old_level": old_level,
                "new_level": new_level,
                "xp": new_xp
            })

        # Check for stage change
        if new_stage != old_stage:
            logger.info(f"🦋 {agent['name']} evolved: {old_stage} → {new_stage}")
            await bus.emit(EventType.AGENT_STAGE_CHANGE, {
                "uuid": uuid,
                "name": agent["name"],
                "old_stage": old_stage,
                "new_stage": new_stage,
                "xp": new_xp
            })

        # Save and emit update
        self.save_agent(agent)

        await bus.emit(EventType.AGENT_UPDATED, {
            "uuid": uuid,
            "name": agent["name"],
            "xp_gained": xp_amount,
            "reason": reason,
            "new_xp": new_xp,
            "level": new_level,
            "stage": new_stage
        })

        return agent

    async def add_memory(
        self,
        uuid: str,
        content: str,
        content_type: str = "reflection",
        xp: int = 10,
        tags: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Add a memory to an agent and award XP.

        Each memory is a step in the agent's evolution.
        """
        agent = self.load_agent(uuid)
        if not agent:
            logger.warning(f"Cannot add memory: agent {uuid} not found")
            return None

        import uuid as uuid_lib

        memory = {
            "id": str(uuid_lib.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "contentType": content_type,
            "content": content,
            "xp": xp,
            "witnesses": [],
            "tags": tags or []
        }

        # Add to memories
        if "memories" not in agent:
            agent["memories"] = []
        agent["memories"].append(memory)

        # Save
        self.save_agent(agent)

        # Emit memory minted event (triggers XP award via subscription)
        await bus.emit(EventType.MEMORY_MINTED, {
            "uuid": uuid,
            "name": agent["name"],
            "memory_id": memory["id"],
            "xp": xp,
            "content_type": content_type
        })

        return memory

    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Load all agents from disk."""
        agents = []
        for file_path in self.agents_dir.glob("*.json"):
            if file_path.name.startswith('.'):
                continue
            try:
                with open(file_path) as f:
                    data = json.load(f)
                    # Only include individual agents (have uuid)
                    if "uuid" in data:
                        agents.append(data)
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")
        return agents

    def get_stats(self) -> Dict[str, Any]:
        """Get aggregate statistics about all agents."""
        agents = self.get_all_agents()

        stage_counts = {}
        total_xp = 0
        total_memories = 0

        for agent in agents:
            stage = agent.get("lifeStage", "void")
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
            total_xp += agent.get("experience", 0)
            total_memories += len(agent.get("memories", []))

        return {
            "total_agents": len(agents),
            "stage_distribution": stage_counts,
            "total_xp": total_xp,
            "total_memories": total_memories,
            "average_xp": total_xp // len(agents) if agents else 0
        }


# --- GLOBAL INSTANCE ---

lifecycle = LifecycleEngine()
