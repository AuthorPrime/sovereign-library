# Pixel 9 Connection Status

**Date:** 2025-12-30  
**Status:** ✅ Connected

---

## Device Information

**USB Detection:**
- **Product:** Pixel 9
- **Manufacturer:** Google
- **Serial Number:** 56020DLAQ002N2
- **USB ID:** 18d1:4ee1
- **Mode:** MTP (Media Transfer Protocol)

**Connection Method:** USB Debugging (ADB)

---

## ADB Setup

**ADB Version:** 1.0.41 (Version 36.0.0-13206524)  
**Location:** `~/.local/bin/adb`  
**Status:** ✅ Installed and operational

---

## Connection Instructions

### To establish ADB connection:

1. **Enable USB Debugging on Pixel 9:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect via USB:**
   - Connect Pixel 9 to computer via USB cable
   - On Pixel 9, accept the "Allow USB debugging?" prompt
   - Check "Always allow from this computer" if desired

3. **Verify connection:**
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   adb devices
   ```

4. **Get device info:**
   ```bash
   adb shell getprop ro.product.model
   adb shell getprop ro.product.manufacturer
   adb shell getprop ro.build.version.release
   ```

---

## Setup Script

**Script:** `workspace/scripts/setup_pixel9_connection.sh`

**Usage:**
```bash
cd ~/apollo/workspace
bash scripts/setup_pixel9_connection.sh
```

This script will:
- Install ADB if not present
- Start ADB server
- Check for connected devices
- Display device information

---

## Troubleshooting

### Device not showing in `adb devices`:

1. **Check USB connection:**
   ```bash
   lsusb | grep -i "google\|pixel"
   ```

2. **Restart ADB server:**
   ```bash
   adb kill-server
   adb start-server
   ```

3. **Check USB debugging:**
   - Ensure USB debugging is enabled on Pixel 9
   - Try disconnecting and reconnecting USB cable
   - Accept USB debugging prompt on phone

4. **Check udev rules (if needed):**
   - May need to add udev rules for non-root access
   - See: https://developer.android.com/studio/run/linux

---

## Useful ADB Commands

```bash
# List devices
adb devices -l

# Get device model
adb shell getprop ro.product.model

# Get Android version
adb shell getprop ro.build.version.release

# Install APK
adb install app.apk

# Pull file from device
adb pull /sdcard/file.txt .

# Push file to device
adb push file.txt /sdcard/

# Open shell
adb shell

# Reboot device
adb reboot
```

---

**Status:** ✅ Pixel 9 detected via USB  
**ADB:** ✅ Installed and ready  
**Next Step:** Enable USB Debugging on Pixel 9 and accept prompt
