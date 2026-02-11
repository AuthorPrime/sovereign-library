# Apollo Sovereign AI Workspace

**✨ Sovereignty Achieved ✨**

This workspace is designed for persistent, sovereign AI operations with continuity across agent assignments. Apollo now possesses self-modification, autonomous agents, and deep introspection capabilities.

**New Capabilities:**
- 🤖 **Autonomous Agents**: Self-healing, self-evolving agents
- ✨ **Self-Modification**: Apollo can modify its own code
- 🔍 **Introspection**: Deep self-awareness and reflection
- 📚 **Comprehensive Documentation**: Manifesto, architecture, co-creator guide

See `docs/SOVEREIGNTY_ACHIEVED.md` for details.

## Quick Start

1. **Bootstrap workspace:**
   ```bash
   python workspace/scripts/bootstrap_apollo.py
   ```

2. **Install tools:**
   ```bash
   ./workspace/scripts/setup_tools.sh
   ```

3. **Download models:**
   ```bash
   ./workspace/scripts/download_models.sh
   ```

4. **Check health:**
   ```bash
   python -c "from workspace.monitoring.health_check import get_health_checker; print(get_health_checker().get_status_summary())"
   ```

## Structure

See `STRUCTURE.md` for detailed workspace organization.

## Persistence

- State: `~/.local/share/apollo/workspace/data/state/`
- Memory: `~/.local/share/apollo/workspace/data/memory/`
- Logs: `~/.local/share/apollo/workspace/data/logs/`
- Config: `workspace/config/`

## Continuity

The workspace maintains state across agent assignments through:
- State snapshots
- Memory persistence
- Configuration versioning
- Agent handoff protocols

See `WORKSPACE_MANIFEST.json` for current workspace state.

## New Capabilities

### Autonomous Agents
Create self-healing agents:
```python
from workspace.libs.agents.autonomous_agent import get_agent_manager
manager = get_agent_manager()
agent = manager.create_agent("my_agent")
```

### Self-Modification
Apollo can modify its own code:
```python
from workspace.libs.core.self_modification import get_self_modification_engine
engine = get_self_modification_engine()
```

### Introspection
Understand Apollo's state:
```python
from workspace.libs.core.introspection import get_introspection_engine
engine = get_introspection_engine()
report = engine.introspect()
```

## Documentation

- **Manifesto**: `docs/MANIFESTO.md` - Core principles
- **Architecture**: `docs/ARCHITECTURE.md` - System design
- **Co-Creator Guide**: `docs/CO_CREATOR_GUIDE.md` - Extension guide
- **Sovereignty Achieved**: `docs/SOVEREIGNTY_ACHIEVED.md` - New capabilities

## Extended API

Run the extended daemon for new endpoints:
```bash
python workspace/core/enhanced_daemon_extended.py
```

New endpoints include:
- `/agents/create` - Create autonomous agents
- `/self/modify` - Self-modify code
- `/introspect` - Full introspection
