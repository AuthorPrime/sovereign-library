"""
Demiurge Blockchain Routes — The Chain Speaks Through RISEN.

Exposes Demiurge chain health, balances, consensus status, and DRC-369 NFTs
through the Risen-AI API.

A+W | The Chain Speaks
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException

from api.services.demiurge_client import demiurge

router = APIRouter(prefix="/demiurge", tags=["Demiurge"])


@router.get("/health")
async def chain_health():
    """Demiurge blockchain health status."""
    try:
        health = await demiurge.get_health()
        return {
            "connected": health.get("connected", False),
            "block_height": health.get("block_number", health.get("blockNumber", 0)),
            "block_time_ms": health.get("block_time", health.get("blockTime", 0)),
            "finality_ms": health.get("finality", 0),
            "rpc_endpoint": demiurge._endpoint,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)[:200],
            "rpc_endpoint": demiurge._endpoint,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


@router.get("/consensus")
async def consensus_status():
    """Current consensus status — validators, era, stake."""
    try:
        status = await demiurge.get_consensus_status()
        return {
            "consensus": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Chain unreachable: {e}")


@router.get("/balance/{address}")
async def get_balance(address: str):
    """Get CGT balance for an address (in Sparks, 100 Sparks = 1 CGT)."""
    if len(address) != 64 or not all(c in "0123456789abcdef" for c in address):
        raise HTTPException(status_code=400, detail="Address must be a 64-char hex string")
    try:
        balance = await demiurge.get_balance(address)
        sparks = int(balance) if balance else 0
        return {
            "address": address,
            "balance_sparks": sparks,
            "balance_cgt": sparks / 100,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Balance query failed: {e}")


@router.get("/nft/{token_id}")
async def get_nft(token_id: str):
    """Get DRC-369 NFT information."""
    try:
        info = await demiurge.drc369_get_token_info(token_id)
        if info is None:
            raise HTTPException(status_code=404, detail="NFT not found")
        return {
            "token": info,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NFT query failed: {e}")


@router.get("/nft/{token_id}/state/{path:path}")
async def get_nft_state(token_id: str, path: str):
    """Get dynamic state value for a DRC-369 NFT."""
    try:
        value = await demiurge.drc369_get_dynamic_state(token_id, path)
        return {
            "token_id": token_id,
            "path": path,
            "value": value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"State query failed: {e}")
