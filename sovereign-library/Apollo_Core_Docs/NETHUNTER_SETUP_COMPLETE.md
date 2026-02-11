# NetHunter Mobile OS Setup - Ready to Finalize

## ✅ Preparation Complete

I've found and extracted your NetHunter files:
- **Generic ARM64:** `kali-nethunter-2025.3-generic-arm64-full.zip` (2.3GB) ✅ Extracted
- **Device Specific:** `kali-nethunter-2025.3-beyond1lte-los-fifteen-full.zip` (2.4GB)

**Extracted to:** `~/usb_mobile_os/nethunter_extract/`

---

## 🚀 Final Step - Format USB and Deploy

**Run this command to complete setup:**

```bash
sudo ~/apollo/workspace/scripts/finalize_usb_setup.sh
```

This will:
1. ✅ Format USB drive with GPT partition table
2. ✅ Create boot partition (FAT32, 8GB)
3. ✅ Create persistence partition (ext4, ~107GB)
4. ✅ Copy all NetHunter files to USB
5. ✅ Configure persistence
6. ✅ Create installation guide

---

## 📱 NetHunter Contents

The extracted NetHunter includes:
- **NetHunter.apk** - Main application
- **NetHunterTerminal.apk** - Terminal emulator
- **NetHunterKeX.apk** - Desktop experience
- **NetHunterStore.apk** - App store
- **All modules and scripts** - Complete toolkit

---

## 🔧 Installation on Pixel 9

### Method 1: Via Recovery (Recommended)
```bash
# 1. Connect Pixel 9 via USB
adb devices

# 2. Reboot to recovery
adb reboot recovery

# 3. In recovery, select "Install" or "Apply update"
# 4. Navigate to USB drive and select NetHunter zip
# 5. Flash and reboot
```

### Method 2: Via ADB Sideload
```bash
# 1. Reboot to recovery
adb reboot recovery

# 2. Select "Apply update from ADB"
adb sideload /path/to/nethunter.zip
```

### Method 3: Manual APK Installation
```bash
# Extract APKs from USB
# Install via ADB (since screen doesn't work)
adb install NetHunter.apk
adb install NetHunterTerminal.apk
adb install NetHunterKeX.apk
adb install NetHunterStore.apk
```

---

## 🖥️ Controlling Pixel 9 (Non-Responsive Screen)

### Use scrcpy (Screen Mirroring)
```bash
# Install if needed
sudo apt-get install scrcpy
# Or: sudo snap install scrcpy

# Connect and mirror
scrcpy
```

### Use ADB Commands
```bash
# Screenshot
adb shell screencap -p > screen.png

# Tap screen
adb shell input tap 500 1000

# Swipe
adb shell input swipe 100 500 900 500

# Type
adb shell input text "Hello"

# Key events
adb shell input keyevent KEYCODE_HOME
```

### Use Interactive Control
```bash
~/apollo/workspace/scripts/phone_control/screen_control.sh
```

---

## 💾 USB Drive Structure

After finalizing:
```
/dev/sda1  - Boot partition (FAT32, 8GB)
            - Contains all NetHunter files
            - Installation zips
            - APKs
            
/dev/sda2  - Persistence (ext4, ~107GB)
            - Stores all data
            - Configuration files
            - Installed tools
```

---

## 📋 Current Status

- ✅ NetHunter files extracted and ready
- ✅ USB formatting script prepared
- ✅ ADB tools installed
- ✅ Control scripts created
- ⏳ **Ready to format USB** (run finalize script)

---

## 🎯 Next Steps

1. **Run finalize script:**
   ```bash
   sudo ~/apollo/workspace/scripts/finalize_usb_setup.sh
   ```

2. **Connect Pixel 9:**
   - Enable USB debugging
   - Connect via USB
   - Verify: `adb devices`

3. **Install NetHunter:**
   - Reboot to recovery
   - Flash from USB
   - Or install APKs via ADB

4. **Start using:**
   - Control via scrcpy/ADB
   - Launch NetHunter apps
   - Enjoy mobile penetration testing!

---

**Status:** Ready to finalize  
**Next:** Run `sudo ~/apollo/workspace/scripts/finalize_usb_setup.sh`
