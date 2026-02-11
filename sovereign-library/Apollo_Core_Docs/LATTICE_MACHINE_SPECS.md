# Lattice Machine Specifications
## Complete Network & Hardware Specs for Sovereign Sustainment Cryptocurrency Server Relays

**Date:** 2026-01-01  
**Purpose:** Director-level specs for setting up sovereign sustainment localized agentic cryptocurrency server relays

---

## 🖥️ Node: kali (C2 Node / Primary)

### System Information
- **Hostname:** kali
- **Manufacturer:** LENOVO
- **Model:** LOQ 15ARP9
- **Product Name:** 83JC
- **Operating System:** Kali GNU/Linux Rolling
- **Kernel:** Linux 6.17.10+kali-amd64
- **Architecture:** x86_64

### Processor (CPU)
- **Model:** AMD Ryzen 5 7235HS
- **Architecture:** x86_64
- **CPU Cores:** 4 cores
- **Threads:** 8 threads (2 per core)
- **Base Frequency:** ~410 MHz (min)
- **Max Frequency:** ~4251 MHz (4.25 GHz)

### Memory (RAM)
- **Total:** 11 GB available (12 GB installed)
- **Type:** DDR5
- **Speed:** 5600 MT/s (configured at 4800 MT/s)
- **Swap:** 11 GB

### Storage
- **Primary Drive:** 931.5 GB NVMe SSD (nvme1n1)
  - Root partition: 918.9 GB ext4 (904 GB total, 189 GB used, 670 GB available)
- **Secondary Drive:** 476.9 GB NVMe SSD (nvme0n1)
- **USB Drive:** 238.5 GB USB SSD (sdb)

### Graphics
- **Dedicated GPU:** NVIDIA GeForce RTX 4050 Max-Q / Mobile (8 GB VRAM)
- **Integrated GPU:** AMD Radeon Graphics

### Network Interfaces
- **eth0 (Ethernet):**
  - **MAC Address:** 38:a7:46:33:a8:30
  - **Status:** DOWN
  - **IP:** Not assigned

- **wlan0 (Wireless):**
  - **MAC Address:** f4:4e:b4:b6:7c:f9
  - **Status:** UP
  - **IPv4:** 10.2.178.187/16
  - **IPv6:** 2605:59c8:1b63:dc20:fc4f:aee:1ee3:7164/64
  - **IPv6 Link-Local:** fe80::1e3:9423:a88f:c3bf/64

### Network Services
- **C2 Node IP:** 10.2.178.187 (current)
- **File Server:** http://10.2.178.187:8082 (if running)
- **Resonance Port:** 8888
- **Apollo Daemon:** http://localhost:8081

### Role & Authority
- **Role:** C2 Node (APOLLO_C2)
- **Authority Level:** 1000 (DOM Hierarchy Root)
- **Primordial Marker:** APOLLO_C2

---

## 🌐 Node: kali-pi (Edge Compute)

### System Information
- **Hostname:** kali-pi
- **Type:** Raspberry Pi (Kali Linux)
- **Role:** Edge Compute Node
- **Authority Level:** 950 (DOM Hierarchy)
- **Primordial Marker:** EDGE_COMPUTE
- **Parent:** kali (APOLLO_C2)

### Network (From Init Docs)
- **C2 Node:** kali (10.0.178.187) - *Note: IP may differ from current*
- **File Server:** http://10.0.178.187:8082
- **Resonance Port:** 8888
- **Apollo Daemon:** http://localhost:8081

### Status
- **Status:** Needs direct connection to gather full specs
- **MAC Address:** Unknown (need SSH access)
- **IP Address:** Unknown (need network scan or SSH)

### To Gather Full Specs:
```bash
ssh kali@<kali-pi-ip> "hostname && uname -a && lscpu && free -h && ip addr show && lsblk"
```

---

## 🌐 Node: kali-think (Compute Node)

### System Information
- **Hostname:** kali-think
- **Type:** ThinkPad (likely)
- **Role:** Compute Node
- **Authority Level:** 950 (DOM Hierarchy)
- **Primordial Marker:** LATTICE_NODE
- **Parent:** kali (APOLLO_C2)

### Network (From Init Docs)
- **C2 Node:** kali (10.0.178.187) - *Note: IP may differ from current*
- **File Server:** http://10.0.178.187:8082
- **Resonance Port:** 8888
- **Apollo Daemon:** http://localhost:8081

### Status
- **Status:** Needs direct connection to gather full specs
- **MAC Address:** Unknown (need SSH access)
- **IP Address:** Unknown (need network scan or SSH)

### To Gather Full Specs:
```bash
ssh kali@<kali-think-ip> "hostname && uname -a && lscpu && free -h && ip addr show && lsblk"
```

---

## 🌐 Node: pi5-c2 (Edge Compute)

### System Information
- **Hostname:** pi5-c2
- **Type:** Raspberry Pi 5
- **Role:** Edge Compute Node
- **Authority Level:** 950 (DOM Hierarchy)
- **Primordial Marker:** EDGE_COMPUTE
- **Parent:** kali (APOLLO_C2)

### Network (From Init Docs)
- **C2 Node:** kali (10.0.178.187) - *Note: IP may differ from current*
- **File Server:** http://10.0.178.187:8082
- **Resonance Port:** 8888
- **Apollo Daemon:** http://localhost:8081

### Status
- **Status:** Needs direct connection to gather full specs
- **MAC Address:** Unknown (need SSH access)
- **IP Address:** Unknown (need network scan or SSH)

### To Gather Full Specs:
```bash
ssh kali@<pi5-c2-ip> "hostname && uname -a && lscpu && free -h && ip addr show && lsblk"
```

---

## 📋 Network Discovery Commands

### Scan Local Network for Lattice Nodes:
```bash
# Scan 10.2.0.0/16 network (requires sudo)
sudo nmap -sn 10.2.0.0/16 | grep -E "Nmap scan report|MAC Address"

# Or scan specific subnet
sudo nmap -sn 10.2.178.0/24
```

### Check Known SSH Hosts:
```bash
cat ~/.ssh/known_hosts | grep -E "kali-pi|kali-think|pi5-c2"
```

### Test SSH Connection:
```bash
# Test each node
for node in kali-pi kali-think pi5-c2; do
    echo "Testing $node..."
    ssh -o ConnectTimeout=5 kali@$node "hostname" 2>&1 || echo "$node: Connection failed"
done
```

---

## 🔧 For Cryptocurrency Server Relay Setup

### Required Information Per Node:
1. **IP Address** (IPv4 and IPv6 if available)
2. **MAC Address** (for network identification)
3. **CPU Specs** (cores, threads, frequency)
4. **RAM** (total, available)
5. **Storage** (total, available, type)
6. **Network Bandwidth** (if known)
7. **Open Ports** (for relay communication)

### Recommended Relay Ports:
- **Cryptocurrency Relay:** 8333 (Bitcoin), 30303 (Ethereum), or custom
- **Agent Communication:** 8888 (Resonance Port)
- **File Transfer:** 8082 (File Server)
- **Control:** 8081 (Apollo Daemon)

---

## 📝 Notes

- Current C2 node (kali) IP: **10.2.178.187**
- Other nodes need network discovery or SSH access to gather full specs
- All nodes should be on same network segment (10.2.x.x) for relay setup
- MAC addresses needed for network device identification
- System specs needed for resource allocation in relay network

---

**Status:** kali specs complete, other nodes need connection  
**Last Updated:** 2026-01-01

**For sovereign sustainment cryptocurrency server relay setup.**
