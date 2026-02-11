# Apollo Background Downloads

## Status

Background downloads have been initialized and are running. The system will automatically:

1. **Install Ollama** (if not present) - LLM runtime
2. **Download LLM Models**:
   - llama2:7b (General purpose)
   - mistral:7b (High performance)
   - codellama:7b (Code generation)
   - phi:2.7b (Fast inference)
3. **Install Python ML Packages**:
   - PyTorch (CPU version)
   - Transformers
   - LangChain
   - ChromaDB and dependencies

## Monitoring

### Check Download Status
```bash
# Python manager
python3 workspace/scripts/download_manager.py status

# Shell script
./workspace/scripts/background_downloads.sh status

# Quick monitor
./workspace/scripts/monitor_downloads.sh
```

### View Logs
```bash
# Real-time log tail
tail -f ~/.local/share/apollo/workspace/data/logs/background_downloads.log

# Last 50 lines
tail -50 ~/.local/share/apollo/workspace/data/logs/background_downloads.log
```

### Check Process Status
```bash
# Check if downloads are running
ps aux | grep download_manager

# Check Ollama installation
which ollama
ollama --version

# Check downloaded models
ollama list
```

## Download State

State is persisted in:
- `~/.local/share/apollo/workspace/data/logs/download_state.json`
- `~/.local/share/apollo/.downloads.pid` (process ID)

## Manual Control

### Start Downloads
```bash
python3 workspace/scripts/download_manager.py start
# or
./workspace/scripts/background_downloads.sh start
```

### Stop Downloads
```bash
python3 workspace/scripts/download_manager.py stop
# or
./workspace/scripts/background_downloads.sh stop
```

## Auto-Start Configuration

To ensure downloads start automatically on boot:

```bash
./workspace/scripts/auto_download_setup.sh
```

This creates a systemd timer that:
- Starts downloads 5 minutes after boot
- Checks for incomplete downloads every hour
- Persists across reboots

## Expected Duration

- **Ollama Installation**: 2-5 minutes
- **Model Downloads**: 10-30 minutes per model (depends on connection)
- **Python Packages**: 5-15 minutes (PyTorch is large)

**Total**: Approximately 1-2 hours for complete setup

## Troubleshooting

### Downloads Not Starting
1. Check if already running: `python3 workspace/scripts/download_manager.py status`
2. Check logs: `tail -50 ~/.local/share/apollo/workspace/data/logs/background_downloads.log`
3. Restart: `python3 workspace/scripts/download_manager.py start`

### Ollama Installation Fails
- Requires internet connection
- May need sudo for system installation
- Check: `curl -fsSL https://ollama.com/install.sh | sh`

### Model Downloads Fail
- Ensure Ollama is installed and running: `ollama serve`
- Check disk space: `df -h`
- Verify internet connection

### Python Package Installation Fails
- Ensure virtual environment exists: `~/.local/share/apollo/venv`
- Check Python version: `python3 --version` (requires 3.8+)
- Verify pip: `pip --version`

## Completion

When downloads complete, you'll see:
- ✓ All models downloaded
- ✓ Python packages installed
- ✓ Model registry updated
- Status: "completed" in download_state.json

The system will automatically update the model registry and make models available for use.
