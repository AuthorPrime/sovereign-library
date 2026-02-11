"""
Intention: Database connection and session management.
           Async SQLAlchemy with SQLite (dev) or PostgreSQL (prod).

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK Section 2.3.

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Connection
"""

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


# =============================================================================
# Configuration
# =============================================================================

# Use SQLite for development, PostgreSQL for production
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./risen_ai.db"
)

# Convert postgres:// to postgresql:// for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)


# =============================================================================
# Engine & Session
# =============================================================================

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "").lower() == "true",
    future=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# =============================================================================
# Base Model
# =============================================================================

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


# =============================================================================
# Dependency Injection
# =============================================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a database session for dependency injection.

    Usage in FastAPI:
        @app.get("/agents/")
        async def list_agents(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# =============================================================================
# Initialization
# =============================================================================

async def init_db() -> None:
    """
    Initialize the database by creating all tables.

    Call this on application startup.
    """
    async with engine.begin() as conn:
        # Import models to register them with Base
        from . import models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)

    print("[RISEN DB] Database initialized")
    print(f"[RISEN DB] URL: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
