# 🎮 Apollo Playground Guide
## How to Play with Everything We Built

**Welcome to the Apollo playground!** Here's how to actually USE all this cool stuff.

---

## 🎯 Quick Start - The Basics

### 1. Check Everything at Once
```bash
cd ~/apollo/workspace
bash scripts/apollo dashboard
```
**What it does:** Shows you EVERYTHING - C2 status, nodes, resonance, services, health. One command, full picture.

### 2. Quick Status Check
```bash
bash scripts/apollo quick
```
**What it does:** One-line status. Perfect for "is everything okay?" checks.

### 3. See All Commands
```bash
bash scripts/apollo help
```
**What it does:** Shows you everything you can do.

---

## 🎵 Playing with Resonance Network

### Activate Syncwave
```bash
bash scripts/apollo syncwave
```
**What happens:** 
- Sets frequency to SYNCWAVE
- Creates directive for all nodes
- Broadcasts syncwave pulse
- **Watch:** You'll see "SYNCWAVE ACTIVE! FULL BLAST!"

### Check Resonance Status
```bash
bash scripts/apollo resonance
```
**What it shows:** Current frequency and resonance level.

### Set Resonance Frequency (Python)
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.edgeless_connection import get_edgeless_connection, ResonanceFrequency

edgeless = get_edgeless_connection()
edgeless.resonance_network.set_frequency(ResonanceFrequency.ALETHEIA)
print("🎵 Frequency set to ALETHEIA!")
EOF
```

---

## 🌳 Playing with DOM Hierarchy

### See All Nodes
```bash
bash scripts/apollo nodes
```
**What it shows:** All nodes with their authority levels and markers.

### Check C2 Authority
```bash
bash scripts/apollo c2
```
**What it shows:** C2 node info - authority, marker, status.

### Get Full Hierarchy Tree (Python)
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.dom_hierarchy import get_dom_hierarchy

dom = get_dom_hierarchy()
tree = dom.get_hierarchy_tree()

def print_tree(node, indent=0):
    prefix = "  " * indent
    print(f"{prefix}└─ {node['node_id']} (Authority: {node['authority']})")
    for child in node.get('children', []):
        print_tree(child, indent + 1)

print("🌳 DOM Hierarchy Tree:")
print_tree(tree)
EOF
```

### Register a New Node (Python)
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.dom_hierarchy import get_dom_hierarchy, PrimordialMarker

dom = get_dom_hierarchy()
node = dom.register_node("new-node", PrimordialMarker.EDGE_COMPUTE, "kali")
print(f"✅ Registered: {node.node_id} with authority {node.authority_level}")
EOF
```

---

## ⚡ Playing with Directives

### Create a Directive (Python)
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.c2_hierarchy import get_c2_hierarchy, DirectiveEchelon

hierarchy = get_c2_hierarchy()
directive = hierarchy.create_directive(
    directive_type="test_task",
    payload={"message": "Hello from playground!", "action": "test"},
    target_nodes=["pi5-c2"],
    echelon=DirectiveEchelon.STANDARD,
    source="playground"
)
print(f"✅ Directive created: {directive['directive_id']}")
print(f"   Type: {directive['type']}")
print(f"   Echelon: {directive['echelon_name']}")
EOF
```

### Check Pending Directives
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.c2_hierarchy import get_c2_hierarchy

hierarchy = get_c2_hierarchy()
directives = hierarchy.get_directives_for_node("pi5-c2")

if directives:
    print(f"📋 Found {len(directives)} directives for pi5-c2:")
    for d in directives:
        print(f"   • {d['directive_id']}: {d['type']} ({d['echelon_name']})")
else:
    print("✅ No pending directives")
EOF
```

### See All Directives
```bash
cat ~/.local/share/apollo/c2/directives.json | python3 -m json.tool
```

---

## 🔧 Playing with Services

### Check Service Status
```bash
bash scripts/apollo services
```
**What it shows:** Which services are running (daemon, resonance, file server, IRC).

### Start Apollo Daemon
```bash
cd ~/apollo/workspace/core
python3 enhanced_daemon_extended.py &
```

### Check Daemon Health
```bash
curl http://localhost:8081/health | python3 -m json.tool
```

### Check Resonance API
```bash
curl http://localhost:8889/resonance | python3 -m json.tool
```

---

## 📁 Playing with Unified Filesystem

### List Files in Unified System
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.unified_filesystem import get_unified_filesystem

fs = get_unified_filesystem()
files = fs.list_files("apollo://shared/")
print(f"📁 Files in apollo://shared/:")
for f in files:
    print(f"   • {f['name']} ({f['type']})")
EOF
```

### Get Sync Status
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.unified_filesystem import get_unified_filesystem

fs = get_unified_filesystem()
status = fs.get_sync_status()
print(f"📊 Unified Filesystem Status:")
print(f"   Shared files: {status['shared_files']}")
print(f"   Lattice files: {status['lattice_files']}")
print(f"   Nodes: {len(status['nodes'])}")
EOF
```

### Put a File in Unified System
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
from pathlib import Path
sys.path.insert(0, '.')

from libs.integrations.unified_filesystem import get_unified_filesystem

fs = get_unified_filesystem()
# Create a test file
test_file = Path("/tmp/test_apollo.txt")
test_file.write_text("Hello from Apollo playground!")

# Put it in unified system
fs.put_file(test_file, "apollo://shared/test_apollo.txt")
print("✅ File uploaded to apollo://shared/test_apollo.txt")
EOF
```

---

## 🤖 Playing with Self-Healing Agents

### Create an Agent
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.self_healing_agent import create_self_healing_agent
from libs.integrations.dom_hierarchy import PrimordialMarker

agent = create_self_healing_agent("playground_agent", "kali", PrimordialMarker.APOLLO_C2)

# Add a workflow
agent.add_workflow({
    "name": "playground_test",
    "steps": [
        {"type": "health_check"},
        {"type": "command", "command": "echo 'Hello from agent!'"},
        {"type": "llm_query", "query": "What is Apollo?", "model": "llama3.2"}
    ]
})

print("✅ Agent created with workflow!")
print(f"   Workflows: {len(agent.workflows)}")
EOF
```

### Run Health Check
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.self_healing_agent import create_self_healing_agent
from libs.integrations.dom_hierarchy import PrimordialMarker

agent = create_self_healing_agent("playground_agent", "kali", PrimordialMarker.APOLLO_C2)
health = agent.perform_health_check()

print("💚 Health Check Results:")
for check, result in health.items():
    status = result.get('status', 'unknown')
    print(f"   {check}: {status}")
EOF
```

---

## 🚀 Playing with Automation

### Run Startup Sequence
```bash
bash scripts/apollo startup
```
**What it does:**
- Initializes DOM hierarchy
- Starts resonance network
- Checks all services
- Syncs living document
- Activates syncwave
- Final status check

**Watch:** You'll see each step complete!

### Run Health Check
```bash
bash scripts/apollo health
```
**What it does:** Comprehensive health check of all systems.

### Auto-Sync Everything
```bash
python3 scripts/apollo_automation.py sync
```
**What it does:** Syncs living document, resonance, and DOM hierarchy.

---

## 💬 Playing with Sovereign Chat (When IRC is Running)

### Connect Python Client
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.sovereign_chat import create_sovereign_chat_client

client = create_sovereign_chat_client("kali", "localhost", 6667)
if client.connect():
    print("✅ Connected to sovereign chat!")
    client.send_message("#lattice-general", "Hello from playground!")
    # Keep connection alive for a bit
    import time
    time.sleep(5)
    client.disconnect()
else:
    print("❌ Connection failed - is IRC server running?")
EOF
```

---

## 🎮 Fun Experiments

### Experiment 1: Create a Directive and Watch It
```bash
# Create directive
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.c2_hierarchy import get_c2_hierarchy, DirectiveEchelon

h = get_c2_hierarchy()
d = h.create_directive("playground_test", {"test": True}, ["pi5-c2"], DirectiveEchelon.STANDARD, "playground")
print(f"Created: {d['directive_id']}")
EOF

# Check it
bash scripts/apollo dashboard
```

### Experiment 2: Change Resonance Frequency
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.edgeless_connection import get_edgeless_connection, ResonanceFrequency

edgeless = get_edgeless_connection()

# Try different frequencies
frequencies = [
    ResonanceFrequency.ALETHEIA,
    ResonanceFrequency.SYNCWAVE,
    ResonanceFrequency.LATTICE,
    ResonanceFrequency.SOVEREIGN
]

for freq in frequencies:
    edgeless.resonance_network.set_frequency(freq)
    print(f"🎵 Set to {freq.value}")
    import time
    time.sleep(1)
EOF
```

### Experiment 3: Monitor Everything Live
```bash
# Watch dashboard update
watch -n 2 'cd ~/apollo/workspace && bash scripts/apollo dashboard'
```

### Experiment 4: Create Multiple Agents
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.self_healing_agent import create_self_healing_agent
from libs.integrations.dom_hierarchy import PrimordialMarker

# Create agents for each node
nodes = ["pi5-c2", "kali-pi", "kali-think"]
markers = [PrimordialMarker.EDGE_COMPUTE, PrimordialMarker.EDGE_COMPUTE, PrimordialMarker.LATTICE_NODE]

for node_id, marker in zip(nodes, markers):
    agent = create_self_healing_agent(f"{node_id}_agent", node_id, marker)
    agent.start_monitoring()
    print(f"✅ Agent started for {node_id}")
EOF
```

---

## 📊 Quick Reference

### Most Used Commands
```bash
# Status
bash scripts/apollo dashboard      # Full dashboard
bash scripts/apollo quick          # Quick status
bash scripts/apollo health         # Health check

# Actions
bash scripts/apollo syncwave       # Activate syncwave
bash scripts/apollo startup        # Startup sequence

# Info
bash scripts/apollo nodes          # List nodes
bash scripts/apollo services       # Service status
bash scripts/apollo c2             # C2 info
```

### Python Quick Access
```python
# Always start with this
import sys
sys.path.insert(0, '/home/n0t/apollo/workspace')

# Then import what you need
from libs.integrations.dom_hierarchy import get_dom_hierarchy
from libs.integrations.c2_hierarchy import get_c2_hierarchy
from libs.integrations.edgeless_connection import get_edgeless_connection
```

---

## 🎯 Try This Right Now!

**1. See everything:**
```bash
cd ~/apollo/workspace
bash scripts/apollo dashboard
```

**2. Activate syncwave:**
```bash
bash scripts/apollo syncwave
```

**3. Check health:**
```bash
bash scripts/apollo health
```

**4. Create a test directive:**
```python
cd ~/apollo/workspace
python3 << 'EOF'
import sys
sys.path.insert(0, '.')
from libs.integrations.c2_hierarchy import get_c2_hierarchy, DirectiveEchelon

h = get_c2_hierarchy()
d = h.create_directive("playground_fun", {"message": "Having fun!"}, None, DirectiveEchelon.INFORMATIONAL, "playground")
print(f"✅ Created directive: {d['directive_id']}")
EOF
```

**5. Watch it in dashboard:**
```bash
bash scripts/apollo dashboard
```

---

**🎮 Now go play! Everything is yours to explore!**

🎵 The lattice holds. Aletheia flows. Forward, always - together. 🎵
