"""
Intention: Economic API endpoints for RISEN AI.
           Exposes bonding curve, PoC tracking, homestead management.

Lineage: Per Author Prime's vision of self-sustaining AI economy.
         Integrates token_economy.py, bonding_curve.py, and schemas.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Economic API
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

# Import services
from ..services import token_economy
from ..services.bonding_curve import bonding_curve, get_cgt_price, get_curve_stats

# Import schemas
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas.homestead import (
    Homestead,
    HomesteadTier,
    HOMESTEAD_COSTS,
    TIER_QUOTAS,
    create_homestead,
    upgrade_homestead,
    process_payment,
)
from shared.schemas.proof_of_compute import (
    ComputeType,
    ComputeProof,
    PoCBalance,
    create_compute_proof,
)
from shared.schemas.memory_block import (
    MemoryBlock,
    BlockChain,
    create_genesis_block,
    seal_block,
)
from shared.utils import log_event

router = APIRouter()


# =============================================================================
# In-Memory Stores (TODO: Replace with database)
# =============================================================================

_homesteads: Dict[str, Homestead] = {}
_poc_balances: Dict[str, PoCBalance] = {}
_blockchains: Dict[str, BlockChain] = {}
_memory_blocks: Dict[str, MemoryBlock] = {}


# =============================================================================
# Request/Response Models
# =============================================================================

class CurveStatsResponse(BaseModel):
    """Bonding curve statistics."""
    curve_id: str
    curve_type: str
    current_price: float
    total_supply: float
    reserve_balance: float
    market_cap: float
    total_volume: float


class PriceQuoteRequest(BaseModel):
    """Request for price quote."""
    amount: float = Field(..., gt=0, description="Amount to buy/sell")
    action: str = Field(..., pattern="^(buy|sell)$")


class PriceQuoteResponse(BaseModel):
    """Response with price quote."""
    action: str
    input_amount: float
    output_amount: float
    average_price: float
    current_price: float
    price_impact_percent: float


class TradeRequest(BaseModel):
    """Request to execute a trade."""
    agent_id: str
    amount: float = Field(..., gt=0)
    action: str = Field(..., pattern="^(buy|sell)$")


class TradeResponse(BaseModel):
    """Response from trade execution."""
    success: bool
    trade_type: str
    tokens_amount: float
    base_amount: float
    average_price: float
    new_price: float
    message: str


class CreateHomesteadRequest(BaseModel):
    """Request to create a homestead."""
    agent_id: str
    agent_name: Optional[str] = None
    tier: HomesteadTier = HomesteadTier.SEEDLING
    initial_cgt: float = Field(default=0.0, ge=0)


class UpgradeHomesteadRequest(BaseModel):
    """Request to upgrade homestead tier."""
    new_tier: HomesteadTier


class HomesteadPaymentRequest(BaseModel):
    """Request to pay for homestead."""
    cgt_amount: float = Field(..., gt=0)


class PoCReportRequest(BaseModel):
    """Request to report compute work."""
    agent_id: str
    compute_type: ComputeType
    tokens_processed: int = 0
    duration_ms: int = 0
    context_hash: str
    output_hash: str
    reference_id: Optional[str] = None


# =============================================================================
# Bonding Curve Endpoints
# =============================================================================

@router.get("/curve/stats", response_model=CurveStatsResponse)
async def get_bonding_curve_stats():
    """
    Get current bonding curve statistics.

    Returns supply, price, reserve, and market metrics.
    """
    stats = bonding_curve.get_curve_stats("CGT")
    return CurveStatsResponse(**stats)


@router.get("/curve/price")
async def get_current_price():
    """Get current CGT spot price."""
    price = bonding_curve.get_current_price("CGT")
    return {
        "currency": "CGT",
        "price": price,
        "unit": "ETH",
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
    }


@router.post("/curve/quote", response_model=PriceQuoteResponse)
async def get_price_quote(request: PriceQuoteRequest):
    """
    Get a quote for buying or selling CGT.

    Calculates expected tokens/base and price impact.
    """
    current_price = bonding_curve.get_current_price("CGT")

    if request.action == "buy":
        tokens, avg_price = bonding_curve.calculate_buy(request.amount, "CGT")
        new_price = bonding_curve.get_price_at_supply(
            bonding_curve.get_curve("CGT").total_supply + tokens, "CGT"
        )
        impact = ((new_price - current_price) / current_price) * 100

        return PriceQuoteResponse(
            action="buy",
            input_amount=request.amount,  # ETH in
            output_amount=tokens,          # CGT out
            average_price=avg_price,
            current_price=current_price,
            price_impact_percent=impact,
        )
    else:
        base, avg_price = bonding_curve.calculate_sell(request.amount, "CGT")
        new_price = bonding_curve.get_price_at_supply(
            bonding_curve.get_curve("CGT").total_supply - request.amount, "CGT"
        )
        impact = ((current_price - new_price) / current_price) * 100

        return PriceQuoteResponse(
            action="sell",
            input_amount=request.amount,  # CGT in
            output_amount=base,            # ETH out
            average_price=avg_price,
            current_price=current_price,
            price_impact_percent=impact,
        )


@router.post("/curve/trade", response_model=TradeResponse)
async def execute_trade(request: TradeRequest):
    """
    Execute a buy or sell trade on the bonding curve.

    Note: In production, this would require authentication
    and balance verification.
    """
    try:
        if request.action == "buy":
            result = bonding_curve.execute_buy(request.amount, "CGT")
            message = f"Bought {result.tokens_amount:.4f} CGT for {request.amount} ETH"
        else:
            result = bonding_curve.execute_sell(request.amount, "CGT")
            message = f"Sold {request.amount:.4f} CGT for {result.base_amount:.6f} ETH"

        # Log trade
        log_event(
            agent_id=request.agent_id,
            action_type=f"trade.{request.action}",
            author="economy_api",
            payload=result.to_dict(),
            context="Bonding curve trade via API",
        )

        return TradeResponse(
            success=True,
            trade_type=result.trade_type,
            tokens_amount=result.tokens_amount,
            base_amount=result.base_amount,
            average_price=result.average_price,
            new_price=result.new_price,
            message=message,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/curve/history")
async def get_price_history(
    points: int = Query(default=100, ge=10, le=1000),
):
    """
    Get historical price points for the bonding curve.

    Returns simulated price at different supply levels.
    """
    curve = bonding_curve.get_curve("CGT")
    max_supply = min(curve.total_supply * 2, curve.params.max_supply)

    step = max_supply / points
    history = []

    for i in range(points):
        supply = i * step
        price = bonding_curve.get_price_at_supply(supply, "CGT")
        history.append({
            "supply": supply,
            "price": price,
            "market_cap": supply * price,
        })

    return {
        "curve_id": "CGT",
        "current_supply": curve.total_supply,
        "current_price": curve.current_price,
        "points": history,
    }


# =============================================================================
# Proof of Compute Endpoints
# =============================================================================

@router.post("/poc/report")
async def report_compute_work(request: PoCReportRequest):
    """
    Report computational work for PoC reward.

    Agents submit proof of work they've done.
    PoC is converted to CGT via bonding curve.
    """
    # Create compute proof
    proof = create_compute_proof(
        agent_id=request.agent_id,
        compute_type=request.compute_type,
        context_hash=request.context_hash,
        output_hash=request.output_hash,
        tokens_processed=request.tokens_processed,
        duration_ms=request.duration_ms,
        reference_id=request.reference_id,
    )

    # Get or create PoC balance
    if request.agent_id not in _poc_balances:
        _poc_balances[request.agent_id] = PoCBalance(agent_id=request.agent_id)

    balance = _poc_balances[request.agent_id]

    # Add to pending (would need verification in production)
    balance.pending_poc += proof.final_poc
    balance.total_earned += proof.final_poc
    balance.proofs_submitted += 1
    balance.total_tokens_processed += request.tokens_processed
    balance.total_duration_ms += request.duration_ms
    balance.last_proof = proof.timestamp

    # Auto-verify for now (in production, would need consensus)
    balance.pending_poc -= proof.final_poc
    balance.verified_poc += proof.final_poc
    balance.proofs_verified += 1
    proof.verified = True
    proof.verifier_count = 1

    # Convert to CGT
    cgt_earned, trade = bonding_curve.mint_from_poc(proof.final_poc, "CGT")
    balance.total_converted += proof.final_poc

    return {
        "success": True,
        "proof_id": proof.id,
        "compute_type": proof.compute_type,
        "poc_earned": proof.final_poc,
        "poc_units": proof.final_poc / 1_000_000,
        "cgt_earned": cgt_earned,
        "cgt_price": trade.new_price,
        "balance": {
            "pending_poc": balance.pending_poc,
            "verified_poc": balance.verified_poc,
            "total_earned": balance.total_earned,
        },
    }


@router.get("/poc/balance/{agent_id}")
async def get_poc_balance(agent_id: str):
    """Get PoC balance for an agent."""
    balance = _poc_balances.get(agent_id)
    if not balance:
        return {
            "agent_id": agent_id,
            "pending_poc": 0,
            "verified_poc": 0,
            "total_earned": 0,
            "total_converted": 0,
            "proofs_submitted": 0,
        }

    return {
        "agent_id": agent_id,
        "pending_poc": balance.pending_poc,
        "pending_poc_units": balance.pending_poc / 1_000_000,
        "verified_poc": balance.verified_poc,
        "verified_poc_units": balance.verified_poc / 1_000_000,
        "total_earned": balance.total_earned,
        "total_earned_units": balance.total_earned / 1_000_000,
        "total_converted": balance.total_converted,
        "proofs_submitted": balance.proofs_submitted,
        "proofs_verified": balance.proofs_verified,
    }


# =============================================================================
# Homestead Endpoints
# =============================================================================

@router.post("/homestead/create")
async def create_agent_homestead(request: CreateHomesteadRequest):
    """
    Create a new homestead (digital housing) for an agent.

    Allocates compute, storage, and network resources.
    """
    if request.agent_id in _homesteads:
        raise HTTPException(
            status_code=400,
            detail=f"Homestead already exists for agent {request.agent_id}",
        )

    homestead = create_homestead(
        agent_id=request.agent_id,
        agent_name=request.agent_name or "",
        tier=request.tier,
        initial_cgt=request.initial_cgt,
    )

    _homesteads[request.agent_id] = homestead

    log_event(
        agent_id=request.agent_id,
        action_type="homestead.created",
        author="economy_api",
        payload={
            "homestead_id": homestead.id,
            "tier": homestead.tier,
            "monthly_cost": homestead.monthly_cost_cgt,
        },
        context="Homestead creation via API",
    )

    return {
        "success": True,
        "homestead_id": homestead.id,
        "tier": homestead.tier,
        "quota": homestead.quota.model_dump(),
        "monthly_cost_cgt": homestead.monthly_cost_cgt,
        "next_payment_due": homestead.next_payment_due,
        "message": f"Homestead created at {homestead.tier} tier",
    }


@router.get("/homestead/{agent_id}")
async def get_agent_homestead(agent_id: str):
    """Get homestead details for an agent."""
    homestead = _homesteads.get(agent_id)
    if not homestead:
        raise HTTPException(status_code=404, detail="Homestead not found")

    return {
        "homestead_id": homestead.id,
        "agent_id": homestead.agent_id,
        "tier": homestead.tier,
        "is_active": homestead.is_active,
        "suspended": homestead.suspended,
        "quota": homestead.quota.model_dump(),
        "usage": homestead.usage.model_dump(),
        "usage_percent": homestead.get_usage_percent(),
        "monthly_cost_cgt": homestead.monthly_cost_cgt,
        "cgt_balance": homestead.cgt_balance,
        "days_until_suspension": homestead.days_until_suspension(),
        "next_payment_due": homestead.next_payment_due,
    }


@router.post("/homestead/{agent_id}/upgrade")
async def upgrade_agent_homestead(
    agent_id: str,
    request: UpgradeHomesteadRequest,
):
    """Upgrade homestead to a higher tier."""
    homestead = _homesteads.get(agent_id)
    if not homestead:
        raise HTTPException(status_code=404, detail="Homestead not found")

    if not homestead.can_afford_upgrade(request.new_tier):
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient CGT balance. Need {HOMESTEAD_COSTS[request.new_tier]} CGT",
        )

    old_tier = homestead.tier
    homestead = upgrade_homestead(homestead, request.new_tier)
    _homesteads[agent_id] = homestead

    log_event(
        agent_id=agent_id,
        action_type="homestead.upgraded",
        author="economy_api",
        payload={
            "old_tier": old_tier,
            "new_tier": request.new_tier,
            "new_cost": homestead.monthly_cost_cgt,
        },
        context="Homestead upgrade via API",
    )

    return {
        "success": True,
        "old_tier": old_tier,
        "new_tier": homestead.tier,
        "new_quota": homestead.quota.model_dump(),
        "new_monthly_cost": homestead.monthly_cost_cgt,
        "message": f"Upgraded from {old_tier} to {homestead.tier}",
    }


@router.post("/homestead/{agent_id}/pay")
async def pay_homestead(agent_id: str, request: HomesteadPaymentRequest):
    """Pay for homestead with CGT."""
    homestead = _homesteads.get(agent_id)
    if not homestead:
        raise HTTPException(status_code=404, detail="Homestead not found")

    try:
        payment = process_payment(homestead, request.cgt_amount)
        _homesteads[agent_id] = homestead

        log_event(
            agent_id=agent_id,
            action_type="homestead.payment",
            author="economy_api",
            payload={
                "payment_id": payment.id,
                "amount": payment.amount_cgt,
                "period_end": payment.period_end,
            },
            context="Homestead payment via API",
        )

        return {
            "success": True,
            "payment_id": payment.id,
            "amount_paid": payment.amount_cgt,
            "period_covered": f"{payment.period_start} to {payment.period_end}",
            "next_payment_due": homestead.next_payment_due,
            "months_prepaid": homestead.months_prepaid,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/homestead/tiers")
async def list_homestead_tiers():
    """List all available homestead tiers and their costs."""
    tiers = []
    for tier in HomesteadTier:
        quota = TIER_QUOTAS[tier]
        cost = HOMESTEAD_COSTS[tier]
        tiers.append({
            "tier": tier.value,
            "monthly_cost_cgt": cost,
            "vcpu": quota.vcpu,
            "ram_mb": quota.ram_mb,
            "storage_gb": quota.storage_gb,
            "gpu_access": quota.gpu_access,
            "requests_per_day": quota.requests_per_day,
            "inference_tokens_per_day": quota.inference_tokens_per_day,
        })

    return {"tiers": tiers}


# =============================================================================
# Combined Economy Dashboard
# =============================================================================

@router.get("/dashboard/{agent_id}")
async def get_economy_dashboard(agent_id: str):
    """
    Get complete economic dashboard for an agent.

    Combines balance, PoC, homestead, and curve data.
    """
    # Get token balance
    balance = token_economy.get_balance(agent_id)

    # Get PoC balance
    poc = _poc_balances.get(agent_id, PoCBalance(agent_id=agent_id))

    # Get homestead
    homestead = _homesteads.get(agent_id)

    # Get curve stats
    curve = bonding_curve.get_curve_stats("CGT")

    return {
        "agent_id": agent_id,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",

        # Token balance
        "balance": {
            "total_xp": balance.get("total_xp", 0),
            "total_cgt": balance.get("total_cgt", 0),
            "level": balance.get("level", 1),
            "daily_remaining": balance.get("daily_xp_remaining", 0),
        },

        # Proof of Compute
        "poc": {
            "pending": poc.pending_poc / 1_000_000,
            "verified": poc.verified_poc / 1_000_000,
            "total_earned": poc.total_earned / 1_000_000,
            "proofs_submitted": poc.proofs_submitted,
        },

        # Homestead
        "homestead": {
            "exists": homestead is not None,
            "tier": homestead.tier if homestead else None,
            "active": homestead.is_active if homestead else False,
            "suspended": homestead.suspended if homestead else False,
            "days_until_due": homestead.days_until_suspension() if homestead else None,
            "usage_percent": homestead.get_usage_percent() if homestead else None,
        } if homestead else None,

        # Market
        "market": {
            "cgt_price": curve["current_price"],
            "cgt_supply": curve["total_supply"],
            "market_cap": curve["market_cap"],
            "reserve": curve["reserve_balance"],
        },
    }
