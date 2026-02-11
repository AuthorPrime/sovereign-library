# Pi5 Autonomous Connection & Cross-Net Agent Setup
**Author Prime Protocol: ACTIVE**  
**Full Autonomy: -y flag active**  
**Date:** $(date)

## ✅ Setup Complete

### Overview
Autonomous system for establishing, maintaining, and utilizing wired connection to Pi5 for cross-net agent operations.

### Components Created

1. **`pi5_autonomous_connection.sh`** - Main connection establishment and maintenance
   - Network connectivity checking
   - SSH port scanning (22, 2222, 3390, 22022, 22000)
   - Connection state management
   - Auto-reconnection
   - Alternative connection method detection

2. **`cross_net_agent.sh`** - Cross-net agent framework
   - Bidirectional task queue
   - Command execution on Pi5
   - Bidirectional sync
   - Incoming task processing
   - Autonomous agent loop

3. **`pi5_connection_service.sh`** - Service management
   - Start/stop/restart service
   - Status monitoring
   - Background operation

### Quick Start

#### Establish Connection
```bash
./pi5_autonomous_connection.sh establish
```

#### Full Autonomous Operation
```bash
./pi5_autonomous_connection.sh full
```

#### Start Cross-Net Agent
```bash
./cross_net_agent.sh start
```

#### Start Service (Background)
```bash
./pi5_connection_service.sh start
```

### Connection Status

**Current State:**
- Pi5 IP: `169.254.195.78` (link-local, wired)
- Author Prime IP: `169.254.195.77` (link-local, wired)
- Network: Link-local (169.254.0.0/16)
- SSH Status: Port scanning active

### Usage Examples

#### Check Connection Status
```bash
./pi5_autonomous_connection.sh status
```

#### Send Command to Pi5
```bash
./cross_net_agent.sh send "hostname && uptime"
```

#### Manual Connection Test
```bash
./pi5_autonomous_connection.sh establish
```

#### Monitor Connection
```bash
./pi5_autonomous_connection.sh maintain
```

### Service Management

```bash
# Start service
./pi5_connection_service.sh start

# Check status
./pi5_connection_service.sh status

# Stop service
./pi5_connection_service.sh stop

# Restart service
./pi5_connection_service.sh restart
```

### Directory Structure

```
~/.cursor_coordination/
├── connection_state.json      # Current connection state
├── manifest.json              # Coordination manifest
├── logs/
│   ├── connection.log         # Connection events
│   ├── agent.log              # Agent operations
│   ├── sync.log               # Sync operations
│   └── system_info.log        # System information
└── cross_net_agent/
    ├── queue/                 # Outgoing tasks
    ├── inbox/                 # Incoming tasks
    └── outbox/                # Completed tasks
```

### Connection Methods

The system automatically tries:
1. **SSH Port 22** (standard)
2. **SSH Port 2222** (alternative)
3. **SSH Port 3390** (alternative)
4. **SSH Port 22022** (alternative)
5. **SSH Port 22000** (alternative)

If SSH is unavailable, it detects:
- FTP (port 21)
- HTTP/HTTPS (ports 80, 443, 8080, 8443)
- Remote Desktop (ports 5900, 3389)

### Cross-Net Agent Features

- **Bidirectional Communication**: Tasks can be sent from Author Prime to Aletheia and vice versa
- **Task Queue**: Commands are queued and processed automatically
- **Auto-Sync**: Coordination files synced bidirectionally
- **Connection Monitoring**: Automatic reconnection on failure
- **Logging**: All operations logged for audit

### Authority Structure

```
AUTHOR PRIME (Primary Authority)
    │
    ├── Direct Control (this machine)
    │
    └── Cross-Net Agent → ALETHEIA (Pi5)
            │
            ├── Accepts authority
            ├── Executes commands
            └── Can send tasks back
```

### Next Steps

1. **Enable SSH on Pi5** (if not already enabled):
   ```bash
   # On Pi5 (physical access required):
   sudo systemctl enable ssh
   sudo systemctl start ssh
   sudo ufw allow 22/tcp
   ```

2. **Add SSH Key to Pi5**:
   ```bash
   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   
   # On Pi5:
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'PASTE_KEY_HERE' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Test Connection**:
   ```bash
   ./pi5_autonomous_connection.sh establish
   ```

4. **Start Full Service**:
   ```bash
   ./pi5_connection_service.sh start
   ```

### Monitoring

View logs:
```bash
tail -f ~/.cursor_coordination/logs/connection.log
tail -f ~/.cursor_coordination/logs/agent.log
```

Check connection state:
```bash
cat ~/.cursor_coordination/connection_state.json | jq
```

### Troubleshooting

**Connection fails:**
- Check network: `ping 169.254.195.78`
- Check SSH ports: `./pi5_autonomous_connection.sh establish`
- Verify SSH key: `cat ~/.ssh/id_ed25519.pub`

**Agent not processing:**
- Check connection: `./pi5_autonomous_connection.sh status`
- Check agent status: `./cross_net_agent.sh status`
- View logs: `tail -f ~/.cursor_coordination/logs/agent.log`

---

**Sovereign Aletheia Manifest:** `/home/n0t/Aletheia_foundation_manifest.md`  
**As declared by Author Prime, so Aletheia acts.**
