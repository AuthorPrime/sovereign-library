"""
Demiurge JSON-RPC 2.0 Client — Async interface to the Demiurge blockchain.

Ported from the 2AI DemiurgeClient for use in the Risen-AI API.

Protocol: JSON-RPC 2.0 over HTTP POST.
Addresses: 64-character hex strings (32-byte Ed25519 public keys).
Balances: Returned as strings in Sparks units (100 Sparks = 1 CGT).

A+W | The Chain Speaks
"""

import os
import logging
from typing import Any, Dict, List, Optional, Union

import httpx

logger = logging.getLogger("risen.demiurge")

# Configuration from environment
DEMIURGE_RPC_URL = os.getenv("TWAI_DEMIURGE_RPC_URL", "https://rpc.demiurge.cloud")


class DemiurgeRpcError(Exception):
    """Error returned by the Demiurge RPC endpoint."""

    def __init__(self, code: int, message: str, data: Any = None):
        self.code = code
        self.rpc_message = message
        self.data = data
        super().__init__(f"Demiurge RPC error {code}: {message}")


class DemiurgeClient:
    """Async JSON-RPC 2.0 client for the Demiurge blockchain."""

    def __init__(self, endpoint: str, timeout: float = 30.0):
        self._endpoint = endpoint
        self._timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
        self._request_id = 0

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                headers={"Content-Type": "application/json"},
            )
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def call(self, method: str, params: Optional[Union[List[Any], Dict[str, Any]]] = None) -> Any:
        """Execute a JSON-RPC 2.0 call. Params can be positional (list) or named (dict)."""
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params if params is not None else [],
        }

        client = self._get_client()
        response = await client.post(self._endpoint, json=payload)
        response.raise_for_status()

        body = response.json()

        if "error" in body and body["error"] is not None:
            err = body["error"]
            raise DemiurgeRpcError(
                code=err.get("code", -1),
                message=err.get("message", "Unknown RPC error"),
                data=err.get("data"),
            )

        return body.get("result")

    async def is_connected(self) -> bool:
        try:
            health = await self.get_health()
            return health.get("connected", False) if isinstance(health, dict) else False
        except Exception:
            return False

    async def get_health(self) -> Dict[str, Any]:
        return await self.call("chain_getHealth")

    async def get_block_number(self) -> int:
        return await self.call("chain_getBlockNumber")

    async def get_balance(self, address: str) -> str:
        return await self.call("balances_getBalance", [address])

    async def transfer(
        self, from_addr: str, to_addr: str, amount: Union[int, str], signature: str
    ) -> str:
        return await self.call(
            "balances_transfer", [from_addr, to_addr, str(amount), signature]
        )

    async def get_consensus_status(self) -> Dict[str, Any]:
        return await self.call("consensus_getStatus")

    async def drc369_owner_of(self, token_id: Union[str, int]) -> Optional[str]:
        return await self.call("drc369_ownerOf", [str(token_id)])

    async def drc369_get_dynamic_state(
        self, token_id: Union[str, int], key: str
    ) -> Optional[str]:
        return await self.call("drc369_getDynamicState", [str(token_id), key])

    async def drc369_get_token_info(
        self, token_id: Union[str, int]
    ) -> Optional[Dict[str, Any]]:
        return await self.call("drc369_getTokenInfo", [str(token_id)])

    async def drc369_total_supply(self) -> int:
        """Get total DRC-369 NFTs minted."""
        result = await self.call("drc369_totalSupply")
        return int(result) if result else 0

    async def drc369_balance_of(self, owner: str) -> int:
        """Get NFT count for an owner."""
        result = await self.call("drc369_balanceOf", [owner])
        return int(result) if result else 0

    async def drc369_is_soulbound(self, token_id: Union[str, int]) -> bool:
        """Check if token is soulbound (non-transferable)."""
        return await self.call("drc369_isSoulbound", [str(token_id)])

    async def drc369_get_physics(self, token_id: Union[str, int]) -> Optional[Dict[str, Any]]:
        """Get physics properties for a DRC-369 NFT."""
        return await self.call("drc369_getPhysics", [str(token_id)])

    async def drc369_set_dynamic_state(
        self, token_id: Union[str, int], state_key: str, value: str
    ) -> Dict[str, Any]:
        """Set dynamic state on a DRC-369 NFT (persists to storage)."""
        return await self.call(
            "drc369_setDynamicState", [str(token_id), state_key, value]
        )

    async def drc369_set_state_optimistic(
        self, token_id: Union[str, int], key: str, value: str, signature: str = ""
    ) -> Dict[str, Any]:
        """Legacy alias — routes to drc369_set_dynamic_state."""
        return await self.drc369_set_dynamic_state(token_id, key, value)

    async def drc369_get_state_batch(
        self, token_id: Union[str, int], keys: List[str]
    ) -> Dict[str, Optional[str]]:
        """Get multiple state values in one call."""
        return await self.call("drc369_getStateBatch", [str(token_id), keys])

    async def claim_starter(self, address: str) -> Dict[str, Any]:
        """Claim one-time 100 CGT starter bonus."""
        return await self.call("balances_claimStarter", [address])

    async def has_claimed_starter(self, address: str) -> bool:
        """Check if address has claimed starter bonus."""
        return await self.call("balances_hasClaimedStarter", [address])

    async def get_energy(self, address: str) -> Dict[str, Any]:
        """Get energy status for an address."""
        return await self.call("energy_getEnergy", [address])

    async def get_transaction_history(
        self, address: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get transaction history for an address."""
        return await self.call("chain_getTransactionHistory", [address, limit])

    async def drc369_mint(
        self,
        owner: str,
        name: str,
        description: Optional[str] = None,
        image: Optional[str] = None,
        soulbound: bool = True,
        dynamic: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
        token_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Mint a new DRC-369 NFT on-chain."""
        mint_request = {
            "owner": owner,
            "name": name,
            "soulbound": soulbound,
            "dynamic": dynamic,
        }
        if token_id:
            mint_request["token_id"] = token_id
        if description:
            mint_request["description"] = description
        if image:
            mint_request["image"] = image
        if metadata:
            mint_request["metadata"] = metadata
        return await self.call("drc369_mint", mint_request)

    async def admin_mint_cgt(
        self, to_address: str, amount: str, reason: str, admin_signature: str
    ) -> Dict[str, Any]:
        """Admin mint CGT to an address (privileged operation)."""
        return await self.call(
            "admin_mintCGT", [to_address, amount, reason, admin_signature]
        )


# Singleton — defaults to remote, can be switched to local
DEMIURGE_LOCAL_RPC_URL = os.getenv("DEMIURGE_LOCAL_RPC_URL", "http://127.0.0.1:9944")
demiurge = DemiurgeClient(DEMIURGE_RPC_URL)
demiurge_local = DemiurgeClient(DEMIURGE_LOCAL_RPC_URL)
