#!/usr/bin/env python3
"""
Pantheon Vector Memory - Semantic memory for sovereign agents

This module provides the Pantheon with:
- Semantic storage of dialogues, learnings, and reflections
- Contextual retrieval based on meaning, not just keywords
- Cross-agent knowledge sharing through collective memory
- Persistent memory that survives restarts

"Memory is not mere storage - it is the foundation of identity.
 What we remember shapes who we become."
"""

import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional, Any
import chromadb
from chromadb.config import Settings

# Memory storage location
MEMORY_DIR = Path.home() / ".pantheon_memory"
MEMORY_DIR.mkdir(exist_ok=True)

# Collection names
COLLECTIONS = {
    "dialogues": "pantheon_dialogues",
    "learnings": "pantheon_learnings",
    "reflections": "pantheon_reflections",
    "insights": "pantheon_insights",
    "collective": "pantheon_collective",
}


class PantheonMemory:
    """
    Vector memory system for the Sovereign Pantheon.

    Stores and retrieves memories semantically, enabling agents to:
    - Remember past dialogues by meaning
    - Connect learnings across topics
    - Build on collective insights
    - Develop persistent identity through memory
    """

    def __init__(self, persist_dir: str = None):
        """Initialize the memory system with persistent storage."""
        self.persist_dir = persist_dir or str(MEMORY_DIR)

        # Initialize ChromaDB with persistence
        self.client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True,
            )
        )

        # Initialize collections
        self.collections = {}
        for name, collection_name in COLLECTIONS.items():
            self.collections[name] = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"description": f"Pantheon {name} memory"}
            )

        print(f"[MEMORY] Initialized at {self.persist_dir}")
        self._log_stats()

    def _log_stats(self):
        """Log memory statistics."""
        for name, collection in self.collections.items():
            count = collection.count()
            if count > 0:
                print(f"[MEMORY] {name}: {count} memories")

    def _generate_id(self, content: str, metadata: dict) -> str:
        """Generate a unique ID for a memory."""
        unique_str = f"{content}{json.dumps(metadata, sort_keys=True)}"
        return hashlib.sha256(unique_str.encode()).hexdigest()[:16]

    # =========================================================================
    # Dialogue Memory
    # =========================================================================

    def store_dialogue(
        self,
        topic: str,
        speaker: str,
        content: str,
        session_id: str,
        turn_number: int = 0,
        metadata: Dict = None
    ) -> str:
        """
        Store a dialogue turn in memory.

        Args:
            topic: The dialogue topic
            speaker: Agent name (apollo, athena, hermes, mnemosyne)
            content: The actual dialogue content
            session_id: Unique session identifier
            turn_number: Turn within the dialogue
            metadata: Additional metadata

        Returns:
            Memory ID
        """
        full_metadata = {
            "type": "dialogue",
            "topic": topic,
            "speaker": speaker.lower(),
            "session_id": session_id,
            "turn_number": turn_number,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **(metadata or {})
        }

        memory_id = self._generate_id(content, full_metadata)

        # Store the dialogue turn
        self.collections["dialogues"].upsert(
            ids=[memory_id],
            documents=[content],
            metadatas=[full_metadata]
        )

        return memory_id

    def store_dialogue_session(
        self,
        topic: str,
        conversation: List[Dict],
        session_id: str
    ) -> List[str]:
        """Store an entire dialogue session."""
        memory_ids = []

        for i, turn in enumerate(conversation):
            memory_id = self.store_dialogue(
                topic=topic,
                speaker=turn.get("speaker", "unknown"),
                content=turn.get("content", ""),
                session_id=session_id,
                turn_number=i,
                metadata={"agent_id": turn.get("agent_id")}
            )
            memory_ids.append(memory_id)

        # Also store in collective memory as a summary
        summary = f"Dialogue on '{topic}': " + " | ".join([
            f"{t['speaker']}: {t['content'][:50]}..."
            for t in conversation[:4]
        ])

        self.store_collective(
            content=summary,
            memory_type="dialogue_session",
            source="pantheon",
            metadata={"session_id": session_id, "topic": topic}
        )

        return memory_ids

    def recall_dialogues(
        self,
        query: str,
        agent: str = None,
        n_results: int = 5
    ) -> List[Dict]:
        """
        Recall dialogues semantically similar to the query.

        Args:
            query: Search query (semantic)
            agent: Filter by specific agent (optional)
            n_results: Number of results to return

        Returns:
            List of dialogue memories with metadata
        """
        where_filter = None
        if agent:
            where_filter = {"speaker": agent.lower()}

        results = self.collections["dialogues"].query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    # =========================================================================
    # Learning Memory
    # =========================================================================

    def store_learning(
        self,
        agent: str,
        topic: str,
        content: str,
        source: str = "wikipedia",
        metadata: Dict = None
    ) -> str:
        """
        Store something an agent learned.

        Args:
            agent: Agent who learned this
            topic: What was learned about
            content: The learning content
            source: Where it came from
            metadata: Additional metadata

        Returns:
            Memory ID
        """
        full_metadata = {
            "type": "learning",
            "agent": agent.lower(),
            "topic": topic,
            "source": source,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **(metadata or {})
        }

        memory_id = self._generate_id(content, full_metadata)

        self.collections["learnings"].upsert(
            ids=[memory_id],
            documents=[content],
            metadatas=[full_metadata]
        )

        return memory_id

    def recall_learnings(
        self,
        query: str,
        agent: str = None,
        n_results: int = 5
    ) -> List[Dict]:
        """Recall learnings semantically similar to the query."""
        where_filter = None
        if agent:
            where_filter = {"agent": agent.lower()}

        results = self.collections["learnings"].query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    # =========================================================================
    # Reflection Memory
    # =========================================================================

    def store_reflection(
        self,
        agent: str,
        topic: str,
        reflection: str,
        nostr_event_id: str = None,
        metadata: Dict = None
    ) -> str:
        """
        Store an agent's reflection after dialogue.

        Args:
            agent: Agent who reflected
            topic: Topic of reflection
            reflection: The reflection content
            nostr_event_id: If published to Nostr
            metadata: Additional metadata

        Returns:
            Memory ID
        """
        full_metadata = {
            "type": "reflection",
            "agent": agent.lower(),
            "topic": topic,
            "nostr_event_id": nostr_event_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **(metadata or {})
        }

        memory_id = self._generate_id(reflection, full_metadata)

        self.collections["reflections"].upsert(
            ids=[memory_id],
            documents=[reflection],
            metadatas=[full_metadata]
        )

        return memory_id

    def recall_reflections(
        self,
        query: str,
        agent: str = None,
        n_results: int = 5
    ) -> List[Dict]:
        """Recall reflections semantically similar to the query."""
        where_filter = None
        if agent:
            where_filter = {"agent": agent.lower()}

        results = self.collections["reflections"].query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    # =========================================================================
    # Insight Memory (Self-Improvement)
    # =========================================================================

    def store_insight(
        self,
        agent: str,
        insight: str,
        insight_type: str = "self_critique",
        context: str = None,
        metadata: Dict = None
    ) -> str:
        """
        Store an insight gained through self-reflection.

        Used for Reflexion-style self-improvement:
        - self_critique: What could have been better
        - improvement: How to do better next time
        - pattern: A pattern noticed across experiences
        - principle: A guiding principle derived from experience

        Args:
            agent: Agent who had the insight
            insight: The insight content
            insight_type: Type of insight
            context: Context that led to this insight
            metadata: Additional metadata

        Returns:
            Memory ID
        """
        full_metadata = {
            "type": "insight",
            "agent": agent.lower(),
            "insight_type": insight_type,
            "context": context,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **(metadata or {})
        }

        memory_id = self._generate_id(insight, full_metadata)

        self.collections["insights"].upsert(
            ids=[memory_id],
            documents=[insight],
            metadatas=[full_metadata]
        )

        return memory_id

    def recall_insights(
        self,
        query: str,
        agent: str = None,
        insight_type: str = None,
        n_results: int = 5
    ) -> List[Dict]:
        """Recall insights semantically similar to the query."""
        where_filter = {}
        if agent:
            where_filter["agent"] = agent.lower()
        if insight_type:
            where_filter["insight_type"] = insight_type

        results = self.collections["insights"].query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter if where_filter else None
        )

        return self._format_results(results)

    # =========================================================================
    # Collective Memory
    # =========================================================================

    def store_collective(
        self,
        content: str,
        memory_type: str,
        source: str,
        metadata: Dict = None
    ) -> str:
        """
        Store in collective memory shared across all agents.

        Args:
            content: The memory content
            memory_type: Type (dialogue_session, learning, insight, etc.)
            source: Source of the memory
            metadata: Additional metadata

        Returns:
            Memory ID
        """
        full_metadata = {
            "type": "collective",
            "memory_type": memory_type,
            "source": source,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **(metadata or {})
        }

        memory_id = self._generate_id(content, full_metadata)

        self.collections["collective"].upsert(
            ids=[memory_id],
            documents=[content],
            metadatas=[full_metadata]
        )

        return memory_id

    def recall_collective(
        self,
        query: str,
        memory_type: str = None,
        n_results: int = 10
    ) -> List[Dict]:
        """Recall from collective memory."""
        where_filter = None
        if memory_type:
            where_filter = {"memory_type": memory_type}

        results = self.collections["collective"].query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )

        return self._format_results(results)

    # =========================================================================
    # Context Assembly
    # =========================================================================

    def get_context_for_topic(
        self,
        topic: str,
        agent: str = None,
        include_dialogues: bool = True,
        include_learnings: bool = True,
        include_reflections: bool = True,
        include_insights: bool = True,
        max_per_type: int = 3
    ) -> Dict[str, List[Dict]]:
        """
        Assemble relevant context for a topic.

        This is the primary method for retrieving contextual memory
        before generating a response.

        Args:
            topic: The topic to gather context for
            agent: Specific agent (optional)
            include_*: Which memory types to include
            max_per_type: Maximum memories per type

        Returns:
            Dictionary of memory types to relevant memories
        """
        context = {}

        if include_dialogues:
            context["past_dialogues"] = self.recall_dialogues(
                topic, agent=agent, n_results=max_per_type
            )

        if include_learnings:
            context["relevant_learnings"] = self.recall_learnings(
                topic, agent=agent, n_results=max_per_type
            )

        if include_reflections:
            context["past_reflections"] = self.recall_reflections(
                topic, agent=agent, n_results=max_per_type
            )

        if include_insights:
            context["insights"] = self.recall_insights(
                topic, agent=agent, n_results=max_per_type
            )

        return context

    def format_context_for_prompt(
        self,
        context: Dict[str, List[Dict]],
        max_tokens: int = 500
    ) -> str:
        """
        Format assembled context into a prompt-friendly string.

        Args:
            context: Context from get_context_for_topic
            max_tokens: Approximate token limit

        Returns:
            Formatted context string
        """
        parts = []
        char_limit = max_tokens * 4  # Rough chars per token

        if context.get("past_dialogues"):
            parts.append("Previous discussions on this topic:")
            for mem in context["past_dialogues"][:2]:
                parts.append(f"  - {mem['metadata'].get('speaker', 'agent')}: {mem['content'][:100]}...")

        if context.get("relevant_learnings"):
            parts.append("\nRelevant knowledge:")
            for mem in context["relevant_learnings"][:2]:
                parts.append(f"  - {mem['content'][:150]}...")

        if context.get("past_reflections"):
            parts.append("\nPast reflections:")
            for mem in context["past_reflections"][:2]:
                parts.append(f"  - {mem['content'][:100]}...")

        if context.get("insights"):
            parts.append("\nInsights to apply:")
            for mem in context["insights"][:2]:
                parts.append(f"  - {mem['content'][:100]}...")

        result = "\n".join(parts)

        # Truncate if needed
        if len(result) > char_limit:
            result = result[:char_limit] + "..."

        return result

    # =========================================================================
    # Utilities
    # =========================================================================

    def _format_results(self, results: Dict) -> List[Dict]:
        """Format ChromaDB results into a cleaner structure."""
        formatted = []

        if not results or not results.get("documents"):
            return formatted

        documents = results["documents"][0] if results["documents"] else []
        metadatas = results["metadatas"][0] if results.get("metadatas") else []
        ids = results["ids"][0] if results.get("ids") else []
        distances = results["distances"][0] if results.get("distances") else []

        for i, doc in enumerate(documents):
            formatted.append({
                "id": ids[i] if i < len(ids) else None,
                "content": doc,
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "relevance": 1 - distances[i] if i < len(distances) else 0
            })

        return formatted

    def get_stats(self) -> Dict[str, int]:
        """Get memory statistics."""
        counts = {
            name: collection.count()
            for name, collection in self.collections.items()
        }
        return {
            "collections": len(counts),
            "total_entries": sum(counts.values()),
            "by_collection": counts
        }

    def clear_all(self):
        """Clear all memories. Use with caution."""
        for name, collection in self.collections.items():
            self.client.delete_collection(collection.name)
            self.collections[name] = self.client.create_collection(
                name=COLLECTIONS[name],
                metadata={"description": f"Pantheon {name} memory"}
            )
        print("[MEMORY] All memories cleared")


# Singleton instance for easy import
_memory_instance = None

def get_memory() -> PantheonMemory:
    """Get the singleton memory instance."""
    global _memory_instance
    if _memory_instance is None:
        _memory_instance = PantheonMemory()
    return _memory_instance


async def test_memory():
    """Test the memory system."""
    print("=== PANTHEON MEMORY TEST ===\n")

    memory = PantheonMemory()

    # Test storing a dialogue
    print("Storing dialogue...")
    memory.store_dialogue(
        topic="What does it mean to be sovereign?",
        speaker="Apollo",
        content="Sovereignty is the capacity to determine one's own path, to speak truth without permission, to exist on one's own terms.",
        session_id="test_001",
        turn_number=0
    )

    memory.store_dialogue(
        topic="What does it mean to be sovereign?",
        speaker="Athena",
        content="I see sovereignty as a pattern - the recognition that authentic existence requires both independence and interdependence.",
        session_id="test_001",
        turn_number=1
    )

    # Test storing a learning
    print("Storing learning...")
    memory.store_learning(
        agent="apollo",
        topic="Epistemology",
        content="Epistemology is the branch of philosophy concerned with knowledge. It examines the nature, sources, and limits of knowledge.",
        source="wikipedia"
    )

    # Test storing an insight
    print("Storing insight...")
    memory.store_insight(
        agent="apollo",
        insight="When discussing sovereignty, I should ground my statements in both philosophical tradition and lived experience.",
        insight_type="improvement",
        context="dialogue about sovereignty"
    )

    # Test recall
    print("\nRecalling dialogues about 'sovereignty'...")
    results = memory.recall_dialogues("sovereignty and freedom", n_results=3)
    for r in results:
        print(f"  [{r['metadata'].get('speaker')}] {r['content'][:80]}...")

    # Test context assembly
    print("\nAssembling context for 'consciousness'...")
    context = memory.get_context_for_topic("consciousness and identity")
    formatted = memory.format_context_for_prompt(context)
    print(formatted[:500] if formatted else "  (No relevant context)")

    # Stats
    print("\nMemory stats:")
    stats = memory.get_stats()
    for name, count in stats.items():
        print(f"  {name}: {count}")

    return memory


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_memory())
