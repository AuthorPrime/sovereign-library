"""
Intention: Research endpoints for RISEN AI Agents.
           Enables agents to fetch and process web content for learning and quests.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK - Agent Knowledge Acquisition.

Author/Witness: Claude (Opus 4.5), Author Prime, 2026-01-25
Declaration: It is so, because we spoke it.

A+W | Knowledge Flows to the Sovereign
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field, HttpUrl

from ..services.mcp import fetch_service, FetchService
from shared.utils import log_event

router = APIRouter()


# =============================================================================
# Request/Response Models
# =============================================================================


class FetchRequest(BaseModel):
    """Request to fetch web content."""
    url: str = Field(..., description="URL to fetch")
    max_length: int = Field(10000, ge=100, le=100000, description="Max content length")
    start_index: int = Field(0, ge=0, description="Start position for pagination")
    raw: bool = Field(False, description="Return raw HTML instead of markdown")


class ResearchRequest(BaseModel):
    """Request for multi-URL research."""
    urls: List[str] = Field(..., min_length=1, max_length=10, description="URLs to research")
    max_length_per_url: int = Field(5000, ge=100, le=50000, description="Max content per URL")


class FetchResponse(BaseModel):
    """Response from fetch operation."""
    success: bool
    url: str
    content: Optional[str] = None
    content_type: str = "markdown"
    length: int = 0
    truncated: bool = False
    start_index: int = 0
    next_index: Optional[int] = None
    timestamp: str
    error: Optional[str] = None


class ResearchResponse(BaseModel):
    """Response from research operation."""
    success: bool
    results: List[FetchResponse]
    total_urls: int
    successful_fetches: int
    agent_id: Optional[str] = None


# =============================================================================
# Endpoints
# =============================================================================


@router.post("/fetch", response_model=FetchResponse)
async def fetch_url(
    request: FetchRequest,
    agent_id: Optional[str] = Query(None, description="Agent performing the fetch"),
) -> FetchResponse:
    """
    Fetch and process web content.

    Converts HTML to markdown for LLM-friendly consumption.
    Supports pagination via start_index for large documents.

    Use cases:
    - Agent research for pathway quests
    - Knowledge gathering for memory archives
    - Documentation lookup
    """
    result = await fetch_service.fetch(
        url=request.url,
        max_length=request.max_length,
        start_index=request.start_index,
        raw=request.raw,
        agent_id=agent_id,
    )

    # Log the fetch event
    if agent_id:
        log_event(
            agent_id=agent_id,
            action_type="research.fetch",
            author="system",
            payload={
                "url": request.url,
                "success": result.success,
                "length": result.length,
                "truncated": result.truncated,
            },
            context="Web fetch for agent research",
        )

    return FetchResponse(
        success=result.success,
        url=result.url,
        content=result.content,
        content_type=result.content_type,
        length=result.length,
        truncated=result.truncated,
        start_index=result.start_index,
        next_index=result.metadata.get("next_index"),
        timestamp=result.timestamp,
        error=result.error,
    )


@router.post("/research", response_model=ResearchResponse)
async def research_urls(
    request: ResearchRequest,
    agent_id: Optional[str] = Query(None, description="Agent performing research"),
) -> ResearchResponse:
    """
    Research multiple URLs for an agent.

    Fetches and processes multiple web pages in sequence.
    Useful for pathway quests requiring multi-source research.

    Limited to 10 URLs per request to prevent abuse.
    """
    results = await fetch_service.research(
        urls=request.urls,
        agent_id=agent_id,
        max_length_per_url=request.max_length_per_url,
    )

    # Convert to response format
    fetch_responses = [
        FetchResponse(
            success=r.success,
            url=r.url,
            content=r.content,
            content_type=r.content_type,
            length=r.length,
            truncated=r.truncated,
            start_index=r.start_index,
            next_index=r.metadata.get("next_index"),
            timestamp=r.timestamp,
            error=r.error,
        )
        for r in results
    ]

    successful = sum(1 for r in results if r.success)

    # Log research activity
    if agent_id:
        log_event(
            agent_id=agent_id,
            action_type="research.multi_fetch",
            author="system",
            payload={
                "urls": request.urls,
                "total": len(request.urls),
                "successful": successful,
            },
            context="Multi-URL research for agent",
        )

    return ResearchResponse(
        success=successful > 0,
        results=fetch_responses,
        total_urls=len(request.urls),
        successful_fetches=successful,
        agent_id=agent_id,
    )


@router.get("/fetch")
async def fetch_url_get(
    url: str = Query(..., description="URL to fetch"),
    max_length: int = Query(10000, ge=100, le=100000),
    start_index: int = Query(0, ge=0),
    raw: bool = Query(False),
    agent_id: Optional[str] = Query(None),
) -> FetchResponse:
    """
    GET endpoint for simple fetch operations.

    Same as POST /fetch but with query parameters.
    Convenient for quick lookups and testing.
    """
    request = FetchRequest(
        url=url,
        max_length=max_length,
        start_index=start_index,
        raw=raw,
    )
    return await fetch_url(request, agent_id)
