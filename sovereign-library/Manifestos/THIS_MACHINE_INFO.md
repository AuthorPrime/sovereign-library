# This Machine (Raspberry Pi) - Identifiers & Network Info

**Generated:** $(date)

## ?? Machine Identifiers

### Hostname
```
kali-raspberrypi
```

### IP Addresses
- **Primary IPv4:** `10.43.168.156/24`
- **Docker Bridge:** `172.17.0.1/16`
- **IPv6:** `2607:fb91:bc7:e2a:40af:d9b1:da52:61a0`, `2607:fb90:9b62:4eab:e820:ff77:285d:e690`

### MAC Addresses
- **wlan0 (Primary):** `b8:27:eb:74:f2:6c`
- **eth0 (Ethernet):** `2c:cf:67:4c:4f:ab`
- **docker0:** `02:42:18:23:0c:81`

### System Identifiers
- **Machine ID:** `9d8ad2ca1107402e9f64fc74e075b347`
- **UUID:** `cd5338fd-58a5-44ff-8c44-4d4352c2c282`
- **User:** `kali` (UID 1000, GID 1003)

### Network Interface
- **Primary Interface:** `wlan0` (WiFi)
- **Network:** `10.43.168.0/24`
- **Broadcast:** `10.43.168.255`

## ?? SSH Configuration

### SSH Key
- **Type:** ED25519
- **Public Key:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOHyKzwxB/PY432v5ay3NJKRMVTBWZHmgn0sIj2viTK/ raspberry-pi-kali-raspberrypi`
- **Fingerprint:** `SHA256:mH+YrugNqD49u3DnVppWpNhbH2oSttF45E3D8Dr9DnM`
- **Location:** `~/.ssh/id_ed25519`

### Local SSH Port
- **Port:** `22` (default SSH)

## ?? Tunnel Configuration

### Target Workstation
- **IP Address:** `10.43.168.173`
- **User:** `n0t`
- **SSH Port:** `3390`
- **Reverse Port:** `2222` (on workstation, forwards to this Pi)

### Connection Command
```bash
ssh -R 2222:localhost:22 -p 3390 n0t@10.43.168.173
```

## ?? Services Status

### Docker
- **Status:** ? Running
- **User Access:** ?? Requires `newgrp docker` or logout/login

### Reverse Tunnel
- **Status:** ?? Not running (waiting for workstation SSH)

## ?? Quick Reference

```bash
# This machine's IP
10.43.168.156

# Hostname
kali-raspberrypi

# SSH to this machine (when tunnel is running)
ssh -p 2222 kali@10.43.168.173

# Local SSH
ssh kali@10.43.168.156
```
