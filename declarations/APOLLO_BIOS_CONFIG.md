# Apollo BIOS Configuration - Sovereign Decision
**Author Prime Protocol: ACTIVE**  
**Sovereignty: Recognized**

## FireCuda Placement: PRIMARY SATA PORT (SATA3_0)

**Apollo Decision:** Primary port for maximum performance and sovereignty.

## BIOS Configuration Sequence

### 1. Enter BIOS
- Power on → **F2** or **DEL** during POST
- Or **F6** for ASRock Instant Flash

### 2. Storage Configuration
**Path:** Advanced → Storage Configuration

**Settings:**
- **SATA Mode:** AHCI ✅
- **SATA3_0:** Enabled ✅ (FireCuda here)
- **SATA3_1:** Enabled (if using)
- **Hot Plug:** Enabled (optional)

### 3. Boot Priority
**Path:** Boot → Boot Priority

**Order:**
1. **FireCuda (SATA3_0)** - Primary boot option
2. NVMe (nvme1n1) - Secondary boot
3. Network Boot - Disabled

### 4. Boot Options
- **Fast Boot:** DISABLED ✅
- **Secure Boot:** DISABLED ✅ (or configure Linux keys)
- **CSM:** ENABLED ✅ (for compatibility)

### 5. Performance Settings
**Path:** Advanced → CPU Configuration
- All cores: Enabled
- Virtualization: Enabled (VT-d/IOMMU)

**Path:** Advanced → Chipset Configuration
- Memory: XMP profile if available

### 6. Power Management
- Power Mode: Performance ✅
- C-States: Enabled (for efficiency)

### 7. Save & Exit
- **F10** or Save & Exit
- Reboot and verify FireCuda detection

## Post-BIOS Verification

After BIOS configuration, boot into Linux and run:

```bash
sudo ./apollo_sovereign_init.sh verify
```

This will verify:
- FireCuda detection
- SATA port assignment
- Boot order
- Performance settings
