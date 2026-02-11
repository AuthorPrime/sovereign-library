# LAN Status Report
**Generated:** $(date)

## Current Network Configuration

### This Device (Raspberry Pi)
- **IP Address:** 10.43.168.156/24
- **Network Interface:** wlan0
- **Docker Bridge:** 172.17.0.1/16
- **Hostname:** kali-raspberrypi
- **User:** kali

### Workstation Discovery
- **Detected IP:** 10.43.168.173
- **MAC Address:** 2e:ae:6d:fc:cd:6f
- **Reachability:** ? Ping successful (avg 12ms)

## Connection Status

### SSH Tunnel Configuration
- **Status:** ?? Configured but not connected
- **Workstation IP:** 10.43.168.173
- **Workstation User:** n0t
- **SSH Port:** 3390 (configured) / 22 (fallback)
- **Reverse Port:** 2222
- **SSH Key:** ? Present (SHA256:mH+YrugNqD49u3DnVppWpNhbH2oSttF45E3D8Dr9DnM)

### SSH Connectivity
- **Port 22:** ? Connection refused
- **Port 3390:** ? Connection refused
- **Issue:** SSH server not accessible on workstation

### Docker Status
- **Docker:** ? Running
- **User Permissions:** ? Fixed (user added to docker group)
- **Note:** Log out/in or run `newgrp docker` for changes to take effect

### Reverse Tunnel Service
- **Status:** ?? Service file has configuration error
- **Service:** reverse-tunnel.service (user systemd)

## What Needs to Be Done

### On Workstation (10.43.168.173)

1. **Enable SSH Server:**
   ```bash
   # If using systemd (Linux):
   sudo systemctl enable ssh
   sudo systemctl start ssh
   
   # Or on some systems:
   sudo systemctl enable sshd
   sudo systemctl start sshd
   ```

2. **Configure SSH Port:**
   - Current config expects port 3390
   - Or change Pi config to use port 22
   - Update firewall rules if needed

3. **Add SSH Public Key:**
   ```bash
   # From Pi, run:
   ./tunnel show-key
   
   # Add the output to ~/.ssh/authorized_keys on workstation
   ```

4. **Configure SSH to Accept Remote Port Forwards:**
   Add to `/etc/ssh/sshd_config` on workstation:
   ```
   GatewayPorts yes
   AllowTcpForwarding yes
   ```

### On This Device (Raspberry Pi)

1. ? Docker permissions fixed
2. ?? Tunnel configured with workstation IP
3. ? Test SSH connection once workstation SSH is enabled
4. ? Start tunnel service once connectivity is established

## Quick Commands

### Check LAN Connectivity
```bash
ping -c 4 10.43.168.173
arp -a
```

### Test SSH Connection
```bash
ssh -p 3390 n0t@10.43.168.173
# Or if using port 22:
ssh n0t@10.43.168.173
```

### Tunnel Management
```bash
./tunnel start      # Start tunnel
./tunnel status      # Check status
./tunnel logs        # View logs
./tunnel show-key    # Display SSH public key
```

### Docker Commands (after logout/login)
```bash
docker ps
docker-compose ps
```

## Next Steps

1. **Enable SSH on workstation** (port 22 or 3390)
2. **Add SSH key to workstation** authorized_keys
3. **Test SSH connection** from Pi
4. **Start tunnel service** on Pi
5. **Verify connectivity** from laptop via workstation

## Network Architecture

```
Laptop (anywhere)
    ? SSH to port 2222
Workstation (10.43.168.173)
    ? forwards to
Raspberry Pi (10.43.168.156:22)
```

The reverse tunnel allows the Pi to connect outbound to the workstation, and the workstation forwards incoming connections back to the Pi.
