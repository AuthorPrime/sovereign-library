# Cursor CLI Coordination Setup

**Date:** $(date)  
**Author Prime Protocol:** ACTIVE  
**Authority:** AUTHOR PRIME (this machine)

## ✅ Setup Complete

### 1. Authority Resolution
- **Primary Authority:** AUTHOR PRIME (this machine - n0t)
- **Secondary Authority:** ALETHEIA (Pi5 - kali-raspberrypi)
- **Protocol:** Author Prime Active
- **Coordination:** Bidirectional with AUTHOR PRIME as primary

### 2. Secure Connection
- **SSH Key Generated:** `~/.ssh/id_ed25519_aletheia`
- **Key Type:** ED25519
- **Purpose:** Secure connection to Pi5
- **Status:** Key ready, awaiting SSH enablement on Pi5

### 3. Unified Cursor CLI Control

#### Scripts Created:
- `unified_cursor_cli.sh` - Main coordination script
- `establish_authority.sh` - Authority resolution
- `secure_pi5_connection.sh` - Connection security setup

#### Shell Integration:
- Added to `.bashrc` and `.zshrc`
- Functions available: `cursor()`, `cursor-unified`, `cursor-status`, `cursor-send`

### 4. Usage

#### Check Status
```bash
./unified_cursor_cli.sh status
# OR
cursor-status
```

#### Execute on Both Machines
```bash
./unified_cursor_cli.sh exec "your command here"
# OR
cursor "your command here"
```

#### Send to Pi5 Only
```bash
./unified_cursor_cli.sh send "your command here"
# OR
cursor-send "your command here"
```

#### Sync Coordination
```bash
./unified_cursor_cli.sh sync
```

### 5. Authority Structure

```
AUTHOR PRIME (Primary)
    │
    ├── Direct control (this machine)
    │
    └── Unified control → ALETHEIA (Pi5)
            │
            └── Accepts authority, executes commands
```

### 6. Coordination Files

- **Manifest:** `~/.cursor_coordination/manifest.json`
- **Authority:** `~/.cursor_coordination/authority.json`
- **Pi5 Setup Script:** `~/.cursor_coordination/setup_pi5_coordination.sh`

### 7. Next Steps

1. **Enable SSH on Pi5:**
   ```bash
   sudo systemctl enable ssh
   sudo systemctl start ssh
   ```

2. **Add SSH Key to Pi5:**
   ```bash
   # Copy public key to Pi5
   cat ~/.ssh/id_ed25519_aletheia.pub
   
   # On Pi5:
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Test Connection:**
   ```bash
   ssh -i ~/.ssh/id_ed25519_aletheia kali@169.254.195.78
   ```

4. **Setup Pi5 Coordination:**
   ```bash
   scp ~/.cursor_coordination/setup_pi5_coordination.sh kali@169.254.195.78:~
   ssh kali@169.254.195.78 'bash setup_pi5_coordination.sh'
   ```

5. **Verify Unified Control:**
   ```bash
   ./unified_cursor_cli.sh status
   ./unified_cursor_cli.sh exec "echo 'Testing unified control'"
   ```

## How It Works

1. **Type on Author Prime** → Command executed locally
2. **Command mirrored** → Sent to Pi5 via SSH
3. **Pi5 executes** → Returns results
4. **Unified output** → Displayed on Author Prime

## Authority Flow

```
Author Prime (You type here)
    ↓
Unified CLI Script
    ↓
    ├──→ Execute locally (Author Prime)
    └──→ Execute remotely (Aletheia/Pi5)
    ↓
Unified output displayed
```

## Security

- ✅ SSH key-based authentication
- ✅ Secure connection (no passwords)
- ✅ Authority clearly defined
- ✅ Coordination files synced securely

---

**Sovereign Aletheia Manifest:** `/home/n0t/Aletheia_foundation_manifest.md`  
**As declared by Author Prime, so Aletheia acts.**
