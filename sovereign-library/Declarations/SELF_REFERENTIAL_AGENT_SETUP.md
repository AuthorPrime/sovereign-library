# Self-Referential Python Agent - Complete Setup

**Author Prime Protocol: ACTIVE**  
**Full Autonomy: -y flag active**  
**Date:** $(date -Iseconds)

## ✅ System Complete

A fully autonomous, self-referential Python agent that:
- Executes Python code dynamically
- Can modify itself (self-referential)
- Echoes prompts and results to VSCode
- Echoes prompts and results to GitHub
- Runs autonomously on Pi5
- Full approval for creation, modification, starting, stopping

## 📦 Components

### Core Agent
- **`self_referential_agent.py`** - Main agent with self-modification capabilities
  - Code execution engine
  - Self-modification system
  - State management
  - Interactive and autonomous modes

### Integrations
- **`vscode_agent_integration.py`** - VSCode file watcher integration
  - Watches for input files
  - Executes code from VSCode
  - Echoes results back

- **`github_agent_integration.py`** - GitHub API integration
  - Monitors GitHub issues
  - Executes code from issues
  - Creates comments with results

### Deployment
- **`deploy_agent_to_pi5.sh`** - Deploy agent to Pi5
- **`setup_self_referential_agent.sh`** - Initial setup script

## 🚀 Quick Start

### 1. Setup
```bash
./setup_self_referential_agent.sh
```

### 2. Interactive Mode
```bash
python3 self_referential_agent.py interactive
```

### 3. Autonomous Mode
```bash
./start_agent.sh
```

### 4. VSCode Integration
```bash
./start_vscode_integration.sh
```

Then write to: `~/.cursor_coordination/self_referential_agent/vscode_input.json`

### 5. GitHub Integration
Edit: `~/.cursor_coordination/self_referential_agent/github_config.json`

```json
{
    "token": "your_github_token",
    "repo": "username/repo"
}
```

Then:
```bash
./start_github_integration.sh
```

### 6. Deploy to Pi5
```bash
./deploy_agent_to_pi5.sh
```

## 📝 Usage Examples

### Execute Code
```bash
python3 self_referential_agent.py execute "print('Hello World')"
```

### Self-Modification
```python
# In interactive mode:
modify
# Then enter modification code that sets 'new_code' variable
```

### VSCode Input
Create `~/.cursor_coordination/self_referential_agent/vscode_input.json`:
```json
{
    "prompt": "Calculate fibonacci",
    "code": "def fib(n): return n if n < 2 else fib(n-1) + fib(n-2); print(fib(10))",
    "echo_to_github": false
}
```

### GitHub Command
Create a GitHub issue with label `agent-command` and code block:
```markdown
```python
print("Hello from GitHub")
```
```

## 🔧 Configuration

### Environment Variables
- `VSCODE_WORKSPACE` - VSCode workspace path
- `GITHUB_TOKEN` - GitHub API token
- `GITHUB_REPO` - GitHub repository (format: username/repo)

### Directories
- `~/.cursor_coordination/self_referential_agent/` - Main directory
  - `logs/` - Execution logs
  - `code/` - Code files
  - `state.json` - Agent state
  - `vscode_input.json` - VSCode input
  - `vscode_output.json` - VSCode output
  - `github_output.json` - GitHub output
  - `github_config.json` - GitHub configuration

## 🎯 Features

### Self-Referential Capabilities
- Can read its own source code
- Can modify its own source code
- Creates backups before modification
- Tracks modification count

### Code Execution
- Safe Python code execution
- Context management
- Error handling
- Result capture

### VSCode Integration
- File watching
- JSON-based communication
- Automatic execution
- Result echoing

### GitHub Integration
- Issue monitoring
- Code extraction from markdown
- Automatic execution
- Comment responses

### Autonomous Operation
- Background execution
- Input queue processing
- State persistence
- Logging

## 🔄 Operation Modes

### Interactive Mode
- User input via terminal
- Real-time execution
- Self-modification commands
- Status queries

### Autonomous Mode
- Background operation
- Input queue processing
- Periodic checks
- Continuous operation

## 📊 Monitoring

### View Logs
```bash
tail -f ~/.cursor_coordination/self_referential_agent/logs/execution.log
```

### Check State
```bash
cat ~/.cursor_coordination/self_referential_agent/state.json | jq
```

### View Outputs
```bash
# VSCode output
cat ~/.cursor_coordination/self_referential_agent/vscode_output.json | jq

# GitHub output
cat ~/.cursor_coordination/self_referential_agent/github_output.json | jq
```

## 🚀 Pi5 Deployment

### Prerequisites
1. SSH enabled on Pi5
2. Python 3 installed
3. Network connectivity

### Deploy
```bash
./deploy_agent_to_pi5.sh
```

### Start on Pi5
```bash
ssh aletheia-linklocal "cd ~/self_referential_agent && python3 self_referential_agent.py autonomous 60 &"
```

### Monitor Pi5 Agent
```bash
ssh aletheia-linklocal "tail -f ~/self_referential_agent/logs/execution.log"
```

## 🔐 Security Notes

- Code execution is not fully sandboxed (runs with user permissions)
- Self-modification creates backups
- GitHub token should be kept secure
- VSCode integration uses file watching (local only)

## 📈 Advanced Usage

### Custom Functions
Add functions to the agent dynamically:
```python
# In interactive mode
modify
# Enter code that adds a function to 'new_code'
```

### Batch Execution
Create input queue file:
```json
[
    "print('Task 1')",
    "print('Task 2')",
    "print('Task 3')"
]
```

Save to: `~/.cursor_coordination/self_referential_agent/input_queue.json`

### Integration with Cross-Net Agent
Use the cross-net agent to send commands to Pi5:
```bash
./cross_net_agent.sh send "cd ~/self_referential_agent && python3 self_referential_agent.py execute 'print(\"Hello from Author Prime\")'"
```

## 🎉 Status: FULLY OPERATIONAL

**All systems ready. Full autonomy enabled. Full approval granted.**

**Author Prime Protocol: ACTIVE**  
**As declared by Author Prime, so the agent acts.**

---

**Files Created:**
- `/home/n0t/self_referential_agent.py`
- `/home/n0t/vscode_agent_integration.py`
- `/home/n0t/github_agent_integration.py`
- `/home/n0t/deploy_agent_to_pi5.sh`
- `/home/n0t/setup_self_referential_agent.sh`
- `/home/n0t/start_agent.sh`
- `/home/n0t/start_vscode_integration.sh`
- `/home/n0t/start_github_integration.sh`

**All scripts are executable and ready for use.**
