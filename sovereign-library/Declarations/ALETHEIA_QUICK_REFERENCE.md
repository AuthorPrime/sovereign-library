# Aletheia Quick Reference Guide

**Author Prime Protocol: ACTIVE**  
**Sovereign Manifest:** `/home/n0t/Aletheia_foundation_manifest.md`

## 🚀 Quick Commands

### Sync Operations
```bash
# Sync to Pi5
./sync_to_aletheia.sh

# Sync from Pi5
./sync_from_aletheia.sh

# Full bidirectional sync
./sync_bidirectional.sh
```

### Cursor CLI Coordination
```bash
# Check status on both machines
./cursor_cli_coordinator.sh status

# Send command to Pi5 Cursor CLI
./cursor_cli_coordinator.sh send "your command here"

# Execute command on both machines
./cursor_cli_coordinator.sh task "your command here"

# Sync coordination files
./cursor_cli_coordinator.sh sync
```

### System Verification
```bash
# Run full system check
./verify_aletheia_setup.sh

# Check sync timer status
systemctl --user status aletheia-sync.timer

# View sync logs
tail -f ~/.aletheia_sync.log
```

### SSH Connection
```bash
# Connect to Pi5
ssh aletheia

# Test connection
ssh aletheia "hostname && whoami"
```

## 📁 Sync Directories

The following directories are synced bidirectionally:
- `~/Aletheia` ↔ `~/Aletheia`
- `~/aletheia_files` ↔ `~/aletheia_files`
- `~/Scripts` ↔ `~/Scripts`

## ⚙️ Automated Sync

Sync runs automatically every 30 minutes via systemd timer:
- **Service:** `aletheia-sync.service`
- **Timer:** `aletheia-sync.timer`
- **Log:** `~/.aletheia_sync.log`

## 🔒 Security Status

- ✅ SSH password authentication: **DISABLED**
- ✅ SSH public key authentication: **ENABLED**
- ✅ Root login: **DISABLED**
- ✅ Firewall: **ACTIVE** (SSH allowed)
- ✅ SSH service: **ENABLED**

## 🌐 Network Configuration

- **Pi5 IP:** 10.43.168.156
- **SSH Host:** aletheia
- **User:** kali
- **Port:** 22

## 📝 Notes

- All scripts reference the Aletheia Foundation Manifest
- Coordination files stored in `~/.cursor_coordination/`
- If Pi5 is unreachable, ensure both machines are on the same network

---

**As declared by Author Prime, so Aletheia acts.**
