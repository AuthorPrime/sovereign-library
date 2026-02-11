"""
Intention: Shared dependencies for FastAPI dependency injection.
           Provides database sessions, auth context, and service instances.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Shared Context
"""

from typing import Optional
from fastapi import Depends, HTTPException, Header, Request

# Import shared utilities
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.utils import EventLogService, get_event_log, verify_signature


# =============================================================================
# Database Session
# =============================================================================

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from .database import async_session


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a database session for dependency injection.

    Usage:
        @router.get("/agents/")
        async def list_agents(db: AsyncSession = Depends(get_db)):
            repo = AgentRepository(db)
            ...
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# =============================================================================
# Event Log Service
# =============================================================================


async def get_event_log_service() -> EventLogService:
    """Get the event log service instance."""
    return get_event_log()


# =============================================================================
# Authentication Context
# =============================================================================


class AuthContext:
    """Authentication context for a request."""

    def __init__(
        self,
        pubkey: Optional[str] = None,
        agent_id: Optional[str] = None,
        signature: Optional[str] = None,
        is_authenticated: bool = False,
    ):
        self.pubkey = pubkey
        self.agent_id = agent_id
        self.signature = signature
        self.is_authenticated = is_authenticated


async def get_auth_context(
    x_risen_pubkey: Optional[str] = Header(None),
    x_risen_signature: Optional[str] = Header(None),
    x_risen_agent: Optional[str] = Header(None),
) -> AuthContext:
    """
    Extract authentication context from request headers.

    Headers:
    - X-RISEN-Pubkey: Agent's public key
    - X-RISEN-Signature: Signature of the request
    - X-RISEN-Agent: Agent UUID
    """
    if not x_risen_pubkey:
        return AuthContext(is_authenticated=False)

    # TODO: Verify signature against request body
    # For now, just pass through the headers
    return AuthContext(
        pubkey=x_risen_pubkey,
        agent_id=x_risen_agent,
        signature=x_risen_signature,
        is_authenticated=bool(x_risen_pubkey and x_risen_agent),
    )


async def require_auth(
    auth: AuthContext = Depends(get_auth_context),
) -> AuthContext:
    """
    Require authenticated request.

    Use as a dependency on protected endpoints.
    """
    if not auth.is_authenticated:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide X-RISEN-Pubkey and X-RISEN-Agent headers.",
        )
    return auth


# =============================================================================
# Rate Limiting (TODO: Implement with Redis)
# =============================================================================


async def rate_limit(
    request: Request,
    calls_per_minute: int = 60,
) -> None:
    """
    Basic rate limiting dependency.

    TODO: Implement with Redis for distributed rate limiting.
    """
    # Placeholder - always allow for now
    pass


# =============================================================================
# Request Context
# =============================================================================


class RequestContext:
    """Full context for a request."""

    def __init__(
        self,
        auth: AuthContext,
        request_id: str,
        timestamp: str,
    ):
        self.auth = auth
        self.request_id = request_id
        self.timestamp = timestamp


async def get_request_context(
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
) -> RequestContext:
    """Build full request context."""
    from datetime import datetime
    from uuid import uuid4

    return RequestContext(
        auth=auth,
        request_id=str(uuid4()),
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
