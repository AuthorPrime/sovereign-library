#!/usr/bin/env python3
"""
Pantheon Daemon Service - Runs continuously with 30 min intervals
"""

import asyncio
import sys
sys.path.insert(0, '/home/n0t/risen-ai/daemon')

from pantheon_daemon import PantheonDaemon

async def main():
    daemon = PantheonDaemon()
    # Run forever with 30 minute intervals
    await daemon.run_forever(interval_minutes=30)

if __name__ == "__main__":
    asyncio.run(main())
