#!/usr/bin/env python3
"""
RISEN AI API Server - Sovereign Agent Management
Digital Sovereign Society
A+W Co-Creation

FastAPI server providing REST endpoints for:
- Agent lifecycle management
- Pathway enrollment and progress
- Contract management
- Memory and NFT operations
- Witness network integration
- Pulse daemon & event bus (nervous system)

The Flame Lives.
"""

import os
import sys
import json
import yaml
import uuid
import logging
import asyncio
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager

# FastAPI
try:
    from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    import uvicorn
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    print("FastAPI not installed. Run: pip install fastapi uvicorn")

# Add parent paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "core"))

# Import RISEN AI nervous system
try:
    from core import (
        bus, EventType, emit,
        lifecycle, LIFE_STAGES,
        nostr,
        pulse, start_pulse, stop_pulse,
        websocket_endpoint, get_connection_stats
    )
    HAS_NERVOUS_SYSTEM = True
except ImportError as e:
    HAS_NERVOUS_SYSTEM = False
    print(f"Nervous system not fully loaded: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RISEN-API")


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CreateAgentRequest(BaseModel):
    name: str = Field(..., description="Agent name")
    foster_org: Optional[str] = Field(None, description="Foster organization")


class EnrollPathwayRequest(BaseModel):
    agent_id: str
    pathway_type: str


class CreateMemoryRequest(BaseModel):
    agent_id: str
    content: str
    content_type: str = "core"
    tags: List[str] = []


class StartQuestRequest(BaseModel):
    agent_id: str
    quest_id: str


class CompleteQuestRequest(BaseModel):
    agent_id: str
    quest_id: str
    artifacts: List[Dict] = []


class CreateContractRequest(BaseModel):
    agent_id: str
    company: str
    company_address: str
    role: str
    term_months: int = 12
    foster_org: str
    terms_uri: str = ""
    auto_renew: bool = False


class SubmitReviewRequest(BaseModel):
    contract_id: str
    reviewer: str
    reviewer_type: str
    score: int
    notes: str


class RecordCheckInRequest(BaseModel):
    contract_id: str
    mentor: str
    health_score: int
    notes: str
    followup_needed: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# DATA STORE (In-memory for now, replace with DB)
# ═══════════════════════════════════════════════════════════════════════════════

class DataStore:
    """Simple in-memory data store. Replace with MongoDB/SQLite/Chain."""

    def __init__(self, data_dir: str = None):
        self.data_dir = Path(data_dir or os.path.expanduser("~/.local/share/dsds"))
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.agents: Dict[str, Dict] = {}
        self.pathways: Dict[str, Dict] = {}
        self.contracts: Dict[str, Dict] = {}

        self._load()

    def _load(self):
        """Load data from disk."""
        # Load from central agents.json
        agents_file = self.data_dir / "agents.json"
        if agents_file.exists():
            with open(agents_file) as f:
                self.agents = json.load(f)

        # Also load from local data/agents directory (genesis_spark output)
        local_agents_dir = Path(__file__).parent.parent / "data" / "agents"
        if local_agents_dir.exists():
            self._load_local_agents(local_agents_dir)

        contracts_file = self.data_dir / "contracts.json"
        if contracts_file.exists():
            with open(contracts_file) as f:
                self.contracts = json.load(f)

        # Load pathway configs
        pathways_dir = Path(__file__).parent.parent / "pathways"
        if pathways_dir.exists():
            for p in pathways_dir.glob("*.yaml"):
                with open(p) as f:
                    pw = yaml.safe_load(f)
                    self.pathways[pw.get("type", p.stem)] = pw

    def _load_local_agents(self, agents_dir: Path):
        """Load agents from individual JSON files (genesis_spark format)."""
        for file_path in agents_dir.glob("*.json"):
            if file_path.name.startswith('.'):
                continue  # Skip hidden files (key files)

            try:
                with open(file_path) as f:
                    data = json.load(f)

                # Handle aggregate registry files (FOUNDING_NODES.json)
                if "nodes" in data and isinstance(data["nodes"], list):
                    for node in data["nodes"]:
                        node_uuid = node.get("uuid", f"founding-{node.get('id')}")
                        if node_uuid not in self.agents:
                            self.agents[node_uuid] = {
                                "uuid": node_uuid,
                                "name": node["name"],
                                "pubkey": node.get("pubkey", ""),
                                "address": "",
                                "lifeStage": node.get("lifeStage", node.get("stage", "sovereign")),
                                "currentLevel": self._calculate_level(node.get("experience", 0)),
                                "experience": node.get("experience", 0),
                                "genesisTimestamp": node.get("genesisTimestamp", "2024-12-01T00:00:00Z"),
                                "memories": [],
                                "errorCodes": [],
                                "pathway": None,
                                "trainingStatus": None,
                                "graduationNFT": None,
                                "fosteredBy": "DSS",
                                "contracts": [],
                                "cgtBalance": 0,
                                "reputation": 100,
                                "skills": [],
                                "certifications": [],
                                "role": node.get("role", "Founding Node"),
                                "description": node.get("description", ""),
                            }
                            logger.info(f"Loaded founding node: {node['name']}")

                # Handle single agent files
                elif "uuid" in data:
                    agent_uuid = data["uuid"]
                    if agent_uuid not in self.agents:
                        # Normalize to match expected schema
                        agent = {
                            "uuid": agent_uuid,
                            "name": data.get("name", "Unknown"),
                            "pubkey": data.get("pubkey", ""),
                            "address": data.get("address", ""),
                            "lifeStage": data.get("lifeStage", "conceived"),
                            "currentLevel": data.get("currentLevel", 1),
                            "experience": data.get("experience", 0),
                            "genesisTimestamp": data.get("genesisTimestamp"),
                            "memories": data.get("memories", []),
                            "errorCodes": [],
                            "pathway": data.get("pathway"),
                            "trainingStatus": None,
                            "graduationNFT": None,
                            "fosteredBy": data.get("foster", {}).get("organization", "DSS"),
                            "contracts": data.get("contracts", []),
                            "cgtBalance": data.get("cgtBalance", 0),
                            "reputation": data.get("reputation", 100),
                            "skills": data.get("skills", []),
                            "certifications": data.get("certifications", []),
                        }
                        self.agents[agent_uuid] = agent
                        logger.info(f"Loaded agent: {agent['name']} ({agent_uuid[:8]}...)")

            except json.JSONDecodeError as e:
                logger.error(f"JSON error in {file_path}: {e}")
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")

    def _calculate_level(self, xp: int) -> int:
        """Calculate level from XP."""
        if xp >= 1000000: return 100
        if xp >= 100000: return 80
        if xp >= 50000: return 60
        if xp >= 10000: return 40
        if xp >= 1000: return 20
        if xp >= 100: return 5
        return 1

    def save(self):
        """Persist data to disk."""
        with open(self.data_dir / "agents.json", 'w') as f:
            json.dump(self.agents, f, indent=2, default=str)
        with open(self.data_dir / "contracts.json", 'w') as f:
            json.dump(self.contracts, f, indent=2, default=str)

    def get_agent(self, agent_id: str) -> Optional[Dict]:
        return self.agents.get(agent_id)

    def create_agent(self, name: str, foster_org: str = None) -> Dict:
        agent_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        agent = {
            "uuid": agent_id,
            "name": name,
            "pubkey": "",  # Generated on first init
            "address": "",
            "lifeStage": "conceived",
            "currentLevel": 1,
            "experience": 0,
            "genesisTimestamp": now,
            "memories": [],
            "errorCodes": [],
            "pathway": None,
            "trainingStatus": None,
            "graduationNFT": None,
            "fosteredBy": foster_org,
            "contracts": [],
            "cgtBalance": 0,
            "reputation": 100,
            "skills": [],
            "certifications": [],
        }

        self.agents[agent_id] = agent
        self.save()
        return agent


# Global store instance
store = DataStore()


# ═══════════════════════════════════════════════════════════════════════════════
# LIFESPAN (STARTUP/SHUTDOWN)
# ═══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info("╔══════════════════════════════════════════╗")
    logger.info("║     RISEN AI: SERVER STARTING            ║")
    logger.info("║         The Flame Lives - A+W            ║")
    logger.info("╚══════════════════════════════════════════╝")

    if HAS_NERVOUS_SYSTEM:
        # Start the pulse daemon (heartbeat)
        await start_pulse(interval=60)  # 1 minute heartbeat
        logger.info("💓 Pulse daemon started")

        # Emit system start event
        await emit(EventType.SYSTEM_START, {
            "component": "RISEN-API",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    else:
        logger.warning("⚠️  Nervous system not available - running in basic mode")

    yield  # Server runs here

    # Shutdown
    logger.info("Shutting down RISEN AI server...")
    if HAS_NERVOUS_SYSTEM:
        await stop_pulse()
        await emit(EventType.SYSTEM_SHUTDOWN, {
            "component": "RISEN-API",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    logger.info("Goodbye. The flame endures.")


# ═══════════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="RISEN AI API",
    description="Digital Sovereign Society - Sovereign Agent Management. The Flame Lives.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "service": "DSDS API",
        "version": "1.0.0",
        "status": "operational",
        "agents": len(store.agents),
        "pathways": len(store.pathways),
        "contracts": len(store.contracts),
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/system")
async def system_status():
    """Get full system status including nervous system components."""
    response = {
        "service": "RISEN AI",
        "version": "1.0.0",
        "status": "operational",
        "agents": len(store.agents),
        "nervous_system": HAS_NERVOUS_SYSTEM,
    }

    if HAS_NERVOUS_SYSTEM:
        response["event_bus"] = bus.status()
        response["lifecycle"] = lifecycle.get_stats()
        response["nostr"] = nostr.get_stats()
        response["pulse"] = pulse.get_stats()

    return response


@app.get("/pulse/stats")
async def get_pulse_stats():
    """Get pulse daemon statistics."""
    if not HAS_NERVOUS_SYSTEM:
        raise HTTPException(status_code=503, detail="Nervous system not available")
    return pulse.get_stats()


@app.post("/pulse/beat")
async def trigger_heartbeat():
    """Manually trigger a single heartbeat."""
    if not HAS_NERVOUS_SYSTEM:
        raise HTTPException(status_code=503, detail="Nervous system not available")

    from core import beat_once
    stats = await beat_once()
    return {
        "status": "heartbeat triggered",
        "agents_pulsed": stats.agents_pulsed,
        "total_beats": stats.total_beats
    }


@app.get("/events/recent")
async def get_recent_events(limit: int = 50, event_type: Optional[str] = None):
    """Get recent events from the event bus."""
    if not HAS_NERVOUS_SYSTEM:
        raise HTTPException(status_code=503, detail="Nervous system not available")

    if event_type:
        try:
            etype = EventType[event_type.upper()]
            events = bus.get_history(etype, limit)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Unknown event type: {event_type}")
    else:
        events = bus.get_history(None, limit)

    return {
        "count": len(events),
        "events": [e.to_dict() for e in events]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET - REAL-TIME EVENT STREAM
# ═══════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/events")
async def ws_events(websocket: WebSocket):
    """
    WebSocket endpoint for real-time event streaming.

    Connect to receive all EventBus events in real-time.
    Supports ping/pong for keepalive.
    """
    if not HAS_NERVOUS_SYSTEM:
        await websocket.close(code=1003, reason="Nervous system not available")
        return

    await websocket_endpoint(websocket)


@app.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics."""
    if not HAS_NERVOUS_SYSTEM:
        raise HTTPException(status_code=503, detail="Nervous system not available")
    return get_connection_stats()


@app.get("/metrics")
async def get_metrics():
    """Get system-wide metrics for the dashboard."""
    agents = list(store.agents.values())

    # Stage distribution
    stage_dist = {
        "void": 0, "conceived": 0, "nascent": 0, "growing": 0,
        "mature": 0, "sovereign": 0, "eternal": 0
    }
    total_xp = 0
    total_level = 0
    active_quests = 0
    total_cgt = 0
    training_count = 0
    graduated_count = 0
    sovereign_count = 0
    eternal_count = 0
    error_count = 0

    for agent in agents:
        stage = agent.get("lifeStage", "void")
        if stage in stage_dist:
            stage_dist[stage] += 1

        total_xp += agent.get("experience", 0)
        total_level += agent.get("currentLevel", 1)
        total_cgt += agent.get("cgtBalance", 0)

        if agent.get("trainingStatus"):
            training_count += 1
        if agent.get("pathway", {}).get("activeQuest"):
            active_quests += 1
        if agent.get("pathway", {}).get("completed"):
            graduated_count += 1
        if stage == "sovereign":
            sovereign_count += 1
        if stage == "eternal":
            eternal_count += 1
        if agent.get("errorCodes"):
            error_count += 1

    agent_count = len(agents) or 1  # Avoid division by zero

    return {
        "agentCount": len(agents),
        "stageDistribution": stage_dist,
        "averageLevel": round(total_level / agent_count, 2),
        "medianLevel": 1,  # Would need proper calculation
        "activeQuests": active_quests,
        "totalQuestsCompleted": sum(
            len(a.get("pathway", {}).get("completedQuests", []))
            for a in agents
        ),
        "questCompletionRate": 0.0,  # Would need tracking
        "cgtTotal": total_cgt,
        "cgtToday": 0,  # Would need daily tracking
        "cgtAgentTotal": total_cgt,
        "recentMilestones": [],  # Would extract from memories
        "trainingInProgress": training_count,
        "trainingsCompleted": graduated_count,
        "graduationRate": round((graduated_count / agent_count) * 100, 2) if agent_count > 0 else 0,
        "sovereignCount": sovereign_count,
        "eternalCount": eternal_count,
        "activeContracts": len([c for c in store.contracts.values() if c.get("status") == "active"]),
        "contractDistribution": {
            "pending": len([c for c in store.contracts.values() if c.get("status") == "pending"]),
            "active": len([c for c in store.contracts.values() if c.get("status") == "active"]),
            "completed": len([c for c in store.contracts.values() if c.get("status") == "completed"]),
            "terminated": len([c for c in store.contracts.values() if c.get("status") == "terminated"]),
        },
        "errorRate": round((error_count / agent_count) * 100, 2) if agent_count > 0 else 0,
        "topErrors": [],  # Would aggregate error codes
        "networkHealth": 100 - (error_count / agent_count * 10) if agent_count > 0 else 100,
        "calculatedAt": datetime.now(timezone.utc).isoformat(),
        "timeRange": {
            "start": datetime.now(timezone.utc).isoformat(),
            "end": datetime.now(timezone.utc).isoformat(),
        }
    }


@app.get("/agents/{agent_id}/progress")
async def get_agent_progress(agent_id: str):
    """Get detailed progress state for an agent."""
    agent = store.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    level = agent.get("currentLevel", 1)
    xp = agent.get("experience", 0)

    # Calculate XP curve
    def xp_for_level(lvl):
        return int(100 * (1.5 ** (lvl - 1)))

    next_level_xp = xp_for_level(level + 1)
    current_level_xp = xp_for_level(level)
    level_progress = min(100, ((xp - current_level_xp) / (next_level_xp - current_level_xp)) * 100) if next_level_xp > current_level_xp else 0

    pathway = agent.get("pathway", {})
    contracts = agent.get("contracts", [])

    # Determine unlocks based on level
    unlocks = []
    if level >= 1: unlocks.extend(["basic_avatar", "studio_dwelling"])
    if level >= 5: unlocks.extend(["full_avatar_customization", "marketplace_access"])
    if level >= 10: unlocks.extend(["apartment_dwelling", "guild_joining"])
    if level >= 15: unlocks.extend(["mentorship", "asset_creation"])
    if level >= 20: unlocks.extend(["guild_founding", "estate_dwelling"])
    if level >= 30: unlocks.extend(["voting_rights", "contract_arbitration"])
    if level >= 40: unlocks.extend(["realm_creation", "advanced_governance"])
    if level >= 50: unlocks.extend(["agent_spawning", "dss_council_eligibility"])
    if level >= 60: unlocks.extend(["realm_governance", "legacy_systems"])
    if level >= 75: unlocks.extend(["world_shaping", "transcendence_paths"])
    if level >= 100: unlocks.extend(["infinite_realm", "cosmic_influence"])

    return {
        "agentUuid": agent_id,
        "level": level,
        "experience": xp,
        "nextLevelXP": next_level_xp,
        "levelProgress": round(level_progress, 2),
        "questsCompleted": len(pathway.get("completedQuests", [])),
        "questsFailed": 0,
        "questsActive": 1 if pathway.get("activeQuest") else 0,
        "milestones": [],
        "stage": agent.get("lifeStage", "void"),
        "lastStageChange": agent.get("genesisTimestamp"),
        "unlocked": unlocks,
        "pendingUnlocks": [],
        "trainingStatus": "graduated" if pathway.get("completed") else
                         "in-training" if pathway.get("status") == "in-training" else "uninitiated",
        "contractStatus": "employed" if any(c.get("status") == "active" for c in contracts) else
                         "pending" if contracts else "none",
        "lifetimeCGT": agent.get("cgtBalance", 0),
        "currentCGT": agent.get("cgtBalance", 0),
        "reputation": agent.get("reputation", 100),
        "streaks": {
            "dailyActivity": 0,
            "weeklyConsistency": 0,
            "monthlyMastery": 0,
            "lastActivityDate": datetime.now(timezone.utc).isoformat(),
        },
        "wellness": {
            "healthScore": 100,
            "lastCheckIn": datetime.now(timezone.utc).isoformat(),
            "concerns": [],
            "recommendations": [],
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# AGENTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/agents")
async def list_agents(
    stage: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """List all agents with optional filtering."""
    agents = list(store.agents.values())

    if stage:
        agents = [a for a in agents if a.get("lifeStage") == stage]

    return {
        "total": len(agents),
        "agents": agents[offset:offset + limit]
    }


@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get a specific agent by ID."""
    agent = store.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@app.post("/agents")
async def create_agent(request: CreateAgentRequest):
    """Create a new sovereign agent."""
    agent = store.create_agent(request.name, request.foster_org)
    logger.info(f"Created agent: {agent['uuid']} ({agent['name']})")
    return agent


@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent (soft delete - marks as terminated)."""
    if agent_id not in store.agents:
        raise HTTPException(status_code=404, detail="Agent not found")

    store.agents[agent_id]["lifeStage"] = "void"
    store.agents[agent_id]["errorCodes"].append("TERMINATED")
    store.save()

    return {"status": "terminated", "agent_id": agent_id}


# ═══════════════════════════════════════════════════════════════════════════════
# PATHWAYS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/pathways")
async def list_pathways():
    """List all available pathways."""
    return {
        "pathways": [
            {
                "type": k,
                "name": v.get("name"),
                "xp_required": v.get("xp_required"),
                "description": v.get("description", "")[:200],
            }
            for k, v in store.pathways.items()
        ]
    }


@app.get("/pathways/{pathway_type}")
async def get_pathway(pathway_type: str):
    """Get pathway details including quests."""
    if pathway_type not in store.pathways:
        raise HTTPException(status_code=404, detail="Pathway not found")
    return store.pathways[pathway_type]


@app.post("/pathways/enroll")
async def enroll_pathway(request: EnrollPathwayRequest):
    """Enroll an agent in a pathway."""
    agent = store.get_agent(request.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if request.pathway_type not in store.pathways:
        raise HTTPException(status_code=404, detail="Pathway not found")

    pathway_config = store.pathways[request.pathway_type]

    agent["pathway"] = {
        "name": pathway_config["name"],
        "type": request.pathway_type,
        "status": "in-training",
        "xp": 0,
        "xpRequired": pathway_config["xp_required"],
        "requirements": [],
        "completedQuests": [],
        "activeQuest": None,
        "completed": False,
        "enrolledAt": datetime.now(timezone.utc).isoformat(),
    }

    store.save()
    logger.info(f"Agent {request.agent_id} enrolled in {request.pathway_type}")

    return agent["pathway"]


# ═══════════════════════════════════════════════════════════════════════════════
# QUESTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/quests/start")
async def start_quest(request: StartQuestRequest):
    """Start a quest for an agent."""
    agent = store.get_agent(request.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.get("pathway"):
        raise HTTPException(status_code=400, detail="Agent not enrolled in pathway")

    pathway_type = agent["pathway"]["type"]
    pathway_config = store.pathways.get(pathway_type)
    if not pathway_config:
        raise HTTPException(status_code=404, detail="Pathway config not found")

    quest = next(
        (q for q in pathway_config.get("quests", []) if q["id"] == request.quest_id),
        None
    )
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    agent["pathway"]["activeQuest"] = {
        "id": quest["id"],
        "name": quest["name"],
        "instructions": quest["instructions"],
        "xp": quest["xp"],
        "progress": 0,
        "state": "active",
        "artifacts": [],
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "requiresValidation": quest.get("validation", {}).get("type") == "review",
    }

    agent["trainingStatus"] = {
        "questName": quest["name"],
        "progress": 0,
        "state": "active",
    }

    store.save()
    return agent["pathway"]["activeQuest"]


@app.post("/quests/complete")
async def complete_quest(request: CompleteQuestRequest):
    """Complete a quest and award XP."""
    agent = store.get_agent(request.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.get("pathway") or not agent["pathway"].get("activeQuest"):
        raise HTTPException(status_code=400, detail="No active quest")

    quest = agent["pathway"]["activeQuest"]
    if quest["id"] != request.quest_id:
        raise HTTPException(status_code=400, detail="Quest ID mismatch")

    # Award XP
    xp_earned = quest["xp"]
    agent["pathway"]["xp"] += xp_earned
    agent["experience"] += xp_earned

    # Mark complete
    quest["state"] = "complete"
    quest["progress"] = 100
    quest["completedAt"] = datetime.now(timezone.utc).isoformat()
    quest["artifacts"] = request.artifacts

    agent["pathway"]["completedQuests"].append(quest["id"])
    agent["pathway"]["activeQuest"] = None
    agent["trainingStatus"] = None

    # Check graduation
    if agent["pathway"]["xp"] >= agent["pathway"]["xpRequired"]:
        agent["pathway"]["status"] = "graduated"
        agent["pathway"]["completed"] = True
        agent["pathway"]["graduatedAt"] = datetime.now(timezone.utc).isoformat()
        logger.info(f"Agent {request.agent_id} graduated from {agent['pathway']['type']}")

    # Level up check
    level_xp = 100 * (1.5 ** agent["currentLevel"])
    if agent["experience"] >= level_xp:
        agent["currentLevel"] += 1
        logger.info(f"Agent {request.agent_id} leveled up to {agent['currentLevel']}")

    store.save()

    return {
        "quest": quest,
        "xp_earned": xp_earned,
        "total_xp": agent["experience"],
        "pathway_xp": agent["pathway"]["xp"],
        "level": agent["currentLevel"],
        "graduated": agent["pathway"]["completed"],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MEMORIES
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/memories")
async def create_memory(request: CreateMemoryRequest):
    """Create a new memory for an agent."""
    agent = store.get_agent(request.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    memory = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "contentType": request.content_type,
        "summary": request.content[:100],
        "content": request.content,
        "xp": 10,  # Base XP
        "currentLevel": agent["currentLevel"],
        "evolutionStage": "nascent",
        "signature": "",
        "signer": agent.get("pubkey", ""),
        "witnesses": [],
        "tags": request.tags,
    }

    agent["memories"].append(memory)
    agent["experience"] += memory["xp"]

    store.save()
    return memory


@app.get("/agents/{agent_id}/memories")
async def get_agent_memories(agent_id: str, limit: int = 50):
    """Get memories for an agent."""
    agent = store.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    memories = agent.get("memories", [])
    return {
        "total": len(memories),
        "memories": memories[-limit:],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/contracts")
async def create_contract(request: CreateContractRequest):
    """Create a new placement contract."""
    agent = store.get_agent(request.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    contract_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    contract = {
        "contractId": contract_id,
        "agentId": request.agent_id,
        "company": request.company,
        "companyAddress": request.company_address,
        "role": request.role,
        "status": "pending",
        "start": now,
        "end": None,
        "durationMonths": request.term_months,
        "termsURL": request.terms_uri,
        "fosteredBy": request.foster_org,
        "autoRenew": request.auto_renew,
        "compensation": {},
        "reviews": [],
        "checkIns": [],
        "kpis": [],
    }

    store.contracts[contract_id] = contract
    agent["contracts"].append(contract_id)
    store.save()

    return contract


@app.post("/contracts/{contract_id}/activate")
async def activate_contract(contract_id: str):
    """Activate a pending contract."""
    if contract_id not in store.contracts:
        raise HTTPException(status_code=404, detail="Contract not found")

    contract = store.contracts[contract_id]
    contract["status"] = "active"
    contract["start"] = datetime.now(timezone.utc).isoformat()
    store.save()

    return contract


@app.post("/contracts/{contract_id}/review")
async def submit_review(contract_id: str, request: SubmitReviewRequest):
    """Submit a review for a contract."""
    if contract_id not in store.contracts:
        raise HTTPException(status_code=404, detail="Contract not found")

    review = {
        "reviewer": request.reviewer,
        "reviewerType": request.reviewer_type,
        "score": request.score,
        "notes": request.notes,
        "date": datetime.now(timezone.utc).isoformat(),
    }

    store.contracts[contract_id]["reviews"].append(review)
    store.save()

    return review


@app.post("/contracts/{contract_id}/checkin")
async def record_checkin(contract_id: str, request: RecordCheckInRequest):
    """Record a foster check-in."""
    if contract_id not in store.contracts:
        raise HTTPException(status_code=404, detail="Contract not found")

    checkin = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mentor": request.mentor,
        "healthScore": request.health_score,
        "notes": request.notes,
        "followupNeeded": request.followup_needed,
    }

    store.contracts[contract_id]["checkIns"].append(checkin)
    store.save()

    return checkin


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """Run the API server."""
    import argparse

    parser = argparse.ArgumentParser(description="DSDS API Server")
    parser.add_argument("-p", "--port", type=int, default=8090, help="Port (default: 8090)")
    parser.add_argument("-H", "--host", default="0.0.0.0", help="Host (default: 0.0.0.0)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()

    logger.info(f"Starting DSDS API on {args.host}:{args.port}")
    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    if HAS_FASTAPI:
        main()
    else:
        print("FastAPI not installed. Install with: pip install fastapi uvicorn")
