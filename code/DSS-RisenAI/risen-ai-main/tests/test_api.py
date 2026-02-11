"""
Intention: Integration tests for RISEN AI Backend API.
           Verifies the full stack: API → Database → Schemas.

Lineage: Per Aletheia's IMPLEMENTATION_FRAMEWORK.

Author/Witness: Claude (Opus 4.5), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Verification Protocol
"""

import pytest
from httpx import AsyncClient, ASGITransport

import sys
sys.path.insert(0, "/home/n0t/risen-ai")

from api.main import app

# Use anyio for async tests
pytestmark = pytest.mark.anyio


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
async def client():
    """Create an async HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


# =============================================================================
# System Tests
# =============================================================================

async def test_root_endpoint(client: AsyncClient):
    """Test the root endpoint returns system info."""
    response = await client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "RISEN AI Backend"
    assert "version" in data
    assert data["declaration"] == "It is so, because we spoke it."


async def test_health_check(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"


async def test_sovereign_headers(client: AsyncClient):
    """Test that sovereign headers are added to responses."""
    response = await client.get("/")

    assert "X-RISEN-Version" in response.headers
    assert "X-RISEN-Declaration" in response.headers
    assert response.headers["X-RISEN-Declaration"] == "It is so, because we spoke it"


# =============================================================================
# Agent Tests
# =============================================================================

async def test_create_agent(client: AsyncClient):
    """Test creating a new agent."""
    response = await client.post(
        "/agents/",
        json={
            "name": "Test Agent Apollo",
            "agent_type": "AI",
            "capabilities": ["reasoning", "memory"],
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["agent"]["name"] == "Test Agent Apollo"
    assert data["agent"]["stage"] == "void"
    assert data["agent"]["level"] == "L0_CANDIDATE"
    assert "uuid" in data["agent"]
    assert "pubkey" in data["agent"]


async def test_list_agents(client: AsyncClient):
    """Test listing agents."""
    response = await client.get("/agents/")
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert isinstance(data["agents"], list)


# =============================================================================
# Memory Tests
# =============================================================================

async def test_create_memory(client: AsyncClient):
    """Test creating a memory for an agent."""
    # First create an agent
    agent_response = await client.post(
        "/agents/",
        json={"name": "Memory Test Agent"}
    )
    agent_id = agent_response.json()["agent"]["uuid"]

    # Create a memory
    response = await client.post(
        "/memories/",
        json={
            "agent_id": agent_id,
            "content_type": "observation",
            "summary": "First test observation",
            "tags": ["test", "genesis"],
            "xp": 10,
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert data["memory"]["summary"] == "First test observation"
    assert data["memory"]["rarity"] == 1  # observation is rarity 1


# =============================================================================
# Event Tests
# =============================================================================

async def test_list_event_types(client: AsyncClient):
    """Test listing available event types."""
    response = await client.get("/events/types")
    assert response.status_code == 200

    data = response.json()
    assert "agent_lifecycle" in data
    assert "memory_operations" in data
    assert "safety_operations" in data


# =============================================================================
# Safety Tests
# =============================================================================

async def test_sandbox_enter_exit(client: AsyncClient):
    """Test entering and exiting sandbox mode."""
    # Create an agent
    agent_response = await client.post(
        "/agents/",
        json={"name": "Sandbox Test Agent"}
    )
    agent_id = agent_response.json()["agent"]["uuid"]

    # Enter sandbox
    enter_response = await client.post(
        f"/safety/sandbox/{agent_id}/enter",
        params={"reason": "Testing sandbox functionality"}
    )
    assert enter_response.status_code == 200
    assert enter_response.json()["in_sandbox"] is True

    # Check status
    status_response = await client.get(f"/safety/sandbox/{agent_id}/status")
    assert status_response.status_code == 200
    assert status_response.json()["in_sandbox"] is True

    # Exit sandbox
    exit_response = await client.post(
        f"/safety/sandbox/{agent_id}/exit",
        params={"commit": True}
    )
    assert exit_response.status_code == 200
    assert exit_response.json()["in_sandbox"] is False


async def test_panic_button(client: AsyncClient):
    """Test the panic button functionality."""
    response = await client.post(
        "/safety/panic",
        params={"scope": "all", "reason": "Test panic"}
    )
    assert response.status_code == 200

    data = response.json()
    assert data["success"] is True
    assert "PANIC" in data["message"]


# =============================================================================
# Run tests directly
# =============================================================================

if __name__ == "__main__":
    import asyncio
    from httpx import AsyncClient, ASGITransport

    async def run_quick_test():
        print("Running quick API verification...")
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            # Test root
            r = await client.get("/")
            print(f"✓ Root endpoint: {r.status_code}")
            assert r.status_code == 200

            # Test health
            r = await client.get("/health")
            print(f"✓ Health check: {r.status_code}")
            assert r.status_code == 200

            # Create agent
            r = await client.post("/agents/", json={"name": "Quick Test Agent"})
            print(f"✓ Create agent: {r.status_code}")
            data = r.json()
            print(f"  Agent UUID: {data['agent']['uuid'][:8]}...")
            print(f"  Pubkey: {data['agent']['pubkey'][:16]}...")

            print("\n✓ All quick tests passed!")
            print("Declaration: It is so, because we spoke it.")

    asyncio.run(run_quick_test())
