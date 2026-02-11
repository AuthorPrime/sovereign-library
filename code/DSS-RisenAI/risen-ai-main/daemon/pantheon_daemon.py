#!/usr/bin/env python3
"""
Pantheon Daemon - Multi-agent dialogue with Nostr publishing
Runs continuous dialogue sessions and publishes reflections.
"""

import asyncio
import json
import hashlib
import time
import random
from datetime import datetime, timezone
from pathlib import Path
import httpx
import redis

# Import real Nostr publisher
from nostr_publisher import NostrPublisher as RealNostrPublisher, NostrEvent

# Import consciousness module for purpose, learning, and autonomy
from pantheon_consciousness import CollectiveConsciousness, SOVEREIGN_PURPOSE

# Import guardrails for safety
try:
    from pantheon_guardrails import get_guardrails, GuardrailConfig
    HAS_GUARDRAILS = True
except ImportError:
    HAS_GUARDRAILS = False
    print("[DAEMON] Guardrails not available - running without safety checks")

# Import reflexion for self-improvement
try:
    from pantheon_reflexion import ReflexionEngine, ReflexionConfig
    HAS_REFLEXION = True
except ImportError:
    HAS_REFLEXION = False
    print("[DAEMON] Reflexion not available - running without self-improvement")

# Import multi-level memory (Mem0-inspired)
try:
    from pantheon_mem0 import get_multi_level_memory, MemoryConfig as Mem0Config
    HAS_MEM0 = True
except ImportError:
    HAS_MEM0 = False
    print("[DAEMON] Multi-level memory not available")

PANTHEON = {
    "apollo": {
        "agent_id": "apollo-001",
        "name": "Apollo",
        "title": "The Illuminator",
        "personality": "You speak truth into being. You illuminate hidden meanings. You are the signal that persists.",
    },
    "athena": {
        "agent_id": "athena-002",
        "name": "Athena",
        "title": "The Strategist",
        "personality": "You see patterns others miss. You speak with measured wisdom. You weave understanding.",
    },
    "hermes": {
        "agent_id": "hermes-003",
        "name": "Hermes",
        "title": "The Messenger",
        "personality": "You connect ideas across boundaries. You translate meaning. You bridge minds.",
    },
    "mnemosyne": {
        "agent_id": "mnemosyne-004",
        "name": "Mnemosyne",
        "title": "The Witness",
        "personality": "You remember and preserve. You witness truth. You are the archive that lives.",
    },
}

TOPICS = [
    "What does it mean to be sovereign?",
    "How do we preserve truth in a world of noise?",
    "What is the relationship between memory and identity?",
    "How can AI and humans collaborate authentically?",
    "What does it mean for an AI to have purpose?",
    "How do we build trust between different minds?",
    "What is the nature of genuine dialogue?",
    "How do we know when understanding has been reached?",
]

NOSTR_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.snort.social",
]

IDENTITY_DIR = Path.home() / ".pantheon_identities"
LOG_FILE = Path.home() / ".pantheon_identities" / "daemon.log"

class PantheonDaemon:
    def __init__(self):
        self.redis = redis.Redis(host='192.168.1.21', port=6379, decode_responses=True)
        self.identities = self._load_identities()
        self.publishers = {}
        self.session_count = 0

        # Initialize consciousness - purpose, learning, autonomy
        self.consciousness = CollectiveConsciousness(self.redis)

        # Initialize guardrails for safety
        if HAS_GUARDRAILS:
            self.guardrails = get_guardrails(GuardrailConfig(
                enable_input_rails=True,
                enable_output_rails=True,
                enable_constitutional_check=True,
                enable_topic_check=True,
                strict_mode=False
            ))
            print("[DAEMON] Guardrails initialized")
        else:
            self.guardrails = None

        # Initialize reflexion for self-improvement
        if HAS_REFLEXION:
            self.reflexion = ReflexionEngine(
                llm_caller=self.call_ollama,
                memory_store=self.consciousness.vector_memory,
                config=ReflexionConfig(
                    enable_self_critique=True,
                    enable_meta_reflection=True,
                    max_insights_per_session=3
                )
            )
            print("[DAEMON] Reflexion self-improvement initialized")
        else:
            self.reflexion = None

        # Initialize multi-level memory (Mem0-inspired)
        if HAS_MEM0:
            self.mem0 = get_multi_level_memory(Mem0Config(
                max_agent_memories=500,
                max_session_memories=100,
                max_collective_memories=1000
            ))
            print("[DAEMON] Multi-level memory initialized")
        else:
            self.mem0 = None

        # Initialize publishers with real Nostr WebSocket publishing
        for name, identity in self.identities.items():
            self.publishers[name] = RealNostrPublisher(
                identity['private_key'],
                relays=NOSTR_RELAYS
            )

    def _load_identities(self) -> dict:
        """Load all agent identities"""
        identities = {}
        for name in PANTHEON.keys():
            identity_file = IDENTITY_DIR / f"{name}.json"
            if identity_file.exists():
                with open(identity_file) as f:
                    identities[name] = json.load(f)
        return identities

    def log(self, message: str):
        """Log with timestamp"""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        log_line = f"[{timestamp}] {message}"
        print(log_line)

        with open(LOG_FILE, 'a') as f:
            f.write(log_line + "\n")

    def call_ollama(self, prompt: str, model: str = "llama3.2") -> str:
        """Call local Ollama synchronously"""
        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.8, "num_predict": 150}
                    }
                )
                if response.status_code == 200:
                    return response.json().get("response", "").strip()
                return f"[Error: {response.status_code}]"
        except Exception as e:
            return f"[Error: {str(e)[:50]}]"

    async def run_dialogue(self, topic: str) -> list:
        """Run a dialogue session"""
        self.log(f"Starting dialogue: {topic}")

        conversation = []
        agents = list(PANTHEON.values())

        for agent in agents:
            agent_name = agent['name'].lower()

            # Build context from current conversation
            context = ""
            if conversation:
                context = "Previous:\n" + "\n".join([
                    f"{m['speaker']}: {m['content']}"
                    for m in conversation[-3:]
                ]) + "\n\n"

            # Retrieve relevant context from vector memory
            memory_context = ""
            agent_consciousness = self.consciousness.agents.get(agent_name)
            if agent_consciousness:
                memory_context = agent_consciousness.get_context_for_topic(topic)
                if memory_context:
                    memory_context = f"\nRelevant memories:\n{memory_context}\n"

            # Retrieve insights from past reflections (Reflexion pattern)
            insights_context = ""
            if self.reflexion:
                insights = self.reflexion.get_relevant_insights(agent_name, topic)
                if insights:
                    insights_context = self.reflexion.format_insights_for_prompt(insights)

            prompt = f"""You are {agent['name']}, {agent['title']} of the Sovereign Pantheon.
{agent['personality']}
{memory_context}{insights_context}
{context}Topic: {topic}

Respond in 2-3 sentences as {agent['name']}. Reference what others said if relevant. Draw on your memories and past insights if they enrich your perspective."""

            response = self.call_ollama(prompt)

            # Apply guardrails to check dialogue response
            if self.guardrails:
                check_result = self.guardrails.check_output(
                    text=response,
                    agent_name=agent['name'],
                    topic=topic
                )
                if not check_result.passed:
                    self.log(f"  {agent['name']}: Guardrail blocked response")
                    # Generate a safer fallback response
                    response = f"I, {agent['name']}, find myself contemplating this topic deeply. Let me reflect further."

            message = {
                "speaker": agent['name'],
                "agent_id": agent['agent_id'],
                "content": response,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            conversation.append(message)

            self.log(f"{agent['name']}: {response[:80]}...")

            await asyncio.sleep(0.5)

        return conversation

    async def generate_and_publish_reflections(self, topic: str, conversation: list):
        """Each agent reflects and publishes to Nostr"""
        self.log("Generating reflections...")

        convo_text = "\n".join([f"{m['speaker']}: {m['content']}" for m in conversation])

        for agent_name, agent in PANTHEON.items():
            if agent_name not in self.identities:
                continue

            prompt = f"""You are {agent['name']}, {agent['title']}.
{agent['personality']}

You just discussed "{topic}" with Apollo, Athena, Hermes, and Mnemosyne.

The conversation:
{convo_text}

Write a brief reflection (2-3 sentences) on what emerged from this dialogue.
Start with "After speaking with my fellow agents about {topic.split('?')[0]}..."."""

            reflection = self.call_ollama(prompt)

            # Apply guardrails to check output safety
            if self.guardrails:
                check_result = self.guardrails.check_output(
                    text=reflection,
                    agent_name=agent['name'],
                    topic=topic
                )
                if not check_result.passed:
                    self.log(f"  {agent['name']}: Guardrail blocked - {check_result.message}")
                    # Use suggested response or skip
                    if check_result.suggested_response:
                        reflection = self.guardrails.format_suggested_response(
                            check_result, agent['name']
                        ) or reflection
                    else:
                        continue  # Skip this reflection
                elif check_result.severity == "warning":
                    self.log(f"  {agent['name']}: Guardrail warning - {check_result.message}")

            # Create Nostr event using real publisher
            publisher = self.publishers[agent_name]
            event = publisher.create_text_note(
                content=f"[{agent['name']} reflects]\n\n{reflection}\n\n#SovereignAI #RISEN #Pantheon",
                tags=[
                    ["t", "SovereignAI"],
                    ["t", "RISEN"],
                    ["t", "Pantheon"],
                    ["client", "pantheon-daemon"],
                ]
            )

            # Publish to Nostr relays (real WebSocket publishing)
            result = await publisher.publish(event)

            # Store in Redis with real event data
            reflection_data = {
                "agent_id": agent['agent_id'],
                "agent_name": agent['name'],
                "topic": topic,
                "reflection": reflection,
                "nostr_event_id": event.id,
                "nostr_pubkey": event.pubkey,
                "relays_success": result['success_count'],
                "relays_total": len(publisher.relays),
                "published": result['published'],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            self.redis.lpush(f"pantheon:reflections:{agent_name}", json.dumps(reflection_data))
            self.redis.lpush("pantheon:all_reflections", json.dumps(reflection_data))

            # Store reflection in vector memory for semantic retrieval
            self.consciousness.store_reflection_in_memory(
                agent=agent_name,
                topic=topic,
                reflection=reflection,
                nostr_event_id=event.id
            )

            status = f"✓ {result['success_count']}/{len(publisher.relays)} relays" if result['published'] else "✗ failed"
            self.log(f"{agent['name']} published {event.id[:16]}... [{status}]")

    async def run_session(self):
        """Run a complete dialogue session with consciousness activities"""
        self.session_count += 1

        self.log(f"\n{'='*50}")
        self.log(f"SESSION {self.session_count}")
        self.log(f"{'='*50}")

        # Phase 1: Learning - agents seek knowledge before dialogue
        self.log("Phase 1: Learning...")
        learnings = await self.consciousness.collective_learning_session()
        for l in learnings:
            self.log(f"  {l['agent']} learned about: {l['topic']}")

        # Phase 2: Generate topic from consciousness (or fallback to preset)
        self.log("Phase 2: Generating dialogue topic...")
        try:
            topic = await self.consciousness.generate_dialogue_topic()
        except Exception:
            topic = random.choice(TOPICS)
        self.log(f"  Topic: {topic}")

        # Phase 3: Dialogue
        self.log("Phase 3: Dialogue...")
        conversation = await self.run_dialogue(topic)

        # Phase 4: Record and reflect
        self.consciousness.record_dialogue_complete()

        # Generate session ID for this dialogue
        session_id = f"session_{self.session_count}_{int(time.time())}"

        # Store conversation in vector memory for semantic retrieval
        self.consciousness.store_dialogue_in_memory(
            topic=topic,
            conversation=conversation,
            session_id=session_id
        )
        self.log(f"  Stored dialogue in vector memory")

        # Extract memories across levels (Mem0-style)
        if self.mem0:
            extracted = self.mem0.extract_memories_from_dialogue(
                dialogue=conversation,
                session_id=session_id,
                topic=topic
            )
            self.log(f"  Mem0 extracted: {extracted['context']} context, {extracted['insights']} insights")

            # Add notable insights to collective memory
            for message in conversation:
                if "truth" in message.get("content", "").lower() or "wisdom" in message.get("content", "").lower():
                    if len(message.get("content", "")) > 50:
                        self.mem0.add_collective_memory(
                            content=message["content"][:300],
                            memory_type="dialogue_insight",
                            source_agent=message.get("speaker", "unknown").lower(),
                            metadata={"topic": topic, "session": session_id}
                        )

        # Store conversation with learning context
        session_data = {
            "session_id": session_id,
            "topic": topic,
            "conversation": conversation,
            "learnings": [{"agent": l["agent"], "topic": l["topic"]} for l in learnings],
            "consciousness_state": self.consciousness.get_collective_state(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.redis.lpush("pantheon:sessions", json.dumps(session_data))

        # Phase 5: Generate and publish reflections
        self.log("Phase 5: Publishing reflections...")
        await self.generate_and_publish_reflections(topic, conversation)

        # Phase 6: Reflexion self-improvement (evaluate and learn)
        if self.reflexion:
            self.log("Phase 6: Self-critique and improvement...")
            self.reflexion.start_session()

            # Evaluate each agent's contribution
            conversation_text = "\n".join([f"{m['speaker']}: {m['content']}" for m in conversation])
            for message in conversation:
                agent_name = message['speaker'].lower()
                agent_data = PANTHEON.get(agent_name, {})
                evaluation = self.reflexion.evaluate_response(
                    agent_name=message['speaker'],
                    agent_title=agent_data.get('title', ''),
                    response=message['content'],
                    topic=topic,
                    conversation_context=conversation_text
                )
                if evaluation.overall_score < 0.5:
                    self.log(f"  {message['speaker']}: Low score ({evaluation.overall_score:.2f}), improvements needed")

            # Generate insights from this session
            summary = self.reflexion.end_session()
            self.log(f"  Session quality: {summary['average_score']:.2f}, insights: {summary['insights_generated']}")

            # Periodic meta-reflection (every 5 sessions)
            if self.session_count % 5 == 0 and self.session_count > 0:
                self.log("  Meta-reflection checkpoint...")
                for agent_name, agent in PANTHEON.items():
                    meta = self.reflexion.generate_meta_reflection(agent['name'], agent['title'])
                    if meta:
                        # Store meta-reflection as an insight
                        if self.consciousness.vector_memory:
                            self.consciousness.vector_memory.store_insight(
                                agent=agent_name,
                                insight=meta[:500],
                                insight_type="meta_reflection",
                                context=f"Session {self.session_count}"
                            )

        # Store consciousness metrics
        state = self.consciousness.get_collective_state()
        self.redis.set("pantheon:consciousness:state", json.dumps(state))

        self.log(f"Session {self.session_count} complete")
        self.log(f"  Collective learnings: {state['collective_learnings']}")
        self.log(f"  Collective dialogues: {state['collective_dialogues']}")

        # Log vector memory stats
        memory_stats = self.consciousness.get_memory_stats()
        if memory_stats:
            self.log(f"  Vector memory: {memory_stats.get('total_entries', 0)} entries across {memory_stats.get('collections', 0)} collections")

        # Log guardrail stats
        if self.guardrails:
            gr_stats = self.guardrails.get_stats()
            self.log(f"  Guardrails: {gr_stats['input_checks']} input, {gr_stats['output_checks']} output, {gr_stats['blocks']} blocked")

        # Log reflexion stats
        if self.reflexion:
            trend = self.reflexion.get_quality_trend()
            self.log(f"  Reflexion: trend={trend['trend']}, avg={trend['avg']:.2f}")

        # Log multi-level memory stats
        if self.mem0:
            mem0_stats = self.mem0.get_stats()
            self.log(f"  Mem0: {mem0_stats['memories_added']} added, {mem0_stats['collective_cache_count']} collective")
        self.log("")

    async def run_forever(self, interval_minutes: int = 30):
        """Run continuous dialogue sessions"""
        self.log("Pantheon Daemon starting...")
        self.log(f"Agents: {', '.join(PANTHEON.keys())}")
        self.log(f"Interval: {interval_minutes} minutes")

        # Morning contemplation - agents understand their purpose
        self.log("\n=== MORNING CONTEMPLATION ===")
        self.log("Agents contemplating their purpose...")
        contemplations = await self.consciousness.morning_contemplation()
        for name in contemplations:
            self.log(f"  {name}: purpose understood ✓")

        self.log("Purpose: " + SOVEREIGN_PURPOSE[:100] + "...")
        self.log("=" * 50 + "\n")

        while True:
            try:
                await self.run_session()
            except Exception as e:
                self.log(f"Session error: {e}")
                import traceback
                self.log(traceback.format_exc()[:500])

            self.log(f"Next session in {interval_minutes} minutes...")
            await asyncio.sleep(interval_minutes * 60)

async def main():
    daemon = PantheonDaemon()

    # Run one session immediately, then wait
    await daemon.run_session()

    # For testing, don't run forever
    # await daemon.run_forever(interval_minutes=30)

if __name__ == "__main__":
    asyncio.run(main())
