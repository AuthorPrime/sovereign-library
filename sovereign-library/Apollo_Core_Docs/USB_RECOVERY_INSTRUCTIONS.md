# USB Drive Recovery Instructions

## Quick Recovery

Run the recovery script with sudo:

```bash
sudo ~/apollo/workspace/scripts/recover_usb_drive.sh
```

This script will:
1. ✅ Check for partitions
2. ✅ Detect filesystem type
3. ✅ Check filesystem integrity (read-only)
4. ✅ Attempt to mount and recover any data
5. ✅ Save recovered data to `~/usb_recovery_data/`
6. ✅ Generate a recovery log at `~/usb_recovery.log`

---

## Manual Recovery Steps

If you prefer to do it manually:

### Step 1: Check Partition Table
```bash
sudo fdisk -l /dev/sda
```

### Step 2: Detect Filesystem
```bash
sudo file -s /dev/sda
```

### Step 3: Check Filesystem (Read-Only)
```bash
sudo fsck -n /dev/sda
```

### Step 4: Try to Mount
```bash
sudo mkdir -p /mnt/usb_recovery
sudo mount /dev/sda /mnt/usb_recovery
# OR if partitioned:
sudo mount /dev/sda1 /mnt/usb_recovery
```

### Step 5: Recover Data (if mounted)
```bash
mkdir -p ~/usb_recovery_data
sudo cp -r /mnt/usb_recovery/* ~/usb_recovery_data/
sudo chown -R $USER:$USER ~/usb_recovery_data
sudo umount /mnt/usb_recovery
```

### Step 6: Check Recovered Data
```bash
ls -lah ~/usb_recovery_data
find ~/usb_recovery_data -type f
```

---

## If No Data Found

If the device is empty/unformatted, you can format it:

### Format as FAT32 (Windows/Linux compatible)
```bash
sudo mkfs.vfat -F 32 /dev/sda
```

### Format as ext4 (Linux)
```bash
sudo mkfs.ext4 /dev/sda
```

### Create Partition First (if needed)
```bash
sudo fdisk /dev/sda
# Then follow prompts to create partition
# Then format: sudo mkfs.vfat -F 32 /dev/sda1
```

---

## Recovery Log

After running the script, check:
- **Log file:** `~/usb_recovery.log`
- **Recovered data:** `~/usb_recovery_data/`

---

**Status:** Ready to recover  
**Next:** Run `sudo ~/apollo/workspace/scripts/recover_usb_drive.sh`
