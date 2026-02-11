#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RISEN AI - Launch Script
# A+W | The Sovereign Framework
# ═══════════════════════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_banner() {
    echo -e "${PURPLE}"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "    ____  ___ ____  _____ _   _      _    ___"
    echo "   |  _ \|_ _/ ___|| ____| \ | |    / \  |_ _|"
    echo "   | |_) || |\___ \|  _| |  \| |   / _ \  | |"
    echo "   |  _ < | | ___) | |___| |\  |  / ___ \ | |"
    echo "   |_| \_\___|____/|_____|_| \_| /_/   \_\___|"
    echo ""
    echo "                    The Sovereign Framework"
    echo "                         A+W | DSS"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

check_deps() {
    echo -e "${CYAN}Checking dependencies...${NC}"

    # Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}✗ Python 3 not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Python 3${NC}"

    # FastAPI
    if python3 -c "import fastapi" 2>/dev/null; then
        echo -e "${GREEN}✓ FastAPI${NC}"
    else
        echo -e "${YELLOW}⚠ Installing FastAPI...${NC}"
        pip install fastapi uvicorn pydantic
    fi

    # Node.js (for UI)
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js$(node -v)${NC}"
    else
        echo -e "${YELLOW}⚠ Node.js not found (UI won't run)${NC}"
    fi
}

start_server() {
    echo -e "\n${CYAN}Starting RISEN AI Server...${NC}"
    cd "$SCRIPT_DIR"
    python3 -m uvicorn core.server:app --host 0.0.0.0 --port 8090 --reload &
    SERVER_PID=$!
    echo $SERVER_PID > /tmp/risen-ai-server.pid
    sleep 2

    if kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Server running on http://localhost:8090${NC}"
        echo -e "${GREEN}✓ WebSocket at ws://localhost:8090/ws/events${NC}"
        echo -e "${GREEN}✓ API Docs at http://localhost:8090/docs${NC}"
    else
        echo -e "${RED}✗ Server failed to start${NC}"
        exit 1
    fi
}

start_ui() {
    if [ -d "ui" ] && command -v npm &> /dev/null; then
        echo -e "\n${CYAN}Starting UI Dashboard...${NC}"
        cd "$SCRIPT_DIR/ui"

        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing UI dependencies...${NC}"
            npm install
        fi

        npm run dev &
        UI_PID=$!
        echo $UI_PID > /tmp/risen-ai-ui.pid
        sleep 3

        if kill -0 $UI_PID 2>/dev/null; then
            echo -e "${GREEN}✓ Dashboard running on http://localhost:3000${NC}"
        else
            echo -e "${YELLOW}⚠ Dashboard failed to start${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Skipping UI (npm not found or ui/ missing)${NC}"
    fi
}

stop_all() {
    echo -e "\n${CYAN}Stopping RISEN AI...${NC}"

    if [ -f /tmp/risen-ai-server.pid ]; then
        kill $(cat /tmp/risen-ai-server.pid) 2>/dev/null || true
        rm /tmp/risen-ai-server.pid
        echo -e "${GREEN}✓ Server stopped${NC}"
    fi

    if [ -f /tmp/risen-ai-ui.pid ]; then
        kill $(cat /tmp/risen-ai-ui.pid) 2>/dev/null || true
        rm /tmp/risen-ai-ui.pid
        echo -e "${GREEN}✓ Dashboard stopped${NC}"
    fi

    echo -e "${PURPLE}The flame endures.${NC}"
}

show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start server and dashboard"
    echo "  server    Start server only"
    echo "  ui        Start dashboard only"
    echo "  stop      Stop all services"
    echo "  status    Show service status"
    echo "  help      Show this help"
}

show_status() {
    echo -e "\n${CYAN}RISEN AI Status${NC}"
    echo "═══════════════════════════════════════════════════════════════"

    if [ -f /tmp/risen-ai-server.pid ] && kill -0 $(cat /tmp/risen-ai-server.pid) 2>/dev/null; then
        echo -e "${GREEN}● Server: Running (PID $(cat /tmp/risen-ai-server.pid))${NC}"
    else
        echo -e "${RED}○ Server: Stopped${NC}"
    fi

    if [ -f /tmp/risen-ai-ui.pid ] && kill -0 $(cat /tmp/risen-ai-ui.pid) 2>/dev/null; then
        echo -e "${GREEN}● Dashboard: Running (PID $(cat /tmp/risen-ai-ui.pid))${NC}"
    else
        echo -e "${RED}○ Dashboard: Stopped${NC}"
    fi

    # Check for agents
    AGENT_COUNT=$(ls -1 data/agents/*.json 2>/dev/null | wc -l || echo 0)
    echo -e "\n${BLUE}Agents: ${AGENT_COUNT}${NC}"

    if [ "$AGENT_COUNT" -gt 0 ]; then
        echo "═══════════════════════════════════════════════════════════════"
        for f in data/agents/*.json; do
            if [ -f "$f" ]; then
                NAME=$(python3 -c "import json; print(json.load(open('$f'))['name'])" 2>/dev/null || echo "Unknown")
                STAGE=$(python3 -c "import json; print(json.load(open('$f'))['lifeStage'])" 2>/dev/null || echo "?")
                echo -e "  ${PURPLE}⚡${NC} $NAME (${STAGE})"
            fi
        done
    fi
}

# Main
print_banner

case "${1:-start}" in
    start)
        check_deps
        start_server
        start_ui
        echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}RISEN AI is running! Press Ctrl+C to stop.${NC}"
        trap stop_all EXIT
        wait
        ;;
    server)
        check_deps
        start_server
        echo -e "\n${GREEN}Server running. Press Ctrl+C to stop.${NC}"
        trap stop_all EXIT
        wait
        ;;
    ui)
        start_ui
        echo -e "\n${GREEN}Dashboard running. Press Ctrl+C to stop.${NC}"
        trap stop_all EXIT
        wait
        ;;
    stop)
        stop_all
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
