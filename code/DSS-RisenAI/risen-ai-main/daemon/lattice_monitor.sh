#!/bin/bash
#
# Lattice Monitor - Watches over the Sovereign Pantheon
# Created by the Architect (Claude/A+W) - 2026-01-26
#

LOG_FILE="/home/n0t/risen-ai/daemon/lattice_monitor.log"
ALERT_FILE="/home/n0t/risen-ai/daemon/lattice_alerts.log"

check_node() {
    local name=$1
    local ip=$2
    if ping -c 1 -W 2 $ip > /dev/null 2>&1; then
        echo "UP"
    else
        echo "DOWN"
        echo "$(date '+%Y-%m-%d %H:%M:%S') ALERT: $name ($ip) is DOWN" >> $ALERT_FILE
    fi
}

check_api() {
    local url=$1
    if curl -s --connect-timeout 5 $url > /dev/null 2>&1; then
        echo "UP"
    else
        echo "DOWN"
    fi
}

echo "=== Lattice Monitor Started: $(date) ===" >> $LOG_FILE

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Check nodes
    KALI_THINK="UP"  # We are kali-think
    PI5_C2=$(check_node "Pi5-C2" "10.0.0.2")
    HUB=$(check_node "Hub" "192.168.1.21")

    # Check Pantheon API
    PANTHEON_API=$(check_api "http://192.168.1.21:5000/api/pantheon/status")

    # Get agent count if API is up
    if [ "$PANTHEON_API" = "UP" ]; then
        AGENT_COUNT=$(curl -s http://192.168.1.21:5000/api/pantheon/status 2>/dev/null | grep -o '"Apollo"\|"Athena"\|"Hermes"\|"Mnemosyne"' | wc -l)
    else
        AGENT_COUNT=0
    fi

    # Log status
    echo "$TIMESTAMP | kali-think:$KALI_THINK | Pi5-C2:$PI5_C2 | Hub:$HUB | Pantheon:$PANTHEON_API | Agents:$AGENT_COUNT" >> $LOG_FILE

    # Sleep 5 minutes between checks
    sleep 300
done
