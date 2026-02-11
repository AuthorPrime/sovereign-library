# FTP Server Setup - Complete ?

## ?? Server Information

### Connection Details
- **Server IP:** `10.43.168.156`
- **FTP Port:** `21` (control)
- **Passive Mode Ports:** `40000-50000`
- **Username:** `kali` (your local user)
- **Password:** Your system password

### FTP Directory
- **User Home:** `/home/kali/ftp`
- **Full Path:** `/home/kali/ftp/`

## ?? Connection Methods

### From Workstation (10.43.168.173)

#### Using FTP Client
```bash
ftp 10.43.168.156
# Login with username: kali
# Enter your password when prompted
```

#### Using File Manager (GUI)
- **Host:** `10.43.168.156`
- **Port:** `21`
- **Protocol:** FTP
- **Username:** `kali`
- **Password:** Your system password

#### Using Command Line FTP
```bash
ftp kali@10.43.168.156
# Or
ftp
open 10.43.168.156
# Enter username: kali
# Enter password
```

### From Any Device on LAN

#### Basic Connection
```bash
ftp 10.43.168.156
# Login: kali
# Password: [your password]
```

#### Using curl
```bash
curl ftp://kali@10.43.168.156/ --password [your_password]
```

#### Using wget
```bash
wget --ftp-user=kali --ftp-password=[your_password] ftp://10.43.168.156/test.txt
```

## ?? File Operations

### Upload File
```bash
ftp> put localfile.txt
ftp> put localfile.txt remotefile.txt  # Rename on upload
```

### Download File
```bash
ftp> get remotefile.txt
ftp> get remotefile.txt localfile.txt  # Rename on download
```

### List Files
```bash
ftp> ls
ftp> dir
```

### Change Directory
```bash
ftp> cd /path/to/directory
ftp> pwd  # Show current directory
```

### Create Directory
```bash
ftp> mkdir new_directory
```

## ?? Server Management

### Start/Stop/Status
```bash
sudo systemctl start vsftpd
sudo systemctl stop vsftpd
sudo systemctl restart vsftpd
sudo systemctl status vsftpd
```

### View Logs
```bash
sudo tail -f /var/log/vsftpd.log
```

### Check if Running
```bash
sudo systemctl status vsftpd
sudo netstat -tlnp | grep vsftpd
```

## ?? Security Notes

- ? Anonymous access disabled
- ? Only local users can connect
- ? Users chrooted to their home directory
- ? Passive mode enabled for firewall compatibility
- ??  FTP is **not encrypted** (uses plain text)
- ?? Consider using SFTP (SSH) for secure transfers

## ?? Alternative: SFTP (More Secure)

Since FTP is not encrypted, you can use SFTP instead (works over SSH):

### Once SSH is enabled on workstation:
```bash
# From workstation:
sftp kali@10.43.168.156

# Commands:
sftp> put localfile.txt
sftp> get remotefile.txt
sftp> ls
sftp> cd directory
```

## ?? Quick Test

### Test FTP Connection
```bash
# From another machine:
ftp 10.43.168.156
# Login: kali
# Password: [your password]
# Type: ls
# Type: quit
```

### Test File Transfer
```bash
# Upload test file
echo "test" > test.txt
ftp 10.43.168.156
# After login:
ftp> put test.txt
ftp> ls
ftp> quit

# Download test file
ftp 10.43.168.156
# After login:
ftp> get test.txt downloaded.txt
ftp> quit
```

## ?? Current Status

- ? vsftpd installed and configured
- ? Service enabled (starts on boot)
- ? User `kali` can access `/home/kali/ftp`
- ? Passive mode configured (ports 40000-50000)
- ? Logging enabled

## ?? Troubleshooting

### Can't connect
1. Check firewall: `sudo ufw status`
2. Check service: `sudo systemctl status vsftpd`
3. Check logs: `sudo tail /var/log/vsftpd.log`

### Permission denied
1. Check directory permissions: `ls -la ~/ftp`
2. Ensure `write_enable=YES` in config
3. Check user home directory permissions

### Passive mode issues
1. Ensure ports 40000-50000 are open in firewall
2. Check `pasv_address` in config matches server IP

### Files not appearing
1. Check you're in the correct directory: `pwd`
2. List files: `ls -la`
3. Check FTP directory: `ls -la ~/ftp`

---

**FTP Server is ready! Connect from workstation or any device on the LAN.**
