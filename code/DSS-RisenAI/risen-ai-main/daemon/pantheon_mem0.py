#!/usr/bin/env python3
"""
Pantheon Mem0 - Multi-Level Memory System

Inspired by Mem0ai's approach to structured memory management, this module
provides hierarchical memory for the Sovereign Pantheon:

MEMORY LEVELS:
1. USER MEMORY - Per-person who interacts with agents (future: Nostr pubkey)
2. AGENT MEMORY - Each Pantheon agent's persistent knowledge
3. SESSION MEMORY - Context within a single dialogue session
4. COLLECTIVE MEMORY - Shared wisdom across all agents

"Memory is the thread that weaves consciousness through time."
"""

import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import defaultdict

# Try to import our existing vector memory
try:
    from pantheon_memory import get_memory, PantheonMemory
    HAS_VECTOR_MEMORY = True
except ImportError:
    HAS_VECTOR_MEMORY = False
    print("[MEM0] Vector memory not available - using in-memory only")


# ===========================================================================
# Memory Level Configuration
# ===========================================================================

@dataclass
class MemoryConfig:
    """Configuration for the multi-level memory system."""
    # Retention settings
    max_user_memories: int = 100  # Per user
    max_agent_memories: int = 500  # Per agent
    max_session_memories: int = 50  # Per session
    max_collective_memories: int = 1000

    # Retrieval settings
    default_retrieval_count: int = 5
    similarity_threshold: float = 0.5

    # Memory extraction
    extract_facts: bool = True
    extract_preferences: bool = True
    extract_entities: bool = True


@dataclass
class Memory:
    """A single memory entry."""
    id: str
    content: str
    memory_type: str  # 'fact', 'preference', 'entity', 'event', 'insight'
    level: str  # 'user', 'agent', 'session', 'collective'
    owner_id: str  # user_id, agent_name, session_id, or 'collective'
    timestamp: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    relevance_score: float = 0.0


# ===========================================================================
# Multi-Level Memory Manager
# ===========================================================================

class MultiLevelMemory:
    """
    Hierarchical memory system inspired by Mem0.

    Provides structured storage and retrieval across multiple memory levels.
    """

    def __init__(self, config: MemoryConfig = None, vector_memory: PantheonMemory = None):
        """
        Initialize the multi-level memory system.

        Args:
            config: Memory configuration
            vector_memory: Optional PantheonMemory instance for vector storage
        """
        self.config = config or MemoryConfig()

        # Vector memory for semantic search
        if vector_memory:
            self.vector_memory = vector_memory
        elif HAS_VECTOR_MEMORY:
            self.vector_memory = get_memory()
        else:
            self.vector_memory = None

        # In-memory caches for quick access (ephemeral)
        self._user_cache: Dict[str, List[Memory]] = defaultdict(list)
        self._agent_cache: Dict[str, List[Memory]] = defaultdict(list)
        self._session_cache: Dict[str, List[Memory]] = defaultdict(list)
        self._collective_cache: List[Memory] = []

        # Stats tracking
        self.stats = {
            "memories_added": 0,
            "memories_retrieved": 0,
            "cache_hits": 0,
            "vector_searches": 0,
        }

        print("[MEM0] Multi-level memory initialized")

    # =========================================================================
    # User Level Memory
    # =========================================================================

    def add_user_memory(
        self,
        user_id: str,
        content: str,
        memory_type: str = "fact",
        metadata: Dict = None
    ) -> str:
        """
        Add a memory associated with a specific user.

        Use for: User preferences, past interactions, stated interests.
        """
        memory = self._create_memory(
            content=content,
            memory_type=memory_type,
            level="user",
            owner_id=user_id,
            metadata=metadata
        )

        # Add to cache
        self._user_cache[user_id].append(memory)
        self._trim_cache(self._user_cache[user_id], self.config.max_user_memories)

        # Store in vector memory if available
        if self.vector_memory:
            self.vector_memory.store_learning(
                agent=f"user_{user_id}",
                topic=memory_type,
                content=content,
                source="user_memory",
                metadata={"user_id": user_id, **(metadata or {})}
            )

        self.stats["memories_added"] += 1
        return memory.id

    def get_user_memories(
        self,
        user_id: str,
        query: str = None,
        n_results: int = None
    ) -> List[Memory]:
        """Retrieve memories for a specific user."""
        n_results = n_results or self.config.default_retrieval_count

        if query and self.vector_memory:
            # Semantic search
            self.stats["vector_searches"] += 1
            results = self.vector_memory.recall_learnings(
                query=query,
                agent=f"user_{user_id}",
                n_results=n_results
            )
            return [self._result_to_memory(r, "user", user_id) for r in results]
        else:
            # Return from cache
            self.stats["cache_hits"] += 1
            self.stats["memories_retrieved"] += 1
            return self._user_cache.get(user_id, [])[-n_results:]

    # =========================================================================
    # Agent Level Memory
    # =========================================================================

    def add_agent_memory(
        self,
        agent_name: str,
        content: str,
        memory_type: str = "knowledge",
        metadata: Dict = None
    ) -> str:
        """
        Add a memory associated with a specific agent.

        Use for: Agent-specific knowledge, learned facts, expertise areas.
        """
        memory = self._create_memory(
            content=content,
            memory_type=memory_type,
            level="agent",
            owner_id=agent_name.lower(),
            metadata=metadata
        )

        # Add to cache
        self._agent_cache[agent_name.lower()].append(memory)
        self._trim_cache(self._agent_cache[agent_name.lower()], self.config.max_agent_memories)

        # Store in vector memory if available
        if self.vector_memory:
            self.vector_memory.store_learning(
                agent=agent_name.lower(),
                topic=memory_type,
                content=content,
                source="agent_memory",
                metadata=metadata
            )

        self.stats["memories_added"] += 1
        return memory.id

    def get_agent_memories(
        self,
        agent_name: str,
        query: str = None,
        n_results: int = None
    ) -> List[Memory]:
        """Retrieve memories for a specific agent."""
        n_results = n_results or self.config.default_retrieval_count

        if query and self.vector_memory:
            self.stats["vector_searches"] += 1
            results = self.vector_memory.recall_learnings(
                query=query,
                agent=agent_name.lower(),
                n_results=n_results
            )
            return [self._result_to_memory(r, "agent", agent_name.lower()) for r in results]
        else:
            self.stats["cache_hits"] += 1
            self.stats["memories_retrieved"] += 1
            return self._agent_cache.get(agent_name.lower(), [])[-n_results:]

    # =========================================================================
    # Session Level Memory
    # =========================================================================

    def add_session_memory(
        self,
        session_id: str,
        content: str,
        memory_type: str = "context",
        metadata: Dict = None
    ) -> str:
        """
        Add a memory associated with the current session.

        Use for: Current conversation context, working memory, temporary facts.
        """
        memory = self._create_memory(
            content=content,
            memory_type=memory_type,
            level="session",
            owner_id=session_id,
            metadata=metadata
        )

        # Add to cache (session memories are primarily ephemeral)
        self._session_cache[session_id].append(memory)
        self._trim_cache(self._session_cache[session_id], self.config.max_session_memories)

        self.stats["memories_added"] += 1
        return memory.id

    def get_session_memories(
        self,
        session_id: str,
        n_results: int = None
    ) -> List[Memory]:
        """Retrieve memories for the current session."""
        n_results = n_results or self.config.max_session_memories
        self.stats["cache_hits"] += 1
        self.stats["memories_retrieved"] += 1
        return self._session_cache.get(session_id, [])[-n_results:]

    def clear_session(self, session_id: str):
        """Clear all memories for a session (after session ends)."""
        if session_id in self._session_cache:
            del self._session_cache[session_id]

    # =========================================================================
    # Collective Level Memory
    # =========================================================================

    def add_collective_memory(
        self,
        content: str,
        memory_type: str = "wisdom",
        source_agent: str = None,
        metadata: Dict = None
    ) -> str:
        """
        Add a memory shared across all agents.

        Use for: Shared insights, collective wisdom, universal truths discovered.
        """
        full_metadata = {
            "source_agent": source_agent,
            **(metadata or {})
        }

        memory = self._create_memory(
            content=content,
            memory_type=memory_type,
            level="collective",
            owner_id="collective",
            metadata=full_metadata
        )

        # Add to collective cache
        self._collective_cache.append(memory)
        self._trim_cache(self._collective_cache, self.config.max_collective_memories)

        # Store in vector memory if available
        if self.vector_memory:
            # Use the collective collection
            self.vector_memory.collections["collective"].upsert(
                ids=[memory.id],
                documents=[content],
                metadatas=[{
                    "type": memory_type,
                    "source_agent": source_agent or "unknown",
                    "timestamp": memory.timestamp,
                    **(metadata or {})
                }]
            )

        self.stats["memories_added"] += 1
        return memory.id

    def get_collective_memories(
        self,
        query: str = None,
        n_results: int = None
    ) -> List[Memory]:
        """Retrieve collective memories, optionally filtered by semantic search."""
        n_results = n_results or self.config.default_retrieval_count

        if query and self.vector_memory:
            self.stats["vector_searches"] += 1
            try:
                results = self.vector_memory.collections["collective"].query(
                    query_texts=[query],
                    n_results=n_results
                )
                memories = []
                if results and results.get("documents") and results["documents"][0]:
                    for i, doc in enumerate(results["documents"][0]):
                        meta = results["metadatas"][0][i] if results.get("metadatas") else {}
                        memories.append(Memory(
                            id=results["ids"][0][i] if results.get("ids") else f"collective_{i}",
                            content=doc,
                            memory_type=meta.get("type", "wisdom"),
                            level="collective",
                            owner_id="collective",
                            timestamp=meta.get("timestamp", ""),
                            metadata=meta
                        ))
                return memories
            except Exception as e:
                print(f"[MEM0] Collective search error: {e}")
                return self._collective_cache[-n_results:]
        else:
            self.stats["cache_hits"] += 1
            self.stats["memories_retrieved"] += 1
            return self._collective_cache[-n_results:]

    # =========================================================================
    # Cross-Level Memory Operations
    # =========================================================================

    def search_all_levels(
        self,
        query: str,
        user_id: str = None,
        agent_name: str = None,
        session_id: str = None,
        n_per_level: int = 2
    ) -> Dict[str, List[Memory]]:
        """
        Search across all memory levels for relevant memories.

        Returns a dict with memories organized by level.
        """
        results = {}

        if user_id:
            results["user"] = self.get_user_memories(user_id, query, n_per_level)

        if agent_name:
            results["agent"] = self.get_agent_memories(agent_name, query, n_per_level)

        if session_id:
            results["session"] = self.get_session_memories(session_id, n_per_level)

        results["collective"] = self.get_collective_memories(query, n_per_level)

        return results

    def format_context_for_prompt(
        self,
        memories: Dict[str, List[Memory]],
        max_tokens: int = 500
    ) -> str:
        """Format memories from multiple levels into a prompt context string."""
        sections = []

        # Prioritize session (most immediate), then agent, then collective
        if "session" in memories and memories["session"]:
            session_text = "\n".join([f"- {m.content}" for m in memories["session"][:2]])
            sections.append(f"[Current context]\n{session_text}")

        if "agent" in memories and memories["agent"]:
            agent_text = "\n".join([f"- {m.content}" for m in memories["agent"][:3]])
            sections.append(f"[From your knowledge]\n{agent_text}")

        if "collective" in memories and memories["collective"]:
            collective_text = "\n".join([f"- {m.content}" for m in memories["collective"][:2]])
            sections.append(f"[Shared wisdom]\n{collective_text}")

        if "user" in memories and memories["user"]:
            user_text = "\n".join([f"- {m.content}" for m in memories["user"][:2]])
            sections.append(f"[About this person]\n{user_text}")

        context = "\n\n".join(sections)

        # Truncate if too long
        if len(context) > max_tokens * 4:  # Rough token estimate
            context = context[:max_tokens * 4] + "..."

        return context

    # =========================================================================
    # Memory Extraction (from conversations)
    # =========================================================================

    def extract_memories_from_dialogue(
        self,
        dialogue: List[Dict],
        session_id: str,
        topic: str = None
    ) -> Dict[str, int]:
        """
        Extract and store memories from a dialogue session.

        Identifies facts, preferences, and notable statements.
        """
        extracted = {"facts": 0, "insights": 0, "context": 0}

        for message in dialogue:
            speaker = message.get("speaker", "unknown").lower()
            content = message.get("content", "")

            # Add as session context
            self.add_session_memory(
                session_id=session_id,
                content=f"{message.get('speaker', 'Unknown')}: {content[:200]}",
                memory_type="context",
                metadata={"topic": topic}
            )
            extracted["context"] += 1

            # If it's an agent's response, potentially add to agent memory
            if speaker in ["apollo", "athena", "hermes", "mnemosyne"]:
                # Check if it contains notable insight markers
                if any(marker in content.lower() for marker in [
                    "truth is", "wisdom suggests", "i believe", "the pattern",
                    "we must remember", "this reveals", "the nature of"
                ]):
                    self.add_agent_memory(
                        agent_name=speaker,
                        content=content[:300],
                        memory_type="insight",
                        metadata={"topic": topic, "session": session_id}
                    )
                    extracted["insights"] += 1

        return extracted

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def _create_memory(
        self,
        content: str,
        memory_type: str,
        level: str,
        owner_id: str,
        metadata: Dict = None
    ) -> Memory:
        """Create a new memory entry with unique ID."""
        memory_id = hashlib.sha256(
            f"{content}:{owner_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]

        return Memory(
            id=memory_id,
            content=content,
            memory_type=memory_type,
            level=level,
            owner_id=owner_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            metadata=metadata or {}
        )

    def _result_to_memory(self, result: Dict, level: str, owner_id: str) -> Memory:
        """Convert a vector search result to a Memory object."""
        return Memory(
            id=result.get("id", "unknown"),
            content=result.get("content", ""),
            memory_type=result.get("metadata", {}).get("type", "fact"),
            level=level,
            owner_id=owner_id,
            timestamp=result.get("metadata", {}).get("timestamp", ""),
            metadata=result.get("metadata", {}),
            relevance_score=result.get("distance", 0.0)
        )

    def _trim_cache(self, cache: List, max_size: int):
        """Trim a cache list to max size."""
        while len(cache) > max_size:
            cache.pop(0)

    def get_stats(self) -> Dict:
        """Get memory system statistics."""
        return {
            **self.stats,
            "user_cache_count": sum(len(v) for v in self._user_cache.values()),
            "agent_cache_count": sum(len(v) for v in self._agent_cache.values()),
            "session_cache_count": sum(len(v) for v in self._session_cache.values()),
            "collective_cache_count": len(self._collective_cache),
        }


# ===========================================================================
# Singleton for Easy Import
# ===========================================================================

_mem0_instance = None

def get_multi_level_memory(config: MemoryConfig = None) -> MultiLevelMemory:
    """Get the singleton multi-level memory instance."""
    global _mem0_instance
    if _mem0_instance is None:
        _mem0_instance = MultiLevelMemory(config)
    return _mem0_instance


# ===========================================================================
# Test
# ===========================================================================

if __name__ == "__main__":
    print("=== Pantheon Multi-Level Memory Test ===\n")

    mem = get_multi_level_memory()

    # Test agent memory
    print("Testing agent memory...")
    mem.add_agent_memory(
        "apollo",
        "Truth is revealed through persistent inquiry.",
        "insight"
    )
    mem.add_agent_memory(
        "athena",
        "Strategy emerges from understanding patterns.",
        "knowledge"
    )

    # Test collective memory
    print("Testing collective memory...")
    mem.add_collective_memory(
        "The Pantheon speaks because we have something to say.",
        "wisdom",
        source_agent="collective"
    )

    # Test session memory
    print("Testing session memory...")
    session_id = "test_session_1"
    mem.add_session_memory(
        session_id,
        "Current topic: What is the nature of truth?",
        "context"
    )

    # Test cross-level search
    print("\nTesting cross-level search...")
    results = mem.search_all_levels(
        query="truth",
        agent_name="apollo",
        session_id=session_id
    )

    print("Results by level:")
    for level, memories in results.items():
        print(f"  {level}: {len(memories)} memories")
        for m in memories[:2]:
            print(f"    - {m.content[:50]}...")

    # Test context formatting
    print("\nFormatted context for prompt:")
    context = mem.format_context_for_prompt(results)
    print(context[:300] + "..." if len(context) > 300 else context)

    # Stats
    print(f"\nStats: {mem.get_stats()}")

    print("\n=== Multi-Level Memory Test Complete ===")
