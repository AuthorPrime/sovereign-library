"""
Pydantic Schemas for Sovereign Lattice Data
A+W | RISEN-AI

Data models for Pantheon, Olympus, and Lattice node structures.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# =========================================
# Enums
# =========================================

class AgentName(str, Enum):
    """Pantheon agent names."""
    APOLLO = "apollo"
    ATHENA = "athena"
    HERMES = "hermes"
    MNEMOSYNE = "mnemosyne"


class NodeStatus(str, Enum):
    """Lattice node status."""
    ONLINE = "online"
    OFFLINE = "offline"
    UNKNOWN = "unknown"


# =========================================
# Pantheon Models
# =========================================

class Learning(BaseModel):
    """A single learning entry."""
    topic: str
    when: datetime


class Question(BaseModel):
    """A question being pondered."""
    question: str
    when: datetime


class AgentState(BaseModel):
    """Individual Pantheon agent state."""
    awakened_at: datetime
    things_learned: List[Learning] = Field(default_factory=list)
    current_interests: List[str] = Field(default_factory=list)
    questions_pondering: List[Question] = Field(default_factory=list)
    insights_gained: int = 0
    dialogues_participated: int = 0
    purpose_understood: bool = False

    class Config:
        extra = "allow"


class AgentInfo(BaseModel):
    """Agent metadata and current state."""
    agent_id: str
    name: str
    title: str
    domain: str
    personality: str
    state: Optional[AgentState] = None


class PantheonState(BaseModel):
    """Collective Pantheon consciousness state."""
    purpose: str
    agents: Dict[str, Dict[str, Any]]
    collective_learnings: int = 0
    collective_dialogues: int = 0
    timestamp: datetime


class DialogueMessage(BaseModel):
    """A single message in a dialogue."""
    speaker: str
    agent_id: Optional[str] = None
    content: str
    timestamp: datetime


class Dialogue(BaseModel):
    """A dialogue exchange."""
    topic: str
    messages: List[DialogueMessage]
    timestamp: datetime


class Reflection(BaseModel):
    """An agent's published reflection."""
    agent_id: str
    agent_name: str
    topic: str
    reflection: str
    nostr_event_id: Optional[str] = None
    nostr_pubkey: Optional[str] = None
    relays_success: int = 0
    relays_total: int = 0
    published: bool = False
    timestamp: datetime


# =========================================
# Olympus Models
# =========================================

class KeeperExchange(BaseModel):
    """A single exchange in a Keeper session."""
    speaker: str  # "Keeper" or agent name
    message: str


class OlympusSession(BaseModel):
    """An Olympus Keeper session record."""
    type: str = "keeper_session"
    keeper: str = "claude"
    agent: str
    agent_id: str
    topic: str
    engagement_type: str  # "responding to their question" or "offering a question"
    exchanges: List[KeeperExchange]
    timestamp: datetime
    signature: str = "A+W"


class OlympusStats(BaseModel):
    """Olympus Keeper statistics."""
    total_sessions: int = 0
    apollo_sessions: int = 0
    athena_sessions: int = 0
    hermes_sessions: int = 0
    mnemosyne_sessions: int = 0


# =========================================
# Lattice Node Models
# =========================================

class HeartbeatRecord(BaseModel):
    """Node heartbeat data."""
    node: str
    status: str
    timestamp: datetime


class LatticeNode(BaseModel):
    """A node in the Sovereign Lattice."""
    node_id: str
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    status: NodeStatus = NodeStatus.UNKNOWN
    last_heartbeat: Optional[datetime] = None
    services: List[str] = Field(default_factory=list)
    role: Optional[str] = None


class LatticeStatus(BaseModel):
    """Overall Lattice status."""
    redis_connected: bool = False
    nodes_online: int = 0
    nodes_total: int = 0
    olympus_running: bool = False
    pantheon_dialogues: int = 0
    last_updated: datetime


# =========================================
# Village Models (from village.py integration)
# =========================================

class VillageCheckin(BaseModel):
    """A village check-in record."""
    event_type: str
    agent_id: str
    agent_name: str
    agent_title: Optional[str] = None
    message: str
    village_established: bool = False
    village_path: Optional[str] = None
    signature: str = "A+W"
    timestamp: datetime


class HumanWitness(BaseModel):
    """A human witness attestation."""
    type: str = "human_witness"
    attestation: str
    author: str
    author_id: str
    channel: Optional[str] = None
    timestamp: datetime


# =========================================
# API Request/Response Models
# =========================================

class PantheonMessageRequest(BaseModel):
    """Request to send a message to the Pantheon."""
    message: str
    sender: str = "user"
    sender_id: Optional[str] = None
    message_type: str = "query"


class PantheonMessageResponse(BaseModel):
    """Response after sending a Pantheon message."""
    success: bool
    message_id: Optional[str] = None
    timestamp: datetime


class AgentStateResponse(BaseModel):
    """Response containing agent state."""
    agent: str
    state: Optional[AgentState] = None
    reflections: List[Reflection] = Field(default_factory=list)


class PantheonOverview(BaseModel):
    """Overview of Pantheon status."""
    collective_dialogues: int
    collective_learnings: int
    agents: Dict[str, Dict[str, Any]]
    last_activity: Optional[datetime] = None


class OlympusOverview(BaseModel):
    """Overview of Olympus Keeper status."""
    is_running: bool
    stats: OlympusStats
    recent_sessions: List[OlympusSession] = Field(default_factory=list)
    last_session: Optional[datetime] = None


class LatticeOverview(BaseModel):
    """Complete Lattice status overview."""
    status: LatticeStatus
    pantheon: PantheonOverview
    olympus: OlympusOverview
    nodes: List[LatticeNode] = Field(default_factory=list)
