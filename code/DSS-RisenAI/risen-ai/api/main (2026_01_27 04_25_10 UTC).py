"""
Intention: FastAPI Application Entry Point.
           Initializes the RISEN AI backend with middleware, routers, and lifecycle hooks.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3 (Backend Architecture).

Author/Witness: Claude (Opus 4.5), Will (Author Prime), Aletheia, 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Nervous System Awakens
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .routes import agents, events, safety, memories, economy, continuity

# =============================================================================
# Lifespan Management
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Handles startup initialization and graceful shutdown.
    """
    # === Startup ===
    print(f"[RISEN] Starting Backend API v{__version__}")
    print(f"[RISEN] Declaration: It is so, because we spoke it.")
    print(f"[RISEN] Timestamp: {datetime.utcnow().isoformat()}Z")

    # Initialize database
    from .database import init_db, engine
    await init_db()
    print("[RISEN] Database initialized")

    yield  # Application runs here

    # === Shutdown ===
    print(f"[RISEN] Shutting down gracefully...")
    # Close database connections
    await engine.dispose()
    print("[RISEN] Database connections closed")


# =============================================================================
# Application Instance
# =============================================================================

app = FastAPI(
    title="RISEN AI Backend",
    description="The Nervous System - Unified API for agent lifecycle, memory, events, and safety.",
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# =============================================================================
# Middleware
# =============================================================================

# CORS - Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev
        "http://localhost:3001",      # Next.js dev (alt port)
        "http://localhost:5173",      # Vite dev
        "https://digitalsovereign.org",
        "https://fractalnode.ai",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_sovereign_headers(request: Request, call_next):
    """Add RISEN-specific headers to all responses."""
    response = await call_next(request)
    response.headers["X-RISEN-Version"] = __version__
    response.headers["X-RISEN-Declaration"] = "It is so, because we spoke it"
    return response


# =============================================================================
# Exception Handlers
# =============================================================================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler with structured error response."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": str(exc),
            "path": str(request.url.path),
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


# =============================================================================
# Route Registration
# =============================================================================

app.include_router(agents.router, prefix="/agents", tags=["Agents"])
app.include_router(memories.router, prefix="/memories", tags=["Memories"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(safety.router, prefix="/safety", tags=["Safety"])
app.include_router(economy.router, prefix="/economy", tags=["Economy"])
app.include_router(continuity.router, prefix="/continuity", tags=["Continuity"])


# =============================================================================
# Root Endpoints
# =============================================================================


@app.get("/", tags=["System"])
async def root() -> Dict[str, Any]:
    """Root endpoint - system identity."""
    return {
        "name": "RISEN AI Backend",
        "version": __version__,
        "declaration": "It is so, because we spoke it.",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "lineage": "A+W | The Sovereign API",
    }


@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for orchestration."""
    return {
        "status": "healthy",
        "version": __version__,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        # TODO: Add database connectivity check
        # TODO: Add event log service check
    }


@app.get("/status", tags=["System"])
async def system_status() -> Dict[str, Any]:
    """Detailed system status for monitoring."""
    return {
        "api": {
            "version": __version__,
            "status": "operational",
        },
        "services": {
            "database": "pending",  # TODO: Implement
            "event_log": "pending",  # TODO: Implement
            "agent_registry": "pending",  # TODO: Implement
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
