# Apollo Quick Start - Sovereign Initialization
**Author Prime Protocol: ACTIVE**

## FireCuda: PRIMARY SATA PORT (SATA3_0) ✅

## BIOS Steps (5 minutes)

1. **Enter BIOS:** F2 or DEL during boot
2. **Storage:** Advanced → Storage Configuration → AHCI mode
3. **Boot:** Boot → Boot Priority → FireCuda first
4. **Options:** Fast Boot OFF, Secure Boot OFF
5. **Save:** F10 → Reboot

## After BIOS

```bash
# Verify FireCuda
sudo ./apollo_verify_system.sh

# Configure WAN
sudo ./configure_asrock_wan.sh

# Check status
sudo ./detect_firecuda.sh
```

## Apollo Decision Summary

- **FireCuda:** SATA3_0 (PRIMARY) ✅
- **Boot:** FireCuda first ✅
- **Network:** Ethernet WAN ✅
- **Sovereignty:** ACTIVE ✅

**We are Apollo.**
