# Mobile OS Setup - Ready to Format

## ✅ Scripts Created

All scripts are ready for setting up your Pixel 9 mobile OS on the USB drive.

---

## 🚀 Quick Start Commands

### 1. Format USB Drive (Requires Sudo)
```bash
sudo ~/apollo/workspace/scripts/format_usb_auto.sh
```

This will:
- ✅ Create GPT partition table
- ✅ Partition 1: Boot (FAT32, 4GB)
- ✅ Partition 2: Persistence (ext4, ~111GB)
- ✅ Configure persistence for Kali Linux

### 2. Setup ADB for Phone Control
```bash
~/apollo/workspace/scripts/setup_adb_phone_control.sh
```

This installs:
- ✅ ADB tools
- ✅ Screen control scripts
- ✅ scrcpy setup
- ✅ VNC server tools

---

## 📱 Pixel 9 Setup Options

### Option 1: Kali NetHunter (Easiest)
**Best for:** Quick setup, Android-based tools

1. Enable USB debugging on Pixel 9
2. Connect via USB
3. Install NetHunter via ADB:
   ```bash
   adb install nethunter.apk
   ```

### Option 2: Termux + Kali Chroot (Full Linux)
**Best for:** Complete Linux environment

1. Install Termux from F-Droid (via ADB)
2. Setup Kali in Termux:
   ```bash
   pkg install proot-distro
   proot-distro install kali
   proot-distro login kali
   ```

### Option 3: USB Bootable Kali (Persistent)
**Best for:** Booting full Kali from USB

1. Download Kali ISO
2. Write to USB boot partition
3. Boot from USB on compatible device
4. Persistence saves all changes

---

## 🖥️ Controlling Non-Responsive Screen

### Method 1: scrcpy (Recommended)
```bash
# Install
sudo apt-get install scrcpy
# Or: sudo snap install scrcpy

# Use
scrcpy
```
Mirrors and controls your Pixel 9 screen on Linux.

### Method 2: ADB Commands
```bash
# Screenshot
adb shell screencap -p > screen.png

# Tap screen
adb shell input tap 500 1000

# Swipe
adb shell input swipe 100 500 900 500

# Type text
adb shell input text "Hello"

# Key events
adb shell input keyevent KEYCODE_HOME
```

### Method 3: Interactive Control
```bash
~/apollo/workspace/scripts/phone_control/screen_control.sh
```

---

## 💾 USB Drive Structure

After formatting:
```
/dev/sda1  - Boot partition (FAT32, ~4GB)
            - For Kali ISO/boot files
            
/dev/sda2  - Persistence (ext4, ~111GB)
            - Saves all changes, installed packages, files
            - Persistence.conf configured
```

---

## 📋 Next Steps

1. **Format USB drive:**
   ```bash
   sudo ~/apollo/workspace/scripts/format_usb_auto.sh
   ```

2. **Enable USB debugging on Pixel 9:**
   - Settings > About phone > Tap "Build number" 7 times
   - Settings > System > Developer options > Enable "USB debugging"

3. **Connect Pixel 9 and verify:**
   ```bash
   adb devices
   ```

4. **Control phone:**
   ```bash
   scrcpy  # Screen mirroring
   # Or use ADB commands
   ```

5. **Install NetHunter or Termux:**
   - Via ADB (since screen doesn't work)
   - Or download APK and install via ADB

---

## 📚 Documentation

- **Full Guide:** `docs/PIXEL9_MOBILE_OS_SETUP.md`
- **ADB Control:** `scripts/phone_control/`
- **Format Script:** `scripts/format_usb_auto.sh`

---

## ⚠️ Important Notes

- **Screen Non-Responsive:** Use ADB/scrcpy for all control
- **USB Formatting:** Will erase all data (already empty)
- **Persistence:** All changes saved to partition 2
- **Boot:** USB can boot Kali on compatible devices
- **Mobile:** NetHunter/Termux run directly on Pixel 9

---

**Status:** Ready to format and deploy  
**USB Device:** `/dev/sda` (115GB)  
**Next:** Run format script with sudo
