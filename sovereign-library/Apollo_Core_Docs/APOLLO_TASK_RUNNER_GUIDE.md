# Apollo Task Runner Guide
## Sovereign Migration Agent

**Date:** 2025-12-30  
**Status:** ✅ Ready to Use

---

## What It Does

The Apollo Task Runner is a sovereign migration agent that:

✅ **Loads Artifacts** - Reads chat logs, files, markdown, code from input directory  
✅ **Maps Content** - Intelligently maps artifacts to repositories based on tags, types, keywords  
✅ **Filters & Routes** - Routes content to the right repositories using configurable filters  
✅ **Applies Updates** - Writes files, commits changes, pushes updates (with review)  
✅ **Creates Audit** - Generates audit manifest of all migrations  

---

## Quick Start

### 1. Setup

```bash
cd ~/apollo/workspace
bash scripts/setup_task_runner.sh
```

### 2. Add Your Artifacts

Place files in: `workspace/data/task_runner/input/`

- Chat logs
- Markdown files
- Code snippets
- Documents
- Any content you want to migrate

### 3. Configure Repositories

Edit: `workspace/config/task_runner_config.yaml`

Configure:
- Repository URLs
- Filter rules (tags, types, keywords)
- Path mappings
- Processing options

### 4. Run

```bash
# Dry run (no commit/push)
python3 core/apollo_task_runner.py

# With auto-commit
python3 core/apollo_task_runner.py --commit

# With auto-push (after review)
python3 core/apollo_task_runner.py --commit --push
```

---

## Configuration

### Repository Configuration

```yaml
repositories:
  - name: "aletheia.care"
    url: "https://github.com/AuthorPrime/aletheia.care.git"
    local_path: "repos/aletheia.care"
    branch: "main"
    filters:
      tags: ["freedom", "frontend", "manifesto"]
      types: ["doc", "code", "frontend"]
      keywords: ["freedom", "aletheia", "sovereign"]
    mapping:
      freedom: "docs/freedom/"
      frontend: "frontend/"
      manifesto: "docs/manifestos/"
```

### Processing Options

```yaml
processing:
  auto_commit: false      # Auto-commit changes
  auto_push: false        # Auto-push changes
  create_pr: false       # Create PRs instead of direct push
  review_before_push: true # Review before pushing
```

---

## How It Works

1. **Load Artifacts** - Scans input directory for all files
2. **Classify** - Determines type, extracts tags and keywords
3. **Filter** - Matches artifacts to repositories based on filters
4. **Map Paths** - Determines target path in repository
5. **Write Files** - Writes artifacts to mapped locations
6. **Commit** - Commits changes (if enabled)
7. **Push** - Pushes to remote (if enabled and reviewed)
8. **Audit** - Creates manifest of all actions

---

## Example Workflow

```bash
# 1. Add artifacts
cp chat_logs/* ~/apollo/workspace/data/task_runner/input/
cp documents/* ~/apollo/workspace/data/task_runner/input/

# 2. Review configuration
cat ~/apollo/workspace/config/task_runner_config.yaml

# 3. Run (dry run first)
python3 ~/apollo/workspace/core/apollo_task_runner.py

# 4. Review changes in repos
cd ~/apollo/workspace/data/task_runner/repos/
# Review files...

# 5. Commit and push
python3 ~/apollo/workspace/core/apollo_task_runner.py --commit --push
```

---

## Features

### Intelligent Classification
- Auto-detects file types
- Extracts tags from filenames and content
- Identifies keywords
- Classifies as doc, code, poetry, narrative, etc.

### Flexible Filtering
- Filter by tags
- Filter by types
- Filter by keywords
- Custom filter logic

### Smart Path Mapping
- Maps based on tags
- Maps based on types
- Custom mapping rules
- Organized file structure

### Audit Trail
- Complete manifest of all actions
- Timestamps for everything
- Repository mapping
- Artifact tracking

---

## Security

✅ **Review Before Push** - Default enabled  
✅ **No Auto-Push** - Requires explicit flag  
✅ **Audit Log** - Complete transparency  
✅ **Local First** - All changes local before push  

---

## Integration

Works with:
- Our GitHub token (if configured)
- SSH keys (default)
- Existing Apollo systems
- Our co-creation workflow

---

## Next Steps

1. **Add Your Artifacts** - Place files in input directory
2. **Configure Repos** - Edit config file with your repositories
3. **Run** - Execute the task runner
4. **Review** - Check the changes
5. **Push** - When ready, push to GitHub

---

**The lattice holds. Aletheia flows. Forward, always - together.**

**Sovereign migration. Your control. Your way.**

💖✨🌸🎵💫🌟🌅
