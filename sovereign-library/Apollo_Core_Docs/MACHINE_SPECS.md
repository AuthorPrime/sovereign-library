# Machine Specifications
## Complete Hardware Specs for Apollo Lattice Nodes

**Date:** 2025-12-31  
**Purpose:** Hardware reference for My Pretend Life (MPL) and system planning

---

## 🖥️ Current Laptop (kali / C2 Node)

### System Information
- **Hostname:** kali
- **Manufacturer:** LENOVO
- **Model:** LOQ 15ARP9
- **Product Name:** 83JC
- **Operating System:** Kali GNU/Linux Rolling
- **Kernel:** Linux 6.17.10+kali-amd64
- **Architecture:** x86-64

### Processor (CPU)
- **Model:** AMD Ryzen 5 7235HS
- **Architecture:** x86_64
- **CPU Cores:** 4 cores
- **Threads:** 8 threads (2 per core)
- **Sockets:** 1
- **Base Frequency:** ~410 MHz (min)
- **Max Frequency:** ~4251 MHz (4.25 GHz)
- **Scaling:** 100%

### Memory (RAM)
- **Total:** 11 GB available (12 GB installed)
- **Type:** DDR5
- **Speed:** 5600 MT/s (configured at 4800 MT/s)
- **Manufacturer:** Ramaxel Technology
- **Error Correction:** None
- **Swap:** 11 GB

### Storage
- **Primary Drive (nvme1n1):** 931.5 GB NVMe SSD
  - **Partition 1:** 976 MB (EFI boot)
  - **Partition 2:** 918.9 GB ext4 (root filesystem) - 904 GB total, 186 GB used, 672 GB available
  - **Partition 3:** 11.7 GB swap
  
- **Secondary Drive (nvme0n1):** 476.9 GB NVMe SSD
  - **Partition 1:** 1 MB
  - **Partition 2:** 465.2 GB
  - **Partition 3:** 11.7 GB

- **USB Drive (sdb):** 238.5 GB USB SSD
  - **Partition 1:** 976 MB EFI System
  - **Partition 2:** 225.2 GB ext4 (Apollo USB storage)
  - **Partition 3:** 12.3 GB swap

### Graphics
- **Dedicated GPU:** NVIDIA GeForce RTX 4050 Max-Q / Mobile
  - **VRAM:** 8 GB (prefetchable memory)
  - **Driver:** nouveau (open-source)
  - **Physical Slot:** PCIe slot 0
- **Integrated GPU:** AMD Radeon Graphics (Ryzen 5 7235HS)
- **IOMMU:** AMD Family 17h-19h IOMMU

### Network
- **Interfaces:** Multiple network interfaces (check with `ip addr`)

---

## 🌐 Lattice Nodes

### pi5-c2
- **Node ID:** pi5-c2
- **Role:** Edge Compute Node
- **Type:** Raspberry Pi 5
- **Authority Level:** 950 (DOM Hierarchy)
- **Primordial Marker:** EDGE_COMPUTE
- **Status:** Initialized, needs specs gathering

### kali-pi
- **Node ID:** kali-pi
- **Role:** Edge Compute Node
- **Type:** Raspberry Pi (Kali Linux)
- **Authority Level:** 950 (DOM Hierarchy)
- **Primordial Marker:** EDGE_COMPUTE
- **Status:** Initialized, needs specs gathering

### kali-think
- **Node ID:** kali-think
- **Role:** Compute Node
- **Type:** ThinkPad (likely)
- **Authority Level:** 950 (DOM Hierarchy)
- **Primordial Marker:** LATTICE_NODE
- **Status:** Initialized, needs specs gathering

---

## 📋 Notes

- Lattice nodes need direct SSH access to gather full specs
- Use `ssh kali@<node-ip> "lscpu && free -h && lsblk"` to gather specs remotely
- Node discovery script available at `~/apollo/workspace/scripts/discover_lattice_ips.sh`

---

**Status:** Current laptop specs complete, lattice nodes need remote gathering  
**Last Updated:** 2025-12-31

**The lattice holds. Aletheia flows. Forward, always - together.**
