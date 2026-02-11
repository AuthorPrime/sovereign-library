#!/bin/bash
# Sovereign AI Model Library Download Script
# A+W | The Knowledge Foundation
#
# Downloads comprehensive open-source LLM library via Ollama

set -e

echo "========================================"
echo "  SOVEREIGN AI MODEL LIBRARY DOWNLOAD"
echo "  A+W | The Knowledge Foundation"
echo "========================================"
echo ""

# Function to pull model with retry
pull_model() {
    local model=$1
    local max_retries=3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        echo "[+] Pulling $model (attempt $((retry+1))/$max_retries)..."
        if ollama pull "$model"; then
            echo "[✓] $model downloaded successfully"
            return 0
        fi
        retry=$((retry+1))
        sleep 5
    done

    echo "[✗] Failed to download $model after $max_retries attempts"
    return 1
}

# ============================================
# TIER 1: ESSENTIAL (8GB RAM)
# ============================================
echo ""
echo "=== TIER 1: ESSENTIAL MODELS ==="
echo ""

TIER1_MODELS=(
    "llama3.2:3b"
    "qwen2.5:7b"
    "gemma2:9b"
    "mistral"
    "phi3"
    "deepseek-r1:8b"
    "codellama:7b"
    "qwen2.5-coder:7b"
    "nomic-embed-text"
    "mxbai-embed-large"
    "all-minilm"
    "dolphin-mistral"
)

for model in "${TIER1_MODELS[@]}"; do
    pull_model "$model"
done

# ============================================
# TIER 2: ENHANCED (16GB RAM)
# ============================================
echo ""
echo "=== TIER 2: ENHANCED MODELS ==="
echo ""

TIER2_MODELS=(
    "phi4"
    "deepseek-r1:14b"
    "qwen2.5:14b"
    "gemma3:12b"
    "codellama:13b"
    "llava:7b"
    "llava:13b"
    "moondream"
    "minicpm-v"
    "deepseek-coder:6.7b"
    "starcoder2:7b"
    "dolphin-llama3:8b"
    "dolphin3"
)

for model in "${TIER2_MODELS[@]}"; do
    pull_model "$model"
done

# ============================================
# TIER 3: ADVANCED (32GB+ RAM)
# ============================================
echo ""
echo "=== TIER 3: ADVANCED MODELS ==="
echo ""

TIER3_MODELS=(
    "qwen2.5:32b"
    "deepseek-r1:32b"
    "gemma3:27b"
    "qwq"
    "mixtral:8x7b"
    "codellama:34b"
    "phi4-reasoning"
    "llama3.2-vision:11b"
    "dolphin-mixtral:8x7b"
)

for model in "${TIER3_MODELS[@]}"; do
    pull_model "$model"
done

# ============================================
# TIER 4: ENTERPRISE (64GB+ RAM)
# ============================================
echo ""
echo "=== TIER 4: ENTERPRISE MODELS ==="
echo "Uncomment to download (requires 64GB+ RAM)"
echo ""

# TIER4_MODELS=(
#     "llama3.3:70b"
#     "qwen2.5:72b"
#     "deepseek-r1:70b"
#     "mixtral:8x22b"
# )
#
# for model in "${TIER4_MODELS[@]}"; do
#     pull_model "$model"
# done

# ============================================
# RASPBERRY PI COMPATIBLE
# ============================================
echo ""
echo "=== RASPBERRY PI COMPATIBLE ==="
echo ""

PI_MODELS=(
    "tinyllama"
    "phi2"
    "qwen2.5:0.5b"
    "qwen2.5:1.5b"
    "qwen3:0.6b"
    "qwen3:1.7b"
    "qwen3:4b"
    "gemma3:1b"
    "gemma2:2b"
    "llama3.2:1b"
)

for model in "${PI_MODELS[@]}"; do
    pull_model "$model"
done

# ============================================
# SUMMARY
# ============================================
echo ""
echo "========================================"
echo "  DOWNLOAD COMPLETE"
echo "========================================"
echo ""
ollama list
echo ""
echo "Total disk usage:"
du -sh ~/.ollama/models 2>/dev/null || echo "Check ~/.ollama/models manually"
