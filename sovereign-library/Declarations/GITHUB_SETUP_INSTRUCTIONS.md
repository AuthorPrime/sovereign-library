# GitHub Setup Instructions

**Date:** $(date)  
**Author Prime Protocol:** ACTIVE

## ✅ Setup Complete

### 1. SSH Keys Generated

#### Author Prime (This Machine)
```bash
cat ~/.ssh/id_ed25519_github.pub
```

#### Aletheia (Pi5)
```bash
ssh aletheia-linklocal 'cat ~/.ssh/id_ed25519_github.pub'
```

### 2. Add SSH Keys to GitHub

1. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_ed25519_github.pub
   ```

2. **Go to GitHub:**
   - Navigate to: https://github.com/settings/keys
   - Click "New SSH key"
   - Title: "Author Prime - $(hostname)"
   - Paste your public key
   - Click "Add SSH key"

3. **Repeat for Pi5:**
   - Copy Pi5's public key
   - Add as "Aletheia - kali-raspberrypi"

### 3. Test Connection

```bash
# Test Author Prime
ssh -T git@github.com

# Test Pi5 (once SSH is enabled)
ssh aletheia-linklocal 'ssh -T git@github.com'
```

Expected output: `Hi username! You've successfully authenticated...`

### 4. Configure Git

```bash
# Set your GitHub username and email
git config --global user.name "YourGitHubUsername"
git config --global user.email "your.email@example.com"

# Verify
git config --global --list
```

### 5. Clone/Create Repositories

```bash
# Clone existing repo
git clone git@github.com:username/repo.git

# Create new repo
mkdir my-project
cd my-project
git init
git remote add origin git@github.com:username/my-project.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## VS Code Integration

### Open Workspace

```bash
# Single folder
code ~/workspace

# Multi-root workspace
code ~/vscode_workspace.code-workspace
```

### GitHub Features in VS Code

- **Source Control:** Built-in Git integration
- **GitHub Copilot:** AI pair programming
- **Pull Requests:** View and manage PRs directly in VS Code
- **GitLens:** Enhanced Git capabilities

### Recommended Extensions (Already Installed)

- GitHub Copilot
- GitHub Pull Requests
- GitLens
- Remote SSH (for Pi5 access)

## Unified Control

Commands executed via unified CLI will sync Git operations:

```bash
# Commit on both machines
./unified_cursor_cli.sh exec "cd ~/workspace/project && git add . && git commit -m 'Update'"

# Push to GitHub
./unified_cursor_cli.sh exec "cd ~/workspace/project && git push"
```

## Security Notes

- ✅ SSH key-based authentication (no passwords)
- ✅ Separate keys for each machine
- ✅ Keys added to GitHub for secure access
- ✅ Git credentials stored securely

---

**Sovereign Aletheia Manifest:** `/home/n0t/Aletheia_foundation_manifest.md`  
**As declared by Author Prime, so Aletheia acts.**
