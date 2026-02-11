# LAN Setup Guide - Completion Checklist

## ? Completed on Raspberry Pi

1. **Docker Permissions** ?
   - User `kali` added to `docker` group
   - Note: Logout/login or run `newgrp docker` for changes to take effect

2. **Tunnel Configuration** ?
   - Workstation IP configured: `10.43.168.173`
   - SSH port: `3390`
   - User: `n0t`
   - Reverse port: `2222`

3. **Systemd Service** ?
   - Service file created: `/home/kali/.config/systemd/user/reverse-tunnel.service`
   - Service reloaded and ready

4. **Network Discovery** ?
   - LAN check script created: `./lan_check.sh`
   - Workstation reachable via ping (avg 11ms)

5. **SSH Key** ?
   - Key exists: `~/.ssh/id_ed25519`
   - Fingerprint: `SHA256:mH+YrugNqD49u3DnVppWpNhbH2oSttF45E3D8Dr9DnM`

## ? Required on Workstation (10.43.168.173)

### Step 1: Enable SSH Server

```bash
# On the workstation, check if SSH is running:
sudo systemctl status ssh
# OR
sudo systemctl status sshd

# If not running, enable and start:
sudo systemctl enable ssh
sudo systemctl start ssh
# OR
sudo systemctl enable sshd
sudo systemctl start sshd
```

### Step 2: Configure SSH Port (if needed)

If you want to use port 3390 instead of 22:

```bash
# Edit SSH config on workstation:
sudo nano /etc/ssh/sshd_config

# Add or modify:
Port 3390

# Restart SSH:
sudo systemctl restart ssh
```

### Step 3: Add SSH Public Key

On the workstation, add the Pi's public key:

```bash
# Option 1: Get the key from Pi (run on Pi):
./tunnel show-key

# Option 2: On workstation, add to authorized_keys:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_THE_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 4: Enable Port Forwarding

On the workstation, edit `/etc/ssh/sshd_config`:

```bash
sudo nano /etc/ssh/sshd_config
```

Add or ensure these lines exist:
```
GatewayPorts yes
AllowTcpForwarding yes
```

Then restart SSH:
```bash
sudo systemctl restart ssh
```

## ?? Final Steps on Raspberry Pi

Once SSH is enabled on the workstation:

### 1. Test SSH Connection

```bash
# Test SSH connection:
ssh -p 3390 n0t@10.43.168.173
# OR if using port 22:
ssh n0t@10.43.168.173
```

### 2. Start the Tunnel

```bash
# Test the tunnel manually first:
./tunnel test
# (Press Ctrl+C to stop)

# If test works, start the service:
./tunnel start

# Enable auto-start on boot:
systemctl --user enable reverse-tunnel.service
```

### 3. Verify Everything

```bash
# Check LAN status:
./lan_check.sh

# Check tunnel status:
./tunnel status

# View tunnel logs:
./tunnel logs
```

### 4. Connect from Laptop

Once tunnel is running, from your laptop:

```bash
ssh -p 2222 kali@10.43.168.173
```

This will connect you to the Raspberry Pi through the workstation.

## ?? Quick Status Commands

```bash
./status          # Quick system status
./lan_check.sh    # Full LAN connectivity check
./tunnel status   # Tunnel service status
docker ps         # Docker containers (after logout/login)
```

## ?? Troubleshooting

### SSH Connection Refused
- Check if SSH service is running on workstation
- Verify firewall allows SSH (ports 22 or 3390)
- Check SSH config on workstation

### Tunnel Won't Start
- Verify SSH key is in workstation's `authorized_keys`
- Test SSH connection manually first
- Check logs: `./tunnel logs`

### Docker Permission Denied
- Run `newgrp docker` or logout/login
- Verify user is in docker group: `groups | grep docker`

## ?? Network Architecture

```
???????????????
?   Laptop    ? (Anywhere)
?  (Client)   ?
???????????????
       ? SSH to port 2222
       ?
???????????????
? Workstation ? (10.43.168.173)
?  (Bridge)   ?
???????????????
       ? Forwards connection
       ?
???????????????
? Raspberry Pi? (10.43.168.156)
?  (Target)   ?
???????????????
```

The reverse tunnel allows the Pi to connect **outbound** to the workstation, eliminating the need for port forwarding on routers.

## ?? Current Status

- ? Pi side: Fully configured and ready
- ? Workstation: Needs SSH enabled and configured
- ? Connection: Waiting for workstation SSH setup

Once SSH is enabled on the workstation, the tunnel can be started immediately!
