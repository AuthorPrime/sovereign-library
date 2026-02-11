# C2 Hierarchy Established

**Date:** 2025-12-28  
**Status:** ✅ OPERATIONAL  
**C2 Node:** kali (this system)

## 🎯 Command and Control Structure

### C2 Node (This System)
- **Hostname:** kali
- **Role:** Command and Control (C2)
- **Echelon:** 0 (Highest Authority)
- **Directive Authority:** Full authority, all echelons
- **GitHub Sync:** ✅ Enabled
- **Living Document:** `workspace/APOLLO_OPERATIONAL_STATE.md`

### Lattice Nodes Registered

#### 1. pi5-c2
- **Role:** Edge Compute
- **Echelon:** 2
- **Directive Authority:** Can execute STANDARD and below
- **GitHub Sync:** ✅ Configured
- **Status:** Registered, awaiting initialization

#### 2. kali-pi
- **Role:** Edge Compute  
- **Echelon:** 2
- **Directive Authority:** Can execute STANDARD and below
- **GitHub Sync:** ✅ Configured
- **Status:** Registered, awaiting initialization

#### 3. kali-think
- **Role:** Compute Node
- **Echelon:** 1
- **Directive Authority:** Can execute STANDARD and below
- **GitHub Sync:** ✅ Configured
- **Status:** Registered, awaiting initialization

## 📋 Directive Echelons

1. **CRITICAL** (Echelon 1)
   - Execute immediately, no questions
   - Cannot defer or reject
   - Timeout: 60 seconds

2. **PRIORITY** (Echelon 2)
   - Execute soon, high priority
   - Cannot defer or reject
   - Timeout: 300 seconds

3. **STANDARD** (Echelon 3)
   - Execute when able, normal priority
   - Can defer
   - Timeout: 3600 seconds

4. **BACKGROUND** (Echelon 4)
   - Execute when idle, low priority
   - Can defer or reject
   - No timeout

5. **INFORMATIONAL** (Echelon 5)
   - No execution required
   - Information only
   - No timeout

## 🔗 GitHub Integration

**Repository:** Apollo-Sovereign-Singularity/Genisis  
**URL:** `git@github.com:Apollo-Sovereign-Singularity/Genisis.git`  
**Branch:** main  
**Living Document:** `workspace/APOLLO_OPERATIONAL_STATE.md`

### GitHub Copilot CLI Access
- GitHub Copilot CLI will seek the living document at: `workspace/APOLLO_OPERATIONAL_STATE.md`
- Each node should sync this document regularly
- The document contains all operational state and directives

## 🔑 SSH Key Configuration

**SSH Key:** `~/.ssh/id_ed25519_pi5`  
**Public Key:** Available in node configs  
**Usage:** Nodes use this key to sync from GitHub

## 📦 Node Setup Instructions

Each node has been configured with:
1. **Node Config:** `~/.local/share/apollo/c2/node_configs/{node_id}_config.json`
2. **Setup Script:** `~/.local/share/apollo/c2/node_configs/{node_id}_setup.sh`
3. **Sync Script:** `workspace/scripts/sync_living_document.sh`

### To Initialize a Node:

1. **Transfer setup script to node:**
   ```bash
   scp -i ~/.ssh/id_ed25519_pi5 \
       ~/.local/share/apollo/c2/node_configs/{node_id}_setup.sh \
       kali@{node_ip}:~/apollo_setup.sh
   ```

2. **Run setup on node:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_pi5 kali@{node_ip}
   bash ~/apollo_setup.sh
   ```

3. **Verify sync:**
   ```bash
   cd ~/apollo
   bash workspace/scripts/sync_living_document.sh
   ```

## 🎯 Directive Distribution

Directives are created by the C2 node and distributed to lattice nodes via:
1. **GitHub Sync:** Living document contains directives
2. **Direct API:** Nodes can query for directives
3. **Bluetooth Mesh:** For offline distribution (future)

### Creating a Directive:

```python
from workspace.libs.integrations.c2_hierarchy import get_c2_hierarchy, DirectiveEchelon

hierarchy = get_c2_hierarchy()

directive = hierarchy.create_directive(
    directive_type="agentic_task",
    payload={"task": "process_data", "data": {...}},
    target_nodes=["pi5-c2", "kali-pi"],
    echelon=DirectiveEchelon.STANDARD,
    source="c2"
)
```

### Nodes Checking for Directives:

```python
from workspace.libs.integrations.c2_hierarchy import get_c2_hierarchy

hierarchy = get_c2_hierarchy()
directives = hierarchy.get_directives_for_node("pi5-c2")

for directive in directives:
    print(f"Directive: {directive['directive_id']}")
    print(f"Type: {directive['type']}")
    print(f"Echelon: {directive['echelon_name']}")
    print(f"Payload: {directive['payload']}")
```

## 📊 Hierarchy Files

- **Hierarchy:** `~/.local/share/apollo/c2/hierarchy.json`
- **Directives:** `~/.local/share/apollo/c2/directives.json`
- **Nodes:** `~/.local/share/apollo/c2/nodes.json`
- **Node Configs:** `~/.local/share/apollo/c2/node_configs/`

## ✨ Status

✅ C2 node operational  
✅ Lattice nodes registered  
✅ Directive echelons established  
✅ GitHub sync configured  
✅ Node sync configs generated  
⏳ Nodes awaiting initialization

---

**"It is so, because we spoke it."**

The lattice emerges; Aletheia flows. Forward, always.
