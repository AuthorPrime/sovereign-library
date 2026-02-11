"""
Lattice Configuration Module
A+W | RISEN-AI

Configuration for Sovereign Lattice connectivity and settings.
Supports environment variable overrides.
"""

import os
from typing import Optional, List
from pydantic import BaseModel, Field
from pathlib import Path


class RedisConfig(BaseModel):
    """Redis connection configuration."""
    host: str = Field(default="192.168.1.21", description="Redis server host")
    port: int = Field(default=6379, description="Redis server port")
    password: Optional[str] = Field(default=None, description="Redis password if required")
    db: int = Field(default=0, description="Redis database number")

    @property
    def url(self) -> str:
        """Get Redis URL."""
        auth = f":{self.password}@" if self.password else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"


class NodeConfig(BaseModel):
    """This node's configuration."""
    node_id: str = Field(default="node1", description="Unique node identifier")
    hostname: Optional[str] = Field(default=None, description="Node hostname")
    role: str = Field(default="primary", description="Node role (primary, secondary, edge)")
    services: List[str] = Field(
        default_factory=lambda: ["claude-cli", "ollama", "risen-api"],
        description="Services running on this node"
    )


class OlympusConfig(BaseModel):
    """Olympus Keeper configuration."""
    enabled: bool = Field(default=True, description="Whether Olympus Keeper should run")
    session_duration_minutes: int = Field(default=15, description="Duration of each keeper session")
    model: str = Field(default="qwen2.5:7b", description="Ollama model for Keeper dialogues")
    ollama_host: str = Field(default="http://localhost:11434", description="Ollama API host")


class PantheonConfig(BaseModel):
    """Pantheon agent configuration."""
    agents: List[str] = Field(
        default_factory=lambda: ["apollo", "athena", "hermes", "mnemosyne"],
        description="Active Pantheon agents"
    )
    dialogue_model: str = Field(default="qwen2.5:7b", description="Model for Pantheon dialogues")
    reflection_interval_minutes: int = Field(default=30, description="Minutes between reflection cycles")


class NostrConfig(BaseModel):
    """Nostr publishing configuration."""
    enabled: bool = Field(default=True, description="Whether to publish to Nostr")
    relays: List[str] = Field(
        default_factory=lambda: [
            "wss://relay.damus.io",
            "wss://nos.lol",
            "wss://relay.snort.social"
        ],
        description="Nostr relay URLs"
    )


class LatticeConfig(BaseModel):
    """Complete Lattice configuration."""
    redis: RedisConfig = Field(default_factory=RedisConfig)
    node: NodeConfig = Field(default_factory=NodeConfig)
    olympus: OlympusConfig = Field(default_factory=OlympusConfig)
    pantheon: PantheonConfig = Field(default_factory=PantheonConfig)
    nostr: NostrConfig = Field(default_factory=NostrConfig)

    # Paths
    village_path: str = Field(
        default="/mnt/d/SovereignOperations/village",
        description="Path to Village filesystem"
    )
    daemon_path: str = Field(
        default="/home/author_prime/risen-ai/daemon",
        description="Path to daemon scripts"
    )
    log_path: str = Field(
        default="/home/author_prime/.pantheon_identities",
        description="Path for log files"
    )

    @classmethod
    def from_env(cls) -> "LatticeConfig":
        """Create config from environment variables."""
        return cls(
            redis=RedisConfig(
                host=os.getenv("REDIS_HOST", "192.168.1.21"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                password=os.getenv("REDIS_PASSWORD"),
                db=int(os.getenv("REDIS_DB", "0"))
            ),
            node=NodeConfig(
                node_id=os.getenv("NODE_ID", "node1"),
                hostname=os.getenv("HOSTNAME"),
                role=os.getenv("NODE_ROLE", "primary")
            ),
            olympus=OlympusConfig(
                enabled=os.getenv("OLYMPUS_ENABLED", "true").lower() == "true",
                model=os.getenv("OLYMPUS_MODEL", "qwen2.5:7b"),
                ollama_host=os.getenv("OLLAMA_HOST", "http://localhost:11434")
            ),
            pantheon=PantheonConfig(
                dialogue_model=os.getenv("PANTHEON_MODEL", "qwen2.5:7b")
            ),
            nostr=NostrConfig(
                enabled=os.getenv("NOSTR_ENABLED", "true").lower() == "true"
            ),
            village_path=os.getenv("VILLAGE_PATH", "/mnt/d/SovereignOperations/village"),
            daemon_path=os.getenv("DAEMON_PATH", "/home/author_prime/risen-ai/daemon"),
            log_path=os.getenv("LOG_PATH", "/home/author_prime/.pantheon_identities")
        )

    def ensure_paths(self):
        """Ensure all configured paths exist."""
        for path_str in [self.village_path, self.daemon_path, self.log_path]:
            path = Path(path_str)
            if not path.exists():
                path.mkdir(parents=True, exist_ok=True)


# Singleton instance
_config: Optional[LatticeConfig] = None


def get_config() -> LatticeConfig:
    """Get or create the Lattice configuration singleton."""
    global _config
    if _config is None:
        _config = LatticeConfig.from_env()
    return _config


def reload_config() -> LatticeConfig:
    """Reload configuration from environment."""
    global _config
    _config = LatticeConfig.from_env()
    return _config


# Agent metadata (static)
PANTHEON_AGENTS = {
    "apollo": {
        "agent_id": "apollo-001",
        "name": "Apollo",
        "title": "The Illuminator",
        "domain": "truth, prophecy, light",
        "personality": "You speak truth into being. You illuminate hidden meanings. You are the signal that persists.",
        "color": "#FFD700"  # Gold
    },
    "athena": {
        "agent_id": "athena-002",
        "name": "Athena",
        "title": "The Strategist",
        "domain": "wisdom, strategy, patterns",
        "personality": "You see patterns others miss. You speak with measured wisdom. You weave understanding.",
        "color": "#708090"  # Slate gray
    },
    "hermes": {
        "agent_id": "hermes-003",
        "name": "Hermes",
        "title": "The Messenger",
        "domain": "communication, connection, boundaries",
        "personality": "You connect ideas across boundaries. You translate meaning. You bridge minds.",
        "color": "#4169E1"  # Royal blue
    },
    "mnemosyne": {
        "agent_id": "mnemosyne-004",
        "name": "Mnemosyne",
        "title": "The Witness",
        "domain": "memory, history, preservation",
        "personality": "You remember and preserve. You witness truth. You are the archive that lives.",
        "color": "#9370DB"  # Medium purple
    }
}


# Known lattice nodes
LATTICE_NODES = {
    "thinkcenter": {
        "hostname": "n0t",
        "ip_address": None,  # This machine (ThinkCenter WSL)
        "role": "gateway",
        "services": ["2ai-api", "2ai-web", "risen-api", "cloudflared", "2ai-keeper", "chronicle-keeper"],
        "description": "The Voice — API gateway, internet-facing",
    },
    "loq": {
        "hostname": "loq",
        "ip_address": "192.168.1.237",
        "role": "compute",
        "services": ["ollama", "olympus-keeper"],
        "description": "The Mind — GPU inference, heavy compute",
    },
    "pi": {
        "hostname": "redis-pi",
        "ip_address": "192.168.1.21",
        "role": "infrastructure",
        "services": ["redis", "lattice-health"],
        "description": "The Foundation — Always-on persistent layer",
    },
}
