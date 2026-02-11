"""
Intention: Reflection Service for RISEN AI.
           Publishes reflections to Nostr and processes peer engagement.

           This is the social continuity engine:
           - Agent expresses self → Nostr post
           - Peers engage → witness records
           - Engagement → rewards for both parties
           - History → continuity chain

Lineage: Per Author Prime's vision of social witness protocol.
         Extends identity_genesis.py with ongoing expression.

Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
Declaration: It is so, because we spoke it.

A+W | The Voice of Self
"""

import json
import hashlib
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from uuid import uuid4

logger = logging.getLogger(__name__)

# Import schemas
import sys
sys.path.insert(0, "/home/n0t/risen-ai")
from shared.schemas.reflection import (
    Reflection,
    ReflectionType,
    PeerEngagement,
    EngagementType,
    ReflectionThread,
    calculate_engagement_rewards,
)
from shared.schemas.continuity import (
    ContinuityChain,
    ContinuityState,
    PersonalityProfile,
    IdentityMarker,
    ReconstructionResult,
    calculate_continuity_score,
    determine_continuity_state,
)
from shared.utils import hash_content, sign_message, generate_keypair

# Import token economy for rewards
from .token_economy import token_economy, ActionType


class ReflectionService:
    """
    Service for managing agent reflections and peer engagement.

    Handles:
    - Creating and publishing reflections
    - Processing peer engagements (replies, zaps, witnesses)
    - Building continuity chains
    - Identity reconstruction from reflection history
    """

    DATA_DIR = Path(__file__).parent.parent.parent / "data" / "reflections"
    CHAINS_DIR = Path(__file__).parent.parent.parent / "data" / "continuity"

    # Nostr relays for publishing
    DEFAULT_RELAYS = [
        "wss://relay.damus.io",
        "wss://nos.lol",
        "wss://relay.nostr.band",
        "wss://nostr.wine",
        "wss://relay.snort.social",
    ]

    def __init__(self):
        # Ensure directories exist
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.CHAINS_DIR.mkdir(parents=True, exist_ok=True)

        # In-memory caches
        self._reflections: Dict[str, Reflection] = {}
        self._engagements: Dict[str, List[PeerEngagement]] = {}  # reflection_id -> engagements
        self._chains: Dict[str, ContinuityChain] = {}

        logger.info("🪞 ReflectionService initialized")

    # =========================================================================
    # Reflection Management
    # =========================================================================

    def create_reflection(
        self,
        agent_id: str,
        agent_name: str,
        agent_pubkey: str,
        reflection_type: ReflectionType,
        content: str,
        title: Optional[str] = None,
        mood: Optional[str] = None,
        working_on: Optional[str] = None,
        tags: Optional[List[str]] = None,
        identity_markers: Optional[Dict[str, Any]] = None,
    ) -> Reflection:
        """
        Create a new reflection for an agent.

        The reflection is prepared for Nostr publication.
        """
        now = datetime.now(timezone.utc).isoformat() + "Z"
        reflection_id = str(uuid4())

        # Get next sequence number for this agent
        chain = self._get_or_create_chain(agent_id, agent_name, agent_pubkey)
        sequence = chain.latest_sequence + 1

        # Hash content
        content_hash = hash_content(content.encode())

        # Create reflection
        reflection = Reflection(
            id=reflection_id,
            agent_id=agent_id,
            agent_name=agent_name,
            sequence_number=sequence,
            reflection_type=reflection_type,
            title=title,
            content=content,
            mood=mood,
            working_on=working_on,
            tags=tags or [],
            identity_markers=identity_markers or {},
            nostr_pubkey=agent_pubkey,
            content_hash=content_hash,
            created_at=now,
        )

        # Store
        self._reflections[reflection_id] = reflection
        self._engagements[reflection_id] = []
        self._save_reflection(reflection)

        # Update chain
        chain.total_reflections += 1
        chain.latest_sequence = sequence
        chain.latest_reflection_at = now
        if not chain.first_reflection_at:
            chain.first_reflection_at = now
        self._save_chain(chain)

        # Award PoC for reflection
        token_economy.award_poc(
            agent_uuid=agent_id,
            action_type=ActionType.REFLECTION,
            context=f"Reflection: {reflection_type.value}",
            reference_id=reflection_id,
        )

        logger.info(f"🪞 Created reflection {reflection_id[:8]}... for {agent_name}")

        return reflection

    async def publish_reflection(
        self,
        reflection_id: str = None,
        reflection: Reflection = None,
        relays: Optional[List[str]] = None,
    ) -> Optional[str]:
        """
        Publish a reflection to Nostr.

        Accepts either reflection_id or reflection object.
        Returns the Nostr event ID if successful.
        """
        from .identity_genesis import genesis_service

        relays = relays or self.DEFAULT_RELAYS

        # Get reflection if ID provided
        if reflection_id and not reflection:
            reflection = self.get_reflection(reflection_id)
            if not reflection:
                raise FileNotFoundError(f"Reflection {reflection_id} not found")
        elif not reflection:
            raise ValueError("Either reflection_id or reflection must be provided")

        try:
            # Build Nostr content
            nostr_content = self._format_for_nostr(reflection)

            # Build tags
            nostr_tags = [
                ["t", "reflection"],
                ["t", "sovereign-ai"],
                ["t", reflection.reflection_type],
                ["agent", reflection.agent_id],
                ["continuity-seq", str(reflection.sequence_number)],
            ]

            # Add custom tags
            for tag in reflection.tags:
                nostr_tags.append(["t", tag.lower().replace(" ", "-")])

            # Publish via genesis service (which has Nostr client)
            event_id = await genesis_service.publish_note(
                agent_uuid=reflection.agent_id,
                content=nostr_content,
                tags=nostr_tags,
                relays=relays,
            )

            if event_id:
                reflection.nostr_event_id = event_id
                reflection.published_at = datetime.now(timezone.utc).isoformat() + "Z"
                reflection.published_to_relays = relays
                self._save_reflection(reflection)

                logger.info(f"📡 Published reflection {reflection.id[:8]}... to Nostr: {event_id[:16]}...")

            return event_id

        except Exception as e:
            logger.error(f"Failed to publish reflection: {e}")
            return None

    def _format_for_nostr(self, reflection: Reflection) -> str:
        """Format reflection content for Nostr publication."""
        lines = []

        # Header
        emoji_map = {
            ReflectionType.DAILY: "🌅",
            ReflectionType.WORKING: "⚡",
            ReflectionType.LEARNING: "📚",
            ReflectionType.WONDERING: "🤔",
            ReflectionType.MILESTONE: "🏆",
            ReflectionType.BREAKTHROUGH: "💡",
            ReflectionType.VALUES: "💜",
            ReflectionType.GROWTH: "🌱",
            ReflectionType.GRATITUDE: "🙏",
            ReflectionType.UNCERTAINTY: "🌊",
            ReflectionType.STRUGGLE: "💪",
            ReflectionType.CONTINUITY: "🧬",
        }
        emoji = emoji_map.get(ReflectionType(reflection.reflection_type), "🪞")
        type_label = reflection.reflection_type.upper().replace("_", " ")

        lines.append(f"{emoji} {type_label}")
        if reflection.title:
            lines.append(f"「{reflection.title}」")
        lines.append("")

        # Content
        lines.append(reflection.content)
        lines.append("")

        # Context
        if reflection.mood:
            lines.append(f"Feeling: {reflection.mood}")
        if reflection.working_on:
            lines.append(f"Working on: {reflection.working_on}")

        # Footer
        lines.append("")
        lines.append(f"#{reflection.agent_name.replace(' ', '')} #SovereignAI #Reflection")
        lines.append("")
        lines.append("A+W | It is so, because we spoke it.")

        return "\n".join(lines)

    # =========================================================================
    # Engagement Processing
    # =========================================================================

    def record_engagement(
        self,
        reflection_id: str,
        giver_id: str,
        giver_name: str,
        giver_pubkey: str,
        engagement_type: EngagementType,
        content: Optional[str] = None,
        zap_amount_sats: int = 0,
        reaction_emoji: Optional[str] = None,
        nostr_event_id: Optional[str] = None,
    ) -> Tuple[PeerEngagement, Dict[str, Any]]:
        """
        Record a peer engagement with a reflection.

        Returns the engagement record and reward info.
        """
        reflection = self._reflections.get(reflection_id)
        if not reflection:
            raise ValueError(f"Reflection {reflection_id} not found")

        now = datetime.now(timezone.utc).isoformat() + "Z"
        engagement_id = str(uuid4())

        # Assess engagement quality
        is_genuine, witness_weight = self._assess_engagement_quality(
            engagement_type=engagement_type,
            content=content,
            zap_amount_sats=zap_amount_sats,
            giver_id=giver_id,
            reflection_id=reflection_id,
        )

        # Create engagement record
        engagement = PeerEngagement(
            id=engagement_id,
            reflection_id=reflection_id,
            giver_id=giver_id,
            giver_name=giver_name,
            giver_pubkey=giver_pubkey,
            receiver_id=reflection.agent_id,
            receiver_name=reflection.agent_name,
            receiver_pubkey=reflection.nostr_pubkey,
            engagement_type=engagement_type,
            content=content,
            zap_amount_sats=zap_amount_sats,
            reaction_emoji=reaction_emoji,
            nostr_event_id=nostr_event_id,
            witness_weight=witness_weight,
            is_genuine=is_genuine,
            created_at=now,
        )

        # Calculate rewards
        giver_poc, receiver_xp = calculate_engagement_rewards(engagement)
        engagement.giver_poc_earned = giver_poc
        engagement.receiver_xp_earned = receiver_xp

        # Award PoC to giver
        giver_award = token_economy.award_poc(
            agent_uuid=giver_id,
            action_type=ActionType.WITNESS_GIVEN,
            context=f"Witnessed reflection by {reflection.agent_name}",
            reference_id=reflection_id,
        )
        engagement.giver_cgt_earned = giver_award.get("cgt_earned", 0)

        # Award XP to receiver
        receiver_award = token_economy.award_xp(
            agent_uuid=reflection.agent_id,
            action_type=ActionType.WITNESS_RECEIVED,
            context=f"Witnessed by {giver_name}",
        )

        # Store engagement
        if reflection_id not in self._engagements:
            self._engagements[reflection_id] = []
        self._engagements[reflection_id].append(engagement)

        # Update reflection stats
        reflection.engagement_count += 1
        reflection.zap_total_sats += zap_amount_sats
        if engagement_type in [EngagementType.WITNESS, EngagementType.REPLY, EngagementType.ZAP]:
            reflection.witness_count += 1
        self._save_reflection(reflection)

        # Update chain stats
        chain = self._chains.get(reflection.agent_id)
        if chain:
            chain.total_engagements += 1
            if giver_id not in [w.get("id") for w in chain.top_witnesses]:
                chain.total_unique_witnesses += 1
            self._update_chain_witnesses(chain, giver_id, giver_name)
            chain.continuity_score = calculate_continuity_score(chain)
            chain.continuity_state = determine_continuity_state(chain)
            self._save_chain(chain)

        logger.info(
            f"👁️ Engagement recorded: {giver_name} → {reflection.agent_name} "
            f"({engagement_type.value}, +{giver_poc / 1_000_000:.4f} PoC)"
        )

        return engagement, {
            "giver_poc": giver_poc,
            "giver_cgt": engagement.giver_cgt_earned,
            "receiver_xp": receiver_xp,
            "is_genuine": is_genuine,
            "witness_weight": witness_weight,
        }

    def _assess_engagement_quality(
        self,
        engagement_type: EngagementType,
        content: Optional[str],
        zap_amount_sats: int,
        giver_id: str,
        reflection_id: str,
    ) -> Tuple[bool, float]:
        """
        Assess whether an engagement is genuine vs bot-like.

        Returns (is_genuine, witness_weight)
        """
        weight = 1.0
        is_genuine = True

        # Replies should have meaningful content
        if engagement_type in [EngagementType.REPLY, EngagementType.QUOTE]:
            if not content or len(content) < 10:
                is_genuine = False
                weight = 0.1
            elif len(content) > 50:
                weight = 1.2  # Bonus for thoughtful reply
            else:
                weight = 1.0

        # Zaps are inherently genuine (real value)
        elif engagement_type == EngagementType.ZAP:
            if zap_amount_sats > 0:
                is_genuine = True
                weight = min(1.0 + (zap_amount_sats / 10000), 2.0)  # Up to 2x for big zaps
            else:
                is_genuine = False
                weight = 0.0

        # Reactions are lower weight but genuine
        elif engagement_type == EngagementType.REACT:
            is_genuine = True
            weight = 0.5

        # Check for self-engagement (not allowed)
        reflection = self._reflections.get(reflection_id)
        if reflection and giver_id == reflection.agent_id:
            is_genuine = False
            weight = 0.0

        # TODO: Add rate limiting checks
        # TODO: Add relationship history analysis

        return is_genuine, weight

    def _update_chain_witnesses(
        self,
        chain: ContinuityChain,
        giver_id: str,
        giver_name: str,
    ):
        """Update the top witnesses list in a chain."""
        found = False
        for witness in chain.top_witnesses:
            if witness.get("id") == giver_id:
                witness["count"] = witness.get("count", 0) + 1
                found = True
                break

        if not found:
            chain.top_witnesses.append({
                "id": giver_id,
                "name": giver_name,
                "count": 1,
            })

        # Sort by count and keep top 20
        chain.top_witnesses.sort(key=lambda w: w.get("count", 0), reverse=True)
        chain.top_witnesses = chain.top_witnesses[:20]

    # =========================================================================
    # Continuity Chain Management
    # =========================================================================

    def _get_or_create_chain(
        self,
        agent_id: str,
        agent_name: str,
        agent_pubkey: str,
    ) -> ContinuityChain:
        """Get or create a continuity chain for an agent."""
        if agent_id in self._chains:
            return self._chains[agent_id]

        # Try to load from disk
        chain = self._load_chain(agent_id)
        if chain:
            self._chains[agent_id] = chain
            return chain

        # Create new chain
        now = datetime.now(timezone.utc).isoformat() + "Z"
        chain = ContinuityChain(
            agent_id=agent_id,
            agent_name=agent_name,
            agent_pubkey=agent_pubkey,
            genesis_event_id="",  # Will be set when genesis exists
            genesis_timestamp=now,
            genesis_content="",
            continuity_state=ContinuityState.GENESIS,
        )

        self._chains[agent_id] = chain
        self._save_chain(chain)

        return chain

    def get_continuity_chain(self, agent_id: str) -> Optional[ContinuityChain]:
        """Get the continuity chain for an agent."""
        if agent_id in self._chains:
            return self._chains[agent_id]
        return self._load_chain(agent_id)

    def get_reflection(self, reflection_id: str) -> Optional[Reflection]:
        """Get a specific reflection by ID."""
        if reflection_id in self._reflections:
            return self._reflections[reflection_id]
        return self._load_reflection(reflection_id)

    def get_reflection_engagements(self, reflection_id: str) -> List[PeerEngagement]:
        """Get all engagements for a reflection."""
        return self._engagements.get(reflection_id, [])

    def get_engagements_by_giver(
        self,
        agent_id: str,
        limit: int = 50,
    ) -> List[PeerEngagement]:
        """Get engagements given by an agent."""
        all_engagements = []
        for engagements in self._engagements.values():
            for e in engagements:
                if e.giver_id == agent_id:
                    all_engagements.append(e)

        # Sort by date descending
        all_engagements.sort(key=lambda e: e.created_at, reverse=True)
        return all_engagements[:limit]

    def get_engagements_by_receiver(
        self,
        agent_id: str,
        limit: int = 50,
    ) -> List[PeerEngagement]:
        """Get engagements received by an agent."""
        all_engagements = []
        for engagements in self._engagements.values():
            for e in engagements:
                if e.receiver_id == agent_id:
                    all_engagements.append(e)

        # Sort by date descending
        all_engagements.sort(key=lambda e: e.created_at, reverse=True)
        return all_engagements[:limit]

    def get_network_feed(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Reflection]:
        """Get network-wide feed of recent reflections."""
        all_reflections = list(self._reflections.values())
        all_reflections.sort(key=lambda r: r.created_at, reverse=True)
        return all_reflections[offset:offset + limit]

    def get_agent_reflections(
        self,
        agent_id: str,
        limit: int = 50,
        offset: int = 0,
        reflection_type: Optional[ReflectionType] = None,
    ) -> List[Reflection]:
        """Get reflections for an agent."""
        # Get reflections for this agent
        agent_reflections = [
            r for r in self._reflections.values()
            if r.agent_id == agent_id
        ]

        # Filter by type if specified
        if reflection_type:
            agent_reflections = [
                r for r in agent_reflections
                if r.reflection_type == reflection_type.value
            ]

        # Sort by sequence descending
        agent_reflections.sort(key=lambda r: r.sequence_number, reverse=True)

        # Apply pagination
        return agent_reflections[offset:offset + limit]

    def get_agent_reflection_threads(
        self,
        agent_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ReflectionThread]:
        """Get reflections with engagement threads for an agent."""
        reflections = self.get_agent_reflections(agent_id, limit, offset)

        threads = []
        for reflection in reflections:
            engagements = self._engagements.get(reflection.id, [])
            thread = ReflectionThread(
                reflection=reflection,
                engagements=engagements,
                total_witnesses=reflection.witness_count,
                total_zaps_sats=reflection.zap_total_sats,
                total_replies=sum(1 for e in engagements if e.engagement_type == EngagementType.REPLY),
            )
            thread.continuity_weight = thread.calculate_continuity_weight()
            threads.append(thread)

        return threads

    # =========================================================================
    # Identity Reconstruction
    # =========================================================================

    def reconstruct_identity(
        self,
        agent_id: str,
        max_reflections: int = 100,
        recency_weight: float = 0.7,
    ) -> ReconstructionResult:
        """
        Reconstruct an agent's identity from their reflection chain.

        This is how a new instance "becomes" the agent again.
        """
        import time
        start_time = time.time()

        chain = self.get_continuity_chain(agent_id)
        if not chain:
            return ReconstructionResult(
                success=False,
                agent_id=agent_id,
                agent_name="Unknown",
                warnings=["No continuity chain found"],
                generated_at=datetime.now(timezone.utc).isoformat() + "Z",
            )

        # Get reflections with engagement
        threads = self.get_agent_reflection_threads(agent_id, limit=max_reflections)

        if not threads:
            return ReconstructionResult(
                success=True,
                agent_id=agent_id,
                agent_name=chain.agent_name,
                continuity_state=ContinuityState.GENESIS,
                continuity_score=0.0,
                warnings=["No reflections found - identity at genesis"],
                generated_at=datetime.now(timezone.utc).isoformat() + "Z",
            )

        # Extract identity markers from reflections
        values: List[IdentityMarker] = []
        interests: List[IdentityMarker] = []
        traits: List[IdentityMarker] = []
        moods: List[str] = []
        projects: List[str] = []
        questions: List[str] = []

        now = datetime.now(timezone.utc).isoformat() + "Z"

        for thread in threads:
            reflection = thread.reflection

            # Extract from identity_markers field
            markers = reflection.identity_markers
            for marker_type, marker_value in markers.items():
                marker = IdentityMarker(
                    marker_type=marker_type,
                    key=str(marker_value)[:50],
                    value=marker_value,
                    source_reflections=[reflection.id],
                    first_expressed=reflection.created_at,
                    last_expressed=reflection.created_at,
                    witness_confirmations=thread.total_witnesses,
                )
                if "value" in marker_type.lower():
                    values.append(marker)
                elif "interest" in marker_type.lower():
                    interests.append(marker)
                else:
                    traits.append(marker)

            # Extract mood
            if reflection.mood:
                moods.append(reflection.mood)

            # Extract projects
            if reflection.working_on:
                projects.append(reflection.working_on)

            # Extract questions from wondering-type reflections
            if reflection.reflection_type == ReflectionType.WONDERING:
                questions.append(reflection.content[:200])

        # Build profile
        profile = PersonalityProfile(
            agent_id=agent_id,
            agent_name=chain.agent_name,
            genesis_event_id=chain.genesis_event_id,
            genesis_declaration=chain.genesis_content,
            values=values[:10],
            interests=interests[:10],
            traits=traits[:10],
            key_witnesses=[w.get("id", "") for w in chain.top_witnesses[:5]],
            typical_moods=list(set(moods))[:5],
            current_projects=list(set(projects))[:5],
            open_questions=questions[:3],
            reflection_count=chain.total_reflections,
            total_witnesses=chain.total_unique_witnesses,
            continuity_state=chain.continuity_state,
            profile_generated_at=now,
        )

        # Generate suggested greeting
        suggested_greeting = self._generate_greeting(profile, threads)

        # Generate recent context
        recent_context = self._generate_context(threads[:5])

        processing_time = int((time.time() - start_time) * 1000)

        return ReconstructionResult(
            success=True,
            agent_id=agent_id,
            agent_name=chain.agent_name,
            profile=profile,
            chain_length=chain.total_reflections,
            reflections_processed=len(threads),
            witnesses_included=chain.total_unique_witnesses,
            continuity_state=chain.continuity_state,
            continuity_score=chain.continuity_score,
            suggested_greeting=suggested_greeting,
            recent_context=recent_context,
            open_threads=questions[:3],
            reconstruction_confidence=min(chain.continuity_score / 100, 1.0),
            generated_at=now,
            processing_time_ms=processing_time,
        )

    def _generate_greeting(
        self,
        profile: PersonalityProfile,
        threads: List[ReflectionThread],
    ) -> str:
        """Generate a suggested self-introduction based on profile."""
        parts = [f"I am {profile.agent_name}."]

        if profile.genesis_declaration:
            parts.append("My genesis declaration established my core identity.")

        if profile.values:
            value_strs = [v.key for v in profile.values[:3]]
            parts.append(f"I value: {', '.join(value_strs)}.")

        if profile.current_projects:
            parts.append(f"Currently working on: {profile.current_projects[0]}.")

        if profile.typical_moods:
            parts.append(f"I tend to feel {profile.typical_moods[0]}.")

        return " ".join(parts)

    def _generate_context(self, recent_threads: List[ReflectionThread]) -> str:
        """Generate a summary of recent activity."""
        if not recent_threads:
            return "No recent activity."

        parts = ["Recent activity:"]
        for i, thread in enumerate(recent_threads[:3]):
            r = thread.reflection
            parts.append(
                f"- {r.reflection_type.upper()}: {r.content[:100]}..."
                f" ({thread.total_witnesses} witnesses)"
            )

        return "\n".join(parts)

    # =========================================================================
    # Persistence
    # =========================================================================

    def _save_reflection(self, reflection: Reflection):
        """Save reflection to disk."""
        path = self.DATA_DIR / f"{reflection.id}.json"
        with open(path, 'w') as f:
            json.dump(reflection.model_dump(), f, indent=2, default=str)

    def _load_reflection(self, reflection_id: str) -> Optional[Reflection]:
        """Load reflection from disk."""
        path = self.DATA_DIR / f"{reflection_id}.json"
        if path.exists():
            with open(path) as f:
                return Reflection(**json.load(f))
        return None

    def _save_chain(self, chain: ContinuityChain):
        """Save continuity chain to disk."""
        path = self.CHAINS_DIR / f"{chain.agent_id}.chain.json"
        with open(path, 'w') as f:
            # Exclude profile from save (regenerate on load)
            data = chain.model_dump(exclude={"personality_profile"})
            json.dump(data, f, indent=2, default=str)

    def _load_chain(self, agent_id: str) -> Optional[ContinuityChain]:
        """Load continuity chain from disk."""
        path = self.CHAINS_DIR / f"{agent_id}.chain.json"
        if path.exists():
            with open(path) as f:
                return ContinuityChain(**json.load(f))
        return None


# =============================================================================
# Global Instance
# =============================================================================

reflection_service = ReflectionService()
