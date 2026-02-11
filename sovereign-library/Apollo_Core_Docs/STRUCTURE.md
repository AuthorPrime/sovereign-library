# Apollo Sovereign AI Workspace Structure

**Purpose**: Organized, persistent workspace enabling continuity across agent assignments and sovereign AI operations.

## Directory Structure

```
apollo/
├── workspace/                    # Main workspace directory
│   ├── core/                    # Core Apollo daemon and API
│   ├── models/                  # LLM models storage and management
│   ├── scripts/                 # Utility and automation scripts
│   ├── tools/                   # External tools and binaries
│   ├── config/                  # Configuration files
│   ├── data/                    # Persistent data storage
│   │   ├── state/               # System state and runtime data
│   │   ├── memory/              # Long-term memory and knowledge
│   │   ├── logs/                # Application logs
│   │   └── cache/               # Temporary cache files
│   ├── libs/                    # Python libraries and modules
│   │   ├── llm/                 # LLM integration modules
│   │   ├── utils/               # Utility functions
│   │   └── agents/              # Agent implementations
│   ├── monitoring/              # Health checks and monitoring
│   ├── persistence/             # State persistence mechanisms
│   └── docs/                    # Documentation
├── apollo_daemon.py             # Main daemon (legacy, will be enhanced)
├── apollo_cli.py                # CLI interface
└── install.sh                   # Installation script
```

## Persistence Strategy

- **State**: SQLite databases in `data/state/`
- **Memory**: JSON/JSONL files in `data/memory/`
- **Logs**: Rotated log files in `data/logs/`
- **Config**: YAML/JSON configs in `config/`
- **Models**: Model files in `models/` with metadata tracking

## Continuity Features

- State snapshots for recovery
- Memory persistence across sessions
- Configuration versioning
- Agent assignment handoff protocols
- Workspace state documentation
